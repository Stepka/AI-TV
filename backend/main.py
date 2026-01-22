from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv
import os


load_dotenv()

app = FastAPI()

# Разрешаем фронтенду подключаться
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Предопределенные каналы
CHANNELS = {
    "MTV": ["pop music", "hip hop", "MTV hits"],
    "Retro": ["80s music", "90s music", "retro hits"],
    "A One": ["Rock music", "alternative rock", "A One channel"],
}

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") 

class PlaylistRequest(BaseModel):
    channel: str
    max_results: int = 10

def search_youtube(query, max_results=10):
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY
    }
    r = requests.get(url, params=params)
    items = r.json().get("items", [])
    return [
        {
            "title": item["snippet"]["title"],
            "videoId": item["id"]["videoId"],
            "channelTitle": item["snippet"]["channelTitle"]
        }
        for item in items
    ]

@app.post("/playlist")
def get_playlist(req: PlaylistRequest):
    tags = CHANNELS.get(req.channel, [])
    videos = []
    for tag in tags:
        videos += search_youtube(tag, max_results=req.max_results//len(tags))
    print(videos)
    return {"playlist": videos}

@app.get("/")
def get_home():
    return "It's AI-TV, baby!"
