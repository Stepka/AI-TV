from fastapi import APIRouter, Depends, Query
from services.auth import get_current_user
from models.channels import ChannelUpdate
from db import channels as db
from db.auth import fetch_user

router = APIRouter(prefix="/channels", tags=["channels"])


@router.get("")
def get_channels(username: str = Depends(get_current_user)):
    channels = db.fetch_channels(username)
    return {"ok": True, "channels": channels}


@router.put("/{channel_uid}")
def update_channel(channel_uid: str, payload: ChannelUpdate, user=Depends(get_current_user)):
    db.update_channel(channel_uid, payload)
    return {"status": "ok", "message": "Channel updated or created"}


@router.delete("/{channel_uid}")
def delete_channel(channel_uid: str, user_uid: str = Query(...), user=Depends(get_current_user)):
    db.delete_channel(channel_uid, user_uid)
    return {"status": "ok", "message": "Channel deleted"}