import random
from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
import numpy as np
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv
import os
import os
import json
from scipy.io.wavfile import write
from openai import OpenAI

load_dotenv()

from yt_cache import YouTubeCache
from silero import silero_tts

app = FastAPI()

# Разрешаем фронтенду подключаться
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

silero_model, _ = silero_tts(language='ru',
                                 speaker='v5_1_ru')

# Предопределенные каналы
CHANNELS = {
    "MTV": {
        "style": "modern popular music",
        "era": "2010-2024",
        "description": "global chart hits, pop, hip hop, dance"
    },
    "Retro": {
        "style": "classic hits",
        "era": "1980-1989",
        "description": "80s pop, disco, synth, rock"
    },
    "Retro Synth": {
        "style": "classic synth hits",
        "era": "1980-1989",
        "description": "80s synth, soviet synth"
    },
    "A One": {
        "style": "rock and alternative",
        "era": "1995-2010",
        "description": "alternative rock, grunge, indie"
    }
}



YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") 


class PlaylistRequest(BaseModel):
    channel: str
    max_results: int = 10


@app.post("/playlist")
def get_playlist(req: PlaylistRequest):
    cache = YouTubeCache()  # при первом запуске база создастся автоматически

    tracks = generate_playlist_llm(req.channel, req.max_results*4)
    tracks = random.sample(tracks, min(req.max_results, len(tracks)))
    # return tracks

    videos = []
    for track in tracks:
        video_id = cache.get_video(track['artist'], track['title'])
        if not video_id:
            # поиск через YouTube API
            print("Searching YouTube for:", track)

            query = f"{track['artist']} {track['title']} official music video"
            video_id = search_youtube_video(query)

            cache.save_video(track['artist'], track['title'], video_id)
            
        if video_id:
            videos.append({
                "artist": track['artist'],
                "title": track['title'],
                "videoId": video_id
            })
    return {
        "playlist": videos,
        "source": "llm+youtube"
    }



@app.get("/")
def get_home():
    return "It's AI-TV, baby!"


@app.get("/test_speech")
def test_speech():
    sample_rate = 48000
    example_text = "Вот это был заряд! Если вы чувствуете этот бит — значит, мы всё делаем правильно. А дальше будет ещё громче, ещё ярче и ещё атмосфернее. Через несколько секунд стартует следующий клип, так что устраивайтесь поудобнее и ловите волну."
    audio = silero_model.apply_tts(
        text=example_text,
        sample_rate=sample_rate
    )
    
    audio_numpy = audio.cpu().numpy()  # конвертируем в numpy
    audio_int16 = (audio_numpy * 32767).astype(np.int16)  # приводим к int16
    write("wav_folder/dj.wav", sample_rate, audio_int16)

    html_content = """
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>DJ Transition Player</title>
    </head>
    <body style="background-color:#111;color:#fff;text-align:center;padding-top:50px;font-family:sans-serif;">
        <h1>DJ Transition Player</h1>
        <audio controls autoplay>
            <source src="/audio" type="audio/wav">
            Ваш браузер не поддерживает аудио.
        </audio>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/audio")
def get_audio():
    return FileResponse("wav_folder/dj.wav", media_type="audio/wav", filename="dj.wav")


################################################ 


def search_youtube_video(query: str):
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 1,
        "key": YOUTUBE_API_KEY
    }
    r = requests.get(url, params=params)
    items = r.json().get("items", [])

    if not items:
        return None

    item = items[0]
    return item["id"]["videoId"]
    # {
    #     "title": item["snippet"]["title"],
    #     "videoId": item["id"]["videoId"],
    #     "channelTitle": item["snippet"]["channelTitle"]
    # }


def generate_playlist_llm(channel: str, count: int = 10):
    meta = CHANNELS.get(channel)
    if not meta:
        raise ValueError("Unknown channel")

    prompt = f"""
You are a professional music TV editor.

Create a playlist for the TV channel "{channel}".

Style: {meta["style"]}
Era: {meta["era"]}
Description: {meta["description"]}

Rules:
- EXACTLY {count} items
- Popular and recognizable songs
- Each item must include artist and title
- No remixes, no live versions
- Avoid duplicate artists

Return ONLY valid JSON.
Format:
{{
  "tracks": [
  {{ "artist": "Artist name", "title": "Song title" }}
  ]
}}
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # быстрый и дешёвый для MVP
        messages=[
            {"role": "system", "content": "You generate structured music playlists."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)["tracks"]
    except json.JSONDecodeError:
        # защита от мусора
        raise RuntimeError(f"LLM returned invalid JSON: {content}")