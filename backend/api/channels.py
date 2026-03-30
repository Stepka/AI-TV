import os

from elevenlabs import ElevenLabs
from fastapi import APIRouter, Depends, Query
from services.llm import extract_channel_with_perplexity
from services.auth import get_current_user
from models.channels import ChannelUpdate, FillChannelWithLLM
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


@router.post("/{channel_uid}/fill_with_llm")
def fill_channel_with_llm(channel_uid: str, payload: FillChannelWithLLM, user=Depends(get_current_user)):
    channel = extract_channel_with_perplexity(
        url=payload.url,
        channel_uid=channel_uid
    )

    client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
    voice = client.text_to_voice.design(
        voice_description=channel.voice.prompt,
        output_format="mp3_44100_192",
        auto_generate_text=True,
        guidance_scale=50,
        quality=1
    )

    voice = voice.previews[0]

    voice = client.text_to_voice.create(
        voice_name=channel.name,
        voice_description=channel.voice.prompt[:1000],
        generated_voice_id=voice.generated_voice_id,
    )

    channel.voice.name = voice.voice_id

    channel.sources = ["ai_audio"]

    print(channel)

    return {
        "status": "ok",
        "channel": channel
    }