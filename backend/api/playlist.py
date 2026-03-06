
from fastapi import APIRouter

from db.playlist import find_tracks, get_last_played, save_last_played
from db.youtube import YouTubeCache
from models.playlist import PlaylistRequest
from services.llm import check_title_llm, generate_playlist_llm, generate_playlist_ppx
from services.youtube import get_video_duration, search_youtube_video


router = APIRouter(prefix="/playlist", tags=["playlist"])


@router.post("/")
def get_playlist(req: PlaylistRequest):
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
    print(f"Generated tracks {len(tracks)}:", tracks)

    videos = []
    for track in tracks:
        video_id = cache.get_video(track['artist'], track['title'])
        if not video_id:

            found = find_tracks(track['artist'], track['title'])

            if len(found) > 0:
                print(found)
                video_id = found[0]['youtubeId']
                
            else:
                # поиск через YouTube API
                print("Searching YouTube for:", track)

                query = f"{track['artist']} {track['title']} official music video"
                yt_video = search_youtube_video(query)
                # print("YouTube search result:", yt_video)

                if yt_video:
                    matched = check_title_llm(track['artist'] + " - " + track['title'], yt_video['title'])
                    if matched:
                        video_id = yt_video["videoId"]

                        try:
                            video_duration = get_video_duration(video_id)
                            if not video_duration or video_duration < 60 or video_duration > 15*60:  # фильтр по длительности (не больше 15 минут)
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
                "match": track['match']
            })
            
    
    indexed = [(i, t) for i, t in enumerate(videos)]
    top_n = sorted(indexed, key=lambda x: float(x[1]["match"]), reverse=True)[:req.max_results]
    videos = [t for i, t in sorted(top_n, key=lambda x: x[0])]

    print("Selected videos:")
    print(videos)

    save_last_played(req.user_id, req.channel_id, [{"artist": v['artist'], "title": v['title']} for v in videos])

    return {
        "playlist": videos,
        "source": "llm+youtube"
    }