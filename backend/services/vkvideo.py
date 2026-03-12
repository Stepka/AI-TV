import requests
import re
import json


def search_vk_video(query: str):

    url = "https://vk.com/al_video.php"

    headers = {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "act": "search_video",
        "al": 1,
        "q": query,
        "offset": 0
    }

    r = requests.post(url, data=data, headers=headers)

    text = r.text

    # вытаскиваем JSON массив
    match = re.search(r"\[\[.*\]\]", text)

    if not match:
        return None


    # print("VK search response:", text)
    # print("VK match:", match.group(0))
    responce = json.loads(text[4:])

    items = responce['payload'][1][2]['list']
    if not items:
        return None

    item = items[0]
    # print()
    # print()
    # print("VK video item:", item)

    owner_id = item[0]
    video_id = item[1]
    title = item[3]

    # Parse duration from "4:33" format to seconds
    duration_str = item[5] if item[5] else "0:0"
    parts = duration_str.split(":")
    duration = int(parts[0]) * 60 + int(parts[1])
    
    return {
        "title": title,
        "videoId": f"{owner_id}_{video_id}",
        "owner_id": owner_id,
        "id": video_id,
        "url": f"https://vk.com/video{owner_id}_{video_id}", 
        "duration": duration
    }