import os
from pathlib import Path
import time

from fastapi import APIRouter, Query, Depends
from fastapi.responses import FileResponse
import requests
from models.channels import Channel
from db.channels import get_channel_by_id
from services.sona import generate_music, get_music_result
from models.media import GenerateAITrackRequest
from services.auth import get_current_user

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/speech")
def get_audio(filename: str, user_id: str, channel_id: str, user=Depends(get_current_user)):
    print("Serving audio file:", user_id, channel_id, filename)
    return FileResponse(f"channels_data/{user_id}/{channel_id}/speech/{filename}", media_type="audio/wav", filename=filename)


@router.get("/video")
def get_video(
    user_id: str = Query(...),
    channel_id: str = Query(...),
    filename: str = Query(...)
):
    print("Serving video file:", user_id, channel_id, filename)

    base_path = os.path.join(
        "channels_data",
        user_id,
        channel_id,
        "videos"
    )

    file_path = os.path.join(base_path, filename)

    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(
            file_path,
            media_type="video/mp4",
            filename=filename
        )

    # 🔁 fallback
    fallback_path = os.path.join(
        "channels_data",
        "common",
        "videos",
        "default_video.mp4"
    )

    if os.path.exists(fallback_path):
        return FileResponse(
            fallback_path,
            media_type="video/mp4",
            filename="fallback.mp4"
        )

    return {"error": "Video not found"}


@router.get("/ai_audio_library")
def list_ai_audio(
    user_id: str = Query(...),
    channel_id: str = Query(...)
):
    base_path = Path("channels_data") / user_id / channel_id / "ai_audio_library"
    base_path.mkdir(parents=True, exist_ok=True)

    files = []
    for file in base_path.glob("*"):
        if file.suffix.lower() in [".mp3", ".wav", ".ogg"]:
            files.append({
                "name": file.name,
                "url": f"channels_data/{user_id}/{channel_id}/ai_audio_library/{file.name}"
            })
    return {"files": files}


@router.post("/generate_ai_track")
def dj_transition(req: GenerateAITrackRequest, user=Depends(get_current_user)):
    
    
    channel = get_channel_by_id(req.user_id, req.channel_id)
    channel = Channel(**channel)

    task = generate_music(style=channel.style, title=channel.name, prompt=f"{channel.name}, {channel.name}, {channel.name}", instrumental=False)
    task_id = task["data"]["task_id"]

    # потом polling
    result = get_music_result(task_id, save_dir=f"channels_data/{req.user_id}/{req.channel_id}/ai_audio_library")

    print(result)

    return {"track": "ok"}