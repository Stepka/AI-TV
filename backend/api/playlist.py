import random

from fastapi import APIRouter

from api.media import list_ai_audio
from services.vkvideo import search_vk_video
from db.playlist import find_tracks, get_last_played, save_last_played
from db.youtube import YouTubeCache
from models.playlist import PlaylistRequest
from services.llm import check_style_match_level, check_title_llm, generate_playlist_llm, generate_playlist_ppx, get_track_info_list_ppx
from services.youtube import get_video_duration, search_youtube_video
import json


router = APIRouter(prefix="/playlist", tags=["playlist"])


@router.post("")
def get_playlist(req: PlaylistRequest):
    videos = []

    retries = 3
    match_level = 70

    while len(videos) < req.max_results and retries > 0:
        print("Search for videos... ")
        found = _get_playlist(req, match_level)
        videos.extend(found)
        print(f"Collected videos num: {len(videos)}")
        match_level -= 10
        retries -= 1

    return {
        "playlist": videos,
        "source": "llm+youtube"
    }

def _get_playlist(req: PlaylistRequest, match_level = 80):
    cache = YouTubeCache()  # при первом запуске база создастся автоматически

    # tracks = generate_playlist_llm(req.user_id, req.channel_id, req.max_results*4)
    last_played = get_last_played(req.user_id, req.channel_id)
    tracks = []
    try:
        tracks = generate_playlist_ppx(req.user_id, req.channel_id, req.max_results, last_played)
        print(f"PPX tracks found: {len(tracks)}")
        if len(tracks) == 0: raise Exception("No found tracks")
    except Exception as e:
        print(e)
    
    gpt_tracks = generate_playlist_llm(req.user_id, req.channel_id, req.max_results, last_played)
    print(f"GPT tracks found: {len(gpt_tracks)}")
    tracks += gpt_tracks
    print(f"Generated tracks {len(tracks)}:")

    try:
        tracks = get_track_info_list_ppx(tracks)
        print(json.dumps(tracks, ensure_ascii=False, indent=2))
    except Exception as e:
        print(e)

    tracks = check_style_match_level(req.user_id, req.channel_id, tracks) 

    tracks = [t for t in tracks if t["match"] >= match_level]   

    last_played += [{"artist": v['artist'], "title": v['title']} for v in tracks]
    save_last_played(req.user_id, req.channel_id, last_played[-25:])

    print(json.dumps(tracks, ensure_ascii=False, indent=2))

    # video_sources = ["youtube", "vk"]
    # video_sources = ["vk", "youtube"]
    # video_sources = ["youtube"]
    # video_sources = ["vk"]
    # video_sources = ["ai_audio"]
    video_sources = ["vk", "youtube", "ai_audio"]

    videos = []
    for track in tracks:       

        ###################

        # continue

        video_duration = -1
        for video_source in video_sources:
            if video_source == "youtube":
                video_id = cache.get_video(track['artist'], track['title'])
                video_duration = -1
                if not video_id:

                    found = find_tracks(track['artist'], track['title'])

                    if len(found) > 0:
                        print(found)
                        video_id = found[0]['youtubeId']
                        
                    else:
                        # поиск через YouTube API
                        print("Searching YouTube for:", track)

                        query = f"{track['artist']} {track['title']} official music video"
                        yt_video = None                        
                        try:
                            yt_video = search_youtube_video(query)
                        except Exception as e:
                            print(e)
                            
                        print("YouTube search result:", yt_video)
                        # yt_video = search_vk_video(query)
                        # print("VK search result:", yt_video)

                        if yt_video:
                            matched = check_title_llm(track['artist'] + " - " + track['title'], yt_video['title'] + ' (' + yt_video['channelTitle'] + ')', video_source)
                            # matched = check_title_llm(track['artist'] + " - " + track['title'], yt_video['channelTitle'] + " - " + yt_video['title'])
                            if matched:
                                video_id = yt_video["videoId"]

                                try:
                                    video_duration = get_video_duration(video_id)
                                    if not video_duration or video_duration < 60 or video_duration > 15*60:  # фильтр по длительности (не больше 15 минут)
                                        print(f"Video duration {video_duration} - skip")
                                        continue
                                    cache.save_video(track['artist'], track['title'], video_id)
                                except Exception as e:
                                    print(e)
                                    continue
                
                if video_id:
                    videos.append({
                        "artist": track['artist'],
                        "title": track['title'],
                        "videoId": video_id,
                        "duration": video_duration,
                        "match": track['match'],
                        "source": video_source
                    })
                    break  # если нашли видео на YouTube, не ищем на других платформах
    
            if video_source == "vk":
                query = f"{track['artist']} {track['title']} official music video"
                vk_video = None
                try:
                    vk_video = search_vk_video(query)
                except Exception as e:
                    print(e)
                print("VK search result:", vk_video)
                
                video_id = None
                if vk_video:
                    matched = check_title_llm(track['artist'] + " - " + track['title'], vk_video['title'], video_source)
                    if matched:
                        video_id = vk_video["videoId"]

                        try:
                            video_duration = vk_video.get("duration", 0)
                            if not video_duration or video_duration < 60 or video_duration > 15*60:  # фильтр по длительности (не больше 15 минут)
                                print(f"Video duration {video_duration} - skip")
                                continue
                            # cache.save_video(track['artist'], track['title'], video_id)
                        except Exception as e:
                            print(e)
                            continue
            
                if video_id:
                    videos.append({
                        "artist": track['artist'],
                        "title": track['title'],
                        "videoId": video_id,
                        "duration": vk_video.get("duration", 0),
                        "match": track['match'],
                        "source": video_source
                    })
                    break  # если нашли видео на VK, не ищем на других платформах

            if video_source == "ai_audio":
                tracks = list_ai_audio(req.user_id, req.channel_id)
                if len(tracks) > 0:
                    track = random.choice(tracks["files"])
                    videos.append({
                        "artist": "AI",
                        "title": track["name"],
                        "videoId": track["url"],
                        "duration": -1,
                        "match": 100,
                        "source": video_source
                    })
                       
    
    indexed = [(i, t) for i, t in enumerate(videos)]
    top_n = sorted(indexed, key=lambda x: float(x[1]["match"]), reverse=True)
    videos = [t for i, t in sorted(top_n, key=lambda x: x[0])][:req.max_results]

    print("Selected videos:")
    print(videos)

    return videos