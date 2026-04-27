import os
from pathlib import Path
import re
import time
import uuid
from urllib.parse import urlparse

import requests

API_KEY = os.getenv("AIMUSIC_API_KEY")


def safe_file_stem(value: str) -> str:
    stem = re.sub(r"[^\w.-]+", "_", value.strip(), flags=re.UNICODE)
    stem = stem.strip("._")
    return stem or "track"


def unique_path(directory: Path, stem: str, suffix: str) -> Path:
    path = directory / f"{stem}{suffix}"
    if not path.exists():
        return path

    for index in range(2, 1000):
        candidate = directory / f"{stem}_{index}{suffix}"
        if not candidate.exists():
            return candidate

    return directory / f"{stem}_{uuid.uuid4().hex[:8]}{suffix}"


def download_track_image(image_url: str, file_stem: str, save_dir: Path) -> str | None:
    if not image_url:
        return None

    parsed = urlparse(image_url)
    suffix = Path(parsed.path).suffix or ".jpg"
    image_path = unique_path(save_dir, file_stem, suffix)

    image_response = requests.get(image_url)
    image_response.raise_for_status()

    with open(image_path, "wb") as f:
        f.write(image_response.content)

    return str(image_path)

def generate_music(
    style: str = None,
    title: str = None,
    prompt: str = "No Lyric",
    instrumental: bool = True,
    model: str = "chirp-v4-5"
):
    url = "https://aimusicapi.org/api/v2/generate"

    payload = {
        "model": model,
        "prompt": prompt,
        "make_instrumental": instrumental,
    }

    if style:
        payload["style"] = style
    if title:
        payload["title"] = title

    response = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json=payload
    )
    print(response.json())
    response.raise_for_status()
    return response.json()


def get_music_result(
        task_id: str,
        save_dir: str,
        timeout: int = 300,
        interval: int = 15, 
        start_index: int = 0):
    
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)

    start_time = time.time()
    
    while True:
        try:
            # 1. проверяем статус
            response = requests.get(
                f"https://aimusicapi.org/api/feed?workId={task_id}"
            )
            response.raise_for_status()
            data = response.json()
            print(data)

            items = data.get("data", {}).get("response_data", [])

            if not items:
                time.sleep(interval)
                continue
                # raise Exception("No data returned")

            # 2. проверяем, все ли готовы
            all_complete = all(item.get("status") == "complete" for item in items)

            if all_complete:
                downloaded_files = []

                for i, item in enumerate(items):
                    audio_url = item["audio_url"]
                    title = item.get("title", "track")
                    image_url = (
                        item.get("image_url")
                        or item.get("image_large_url")
                        or item.get("cover_image_url")
                        or item.get("thumbnail_url")
                    )
                    track_id = start_index + i + 1

                    file_stem = safe_file_stem(f"{title}_{track_id}")
                    file_path = unique_path(save_path, file_stem, ".mp3")

                    # 3. скачиваем файл
                    print(f"download {audio_url}...")
                    audio_response = requests.get(audio_url)
                    audio_response.raise_for_status()

                    with open(file_path, "wb") as f:
                        f.write(audio_response.content)

                    image_path = download_track_image(image_url, file_path.stem, save_path) if image_url else None

                    downloaded_files.append({
                        "file_path": str(file_path),
                        "image_path": image_path,
                        "title": title,
                    })

                return downloaded_files
            
        except Exception as e:
            print(e)
            raise e

        # 4. таймаут
        if time.time() - start_time > timeout:
            raise TimeoutError("Music generation timeout")

        time.sleep(interval)
