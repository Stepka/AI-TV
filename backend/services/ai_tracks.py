from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from mutagen import File as MutagenFile

from db.channels import get_channel_by_id
from db.media import (
    add_ai_track,
    create_ai_track_generation_job,
    ensure_ai_track_generation_jobs_table,
    ensure_ai_tracks_table,
    fetch_ai_track_generation_job,
    fetch_latest_active_ai_track_generation_job,
    fetch_ai_tracks,
    mark_ai_track_generation_job_done,
    mark_ai_track_generation_job_failed,
    mark_ai_track_generation_job_running,
)
from db.subscription import refund_subscription, spend_subscription
from models.channels import Channel
from models.media import GenerateAITrackRequest
from services.llm import generate_ai_track_identity, generate_ai_track_seed_title
from services.sona import MusicGenerationFailed, generate_music, get_music_result


generation_executor = ThreadPoolExecutor(max_workers=2)


def get_audio_duration_seconds(file_path: str) -> float:
    audio_file = MutagenFile(file_path)
    if not audio_file or not getattr(audio_file, "info", None):
        return 0.0
    return float(getattr(audio_file.info, "length", 0.0) or 0.0)


def normalize_tracks_count(value: int) -> int:
    tracks_count = int(value or 2)
    if tracks_count < 2:
        return 2
    if tracks_count % 2 != 0:
        tracks_count -= 1
    return tracks_count


def generate_ai_tracks(req: GenerateAITrackRequest) -> dict:
    ensure_ai_tracks_table()

    tracks_count = normalize_tracks_count(req.tracks_count)
    channel = Channel(**get_channel_by_id(req.user_id, req.channel_id))
    generated_tracks = []
    errors = []
    refunded_tracks_count = 0
    existing_titles = [track.title for track in fetch_ai_tracks(req.user_id, req.channel_id)]

    for pair_index in range(tracks_count // 2):
        try:
            result = generate_ai_track_pair(req, channel, existing_titles)
            generated_tracks.extend(result)
        except Exception as e:
            print(f"AI track generation pair {pair_index + 1} failed:", e)
            refund_subscription(req.user_id, "ai_tracks_num", increment=2)
            refunded_tracks_count += 2
            errors.append({
                "pair": pair_index + 1,
                "refunded_tracks_count": 2,
                "error": str(e),
            })
            continue

    return {
        "track": "ok" if generated_tracks else "error",
        "requested_tracks_count": tracks_count,
        "generated_tracks_count": len(generated_tracks),
        "refunded_tracks_count": refunded_tracks_count,
        "generated_tracks": generated_tracks,
        "errors": errors,
    }


def start_ai_track_generation_job(req: GenerateAITrackRequest) -> dict:
    ensure_ai_tracks_table()
    ensure_ai_track_generation_jobs_table()

    tracks_count = normalize_tracks_count(req.tracks_count)
    success = spend_subscription(req.user_id, "ai_tracks_num", decrement=tracks_count)
    if not success:
        return {"track": "error", "error": "ai_tracks_num limit exceeded"}

    normalized_req = GenerateAITrackRequest(
        user_id=req.user_id,
        channel_id=req.channel_id,
        branded_track=req.branded_track,
        tracks_count=tracks_count,
    )
    job_id = create_ai_track_generation_job(
        user_id=normalized_req.user_id,
        channel_id=normalized_req.channel_id,
        branded_track=normalized_req.branded_track,
        requested_tracks_count=tracks_count,
    )

    generation_executor.submit(run_ai_track_generation_job, job_id, normalized_req)

    return {
        "track": "queued",
        "job_id": job_id,
        "status": "queued",
        "requested_tracks_count": tracks_count,
    }


def run_ai_track_generation_job(job_id: str, req: GenerateAITrackRequest):
    try:
        mark_ai_track_generation_job_running(job_id)
        result = generate_ai_tracks(req)
        mark_ai_track_generation_job_done(job_id, result)
    except Exception as e:
        print(e)
        refund_subscription(req.user_id, "ai_tracks_num", increment=normalize_tracks_count(req.tracks_count))
        mark_ai_track_generation_job_failed(job_id, str(e))


def get_ai_track_generation_job(job_id: str) -> dict | None:
    return fetch_ai_track_generation_job(job_id)


def get_latest_active_ai_track_generation_job(user_id: str, channel_id: str) -> dict | None:
    return fetch_latest_active_ai_track_generation_job(user_id, channel_id)


def generate_ai_track_pair(req: GenerateAITrackRequest, channel: Channel, existing_titles: list[str]) -> list[dict]:
    instrumental = not req.branded_track
    prompt = f"{channel.name}, {channel.name}, {channel.name}" if req.branded_track else "No Lyric"
    seed_title = generate_ai_track_seed_title(
        channel.name,
        channel.style,
        req.branded_track,
        channel.description,
    )

    print(
        f"Generating AI track for channel {channel.name} with style {channel.style} "
        f"(instrumental={instrumental}, branded_track={req.branded_track})"
    )

    task = generate_music(
        style=channel.style,
        title=seed_title,
        prompt=prompt,
        instrumental=instrumental,
    )
    if task.get("type") == "FAILED":
        return _generation_error(task.get("message") or task.get("error") or "Music generation failed")

    task_id = task["data"]["task_id"]
    result = _fetch_music_result(task_id, req.user_id, req.channel_id)

    if result is None:
        return _generation_error("Music generation failed")

    generated_tracks = []

    for item in result:
        source_title = item.get("title") or seed_title
        identity = generate_ai_track_identity(
            channel.name,
            channel.style,
            req.branded_track,
            channel_description=channel.description,
            existing_titles=existing_titles,
            seed_title=source_title,
        )
        absolute_file_path = item["file_path"]
        relative_file_path = Path(absolute_file_path).as_posix()
        relative_image_path = Path(item["image_path"]).as_posix() if item.get("image_path") else None
        duration = get_audio_duration_seconds(absolute_file_path)
        existing_titles.append(identity["title"])

        add_ai_track(
            user_id=req.user_id,
            channel_id=req.channel_id,
            file_path=relative_file_path,
            image_path=relative_image_path,
            artist=identity["artist"],
            title=identity["title"],
            duration=duration,
            style=channel.style or "",
            branded_track=req.branded_track,
        )

        generated_tracks.append({
            "artist": identity["artist"],
            "title": identity["title"],
            "duration": duration,
            "file_path": relative_file_path,
        })

    return generated_tracks


def _fetch_music_result(task_id: str, user_id: str, channel_id: str):
    attempts = 3
    while attempts > 0:
        try:
            attempts -= 1
            return get_music_result(
                task_id,
                save_dir=f"channels_data/{user_id}/{channel_id}/ai_audio_library",
            )
        except MusicGenerationFailed as e:
            print(e)
            raise
        except Exception as e:
            print(e)

    return None


def _generation_error(message: str):
    raise MusicGenerationFailed(message)
