import os
from pathlib import Path
import time

import requests

API_KEY = os.getenv("AIMUSIC_API_KEY")

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
        # 1. проверяем статус
        response = requests.get(
            f"https://aimusicapi.org/api/feed?workId={task_id}"
        )
        response.raise_for_status()
        data = response.json()
        print(data)

        items = data.get("data", {}).get("response_data", [])

        if not items:
            continue
            # raise Exception("No data returned")

        # 2. проверяем, все ли готовы
        all_complete = all(item.get("status") == "complete" for item in items)

        if all_complete:
            downloaded_files = []

            for i, item in enumerate(items):
                audio_url = item["audio_url"]
                title = item.get("title", "track")
                track_id = start_index + i + 1

                filename = f"{title}_{track_id}.mp3".replace(" ", "_")
                file_path = save_path / filename

                # 3. скачиваем файл
                print(f"download {audio_url}...")
                audio_response = requests.get(audio_url)
                audio_response.raise_for_status()

                with open(file_path, "wb") as f:
                    f.write(audio_response.content)

                downloaded_files.append(str(file_path))

            return downloaded_files

        # 4. таймаут
        if time.time() - start_time > timeout:
            raise TimeoutError("Music generation timeout")

        time.sleep(interval)