
import os

import re
import requests


YOUTUBE_API_KEYS = os.getenv("YOUTUBE_API_KEYS").strip().split(",")
YOUTUBE_API_KEY_INDEX = 0
YOUTUBE_API_KEY = YOUTUBE_API_KEYS[YOUTUBE_API_KEY_INDEX] if YOUTUBE_API_KEYS else None


def retry_with_next_api_key(func):
    def wrapper(*args, **kwargs):
        attempts = 0
        result = func(*args, **kwargs)
        while result is None and attempts < len(YOUTUBE_API_KEYS) - 1:
            next_youtube_api_key()
            result = func(*args, **kwargs)
            attempts += 1
        return result
    return wrapper


def next_youtube_api_key():
    global YOUTUBE_API_KEY_INDEX, YOUTUBE_API_KEY
    if not YOUTUBE_API_KEYS:
        YOUTUBE_API_KEY = None
        return None
    YOUTUBE_API_KEY_INDEX = (YOUTUBE_API_KEY_INDEX + 1) % len(YOUTUBE_API_KEYS)
    YOUTUBE_API_KEY = YOUTUBE_API_KEYS[YOUTUBE_API_KEY_INDEX]
    return YOUTUBE_API_KEY


@retry_with_next_api_key
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
    
    return {
        "title": item["snippet"]["title"],
        "videoId": item["id"]["videoId"],
        "channelTitle": item["snippet"]["channelTitle"]
    }


@retry_with_next_api_key
def get_video_duration(video_id: str) -> str:
    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "contentDetails",
        "id": video_id,
        "key": YOUTUBE_API_KEY
    }

    r = requests.get(url, params=params)
    r.raise_for_status()

    items = r.json().get("items", [])
    if not items:
        return None

    # ISO 8601 duration, например "PT3M25S"
    return parse_yt_duration_to_seconds(items[0]["contentDetails"]["duration"])


def parse_yt_duration_to_seconds(duration: str) -> int:
    """
    YouTube duration ISO 8601 -> seconds
    Examples:
      PT3M25S -> 205
      PT45S   -> 45
      PT1H2M10S -> 3730
    """
    if not duration:
        return None

    pattern = r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
    m = re.match(pattern, duration)
    if not m:
        return None

    hours = int(m.group(1) or 0)
    minutes = int(m.group(2) or 0)
    seconds = int(m.group(3) or 0)

    return hours * 3600 + minutes * 60 + seconds
