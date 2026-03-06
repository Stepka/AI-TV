import os

from fastapi import APIRouter, Query, Depends
from fastapi.responses import FileResponse
from services.auth import get_current_user

router = APIRouter(tags=["media"])


@router.get("/audio")
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