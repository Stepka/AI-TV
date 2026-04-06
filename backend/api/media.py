import hashlib
import os
from pathlib import Path
import random
import time
import uuid
from scipy.io.wavfile import write

from fastapi import APIRouter, Query, Depends
from fastapi.responses import FileResponse
import requests
from api.dj import brand_transition_text
from db.auth import fetch_user_by_id
from models.dj import AdPhraseRequest
from db.media import add_ad, fetch_ad, fetch_ad_library, update_ad
from services.silero import has_speech
from services.dj import generate_speech
from models.channels import Channel
from db.channels import get_channel_by_id
from db.subscription import spend_subscription
from services.sona import generate_music, get_music_result
from models.media import AdPhrase, AddAdPhraseRequest, GenerateAITrackRequest, GenerateBrandPhraseSpeechRequest, UpdateAdPhraseRequest
from services.auth import get_current_user

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/speech")
def get_audio(filename: str, user_id: str, channel_id: str, type: str, user=Depends(get_current_user)):
    print("Serving audio file:", user_id, channel_id, filename)
    return FileResponse(f"channels_data/{user_id}/{channel_id}/{type}/{filename}", media_type="audio/wav", filename=filename)


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


@router.get("/ai_audio_library")
def list_ai_audio(
    user_id: str = Query(...),
    channel_id: str = Query(...)
):
    base_path = Path("channels_data") / user_id / channel_id / "ai_audio_library"
    base_path.mkdir(parents=True, exist_ok=True)

    files = []
    for file in base_path.glob("*"):
        if file.suffix.lower() in [".mp3", ".wav", ".ogg"]:
            files.append({
                "index": int(file.name.split("_")[-1].split(".")[0]),
                "name": file.name,
                "url": f"channels_data/{user_id}/{channel_id}/ai_audio_library/{file.name}"
            })
            
    files = sorted(files, key=lambda x: x["index"])
    return {"files": files}


@router.get("/prerecord_brand_phrases_library")
def list_prerecord_brand_phrases_library(
    user_id: str = Query(...),
    channel_id: str = Query(...)
):
    ads = fetch_ad_library(user_id, channel_id, "prerecord_brand_speech")
    return {"ads": ads}


@router.get("/prerecord_ad_phrases_library")
def list_prerecord_ad_phrases_library(
    user_id: str = Query(...),
    channel_id: str = Query(...)
):
    ads = fetch_ad_library(user_id, channel_id, "prerecord_ad_speech")
    return {"ads": ads}


@router.post("/generate_ai_track")
def generate_ai_track(req: GenerateAITrackRequest, user=Depends(get_current_user)):
    
    success = spend_subscription(req.user_id, "ai_tracks_num", decrement = 2)
    if not success:
        return {"track": "error", "error": "ai_tracks_num limit exceeded"}
    
    channel = get_channel_by_id(req.user_id, req.channel_id)
    channel = Channel(**channel)

    if random.random() < 0.4:
        instrumental = False
    else:
        instrumental = True
    
    print(f"Generating AI track for channel {channel.name} with style {channel.style} (instrumental={instrumental})")

    task = generate_music(style=channel.style, title=channel.name, prompt=f"{channel.name}, {channel.name}, {channel.name}", instrumental=instrumental)
    task_id = task["data"]["task_id"]


    tracks = list_ai_audio(req.user_id, req.channel_id)
    start_index = len(tracks["files"])
    print(f"start_index: {start_index}")
    # потом polling
    attempts = 3
    while attempts > 0:
        try:
            attempts -= 1
            result = get_music_result(task_id, save_dir=f"channels_data/{req.user_id}/{req.channel_id}/ai_audio_library", start_index=start_index)
            break
        except Exception as e:
            print(e)

    print(result)

    return {"track": "ok"}


@router.post("/generate_brand_phrase_speech")
def generate_brand_phrase_speech(req: GenerateBrandPhraseSpeechRequest, user=Depends(get_current_user)):
    
    success = spend_subscription(req.user_id, "prerecord_welcome_num", decrement = 1)
    if not success:
        return {"track": "error", "error": "prerecord_welcome_num limit exceeded"}
    
    channel = get_channel_by_id(req.user_id, req.channel_id)
    # channel = Channel(**channel)
    
    sample_rate = 48000
    
    retries = 3
    is_speech = False
    audio = None
    while audio is None and retries > 0:
        try:
            retries -= 1
            audio = generate_speech(channel, req.ad_text, sample_rate)
            is_speech = has_speech(audio, sample_rate, threshold=0.5)
            duration_seconds = 30
            # Количество сэмплов
            num_samples = audio.shape[0]
            # Длительность в секундах
            duration_seconds = num_samples / sample_rate
            print(f"Generated {duration_seconds:.2f} sec audio with {channel["voice"]["source"]}")
            raw = f"{req.user_id}|{req.channel_id}|{req.ad_text}"
            h = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]  # короткий хэш

            filename = f"dj_{h}.wav"
            dir_path = f"channels_data/{req.user_id}/{req.channel_id}/prerecord_brand_speech"
            os.makedirs(dir_path, exist_ok=True)
            write(f"{dir_path}/{filename}", sample_rate, audio)
        except Exception as e:
            print("ERROR!", e)
          

    if is_speech:
        ad = fetch_ad(req.ad_id, req.user_id, req.channel_id)
        ad.filename = filename
        ad.duration = duration_seconds
        ad.voice_model = channel["voice"]["source"]
        ad.voice_speaker = channel["voice"]["name"]
        ad.voice_sex = channel["voice"]["sex"]
        update_ad(ad)

        return {
            "success": "ok",
            "text": req.ad_text,
            "audio_filename": filename,
            "duration": duration_seconds,
            "format": "wav"
        }

    return {"success": "error"}


@router.post("/generate_ad_phrase_speech")
def generate_ad_phrase_speech(req: GenerateBrandPhraseSpeechRequest, user=Depends(get_current_user)):
    
    success = spend_subscription(req.user_id, "prerecord_ad_num", decrement = 1)
    if not success:
        return {"track": "error", "error": "prerecord_ad_num limit exceeded"}
    
    channel = get_channel_by_id(req.user_id, req.channel_id)
    # channel = Channel(**channel)
    
    sample_rate = 48000
    
    retries = 3
    is_speech = False
    audio = None
    while audio is None and retries > 0:
        try:
            retries -= 1
            audio = generate_speech(channel, req.ad_text, sample_rate)
            is_speech = has_speech(audio, sample_rate, threshold=0.5)
            duration_seconds = 30
            # Количество сэмплов
            num_samples = audio.shape[0]
            # Длительность в секундах
            duration_seconds = num_samples / sample_rate
            print(f"Generated {duration_seconds:.2f} sec audio with {channel["voice"]["source"]}")
            raw = f"{req.user_id}|{req.channel_id}|{req.ad_text}"
            h = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]  # короткий хэш

            filename = f"dj_{h}.wav"
            dir_path = f"channels_data/{req.user_id}/{req.channel_id}/prerecord_ad_speech"
            os.makedirs(dir_path, exist_ok=True)
            write(f"{dir_path}/{filename}", sample_rate, audio)
        except Exception as e:
            print("ERROR!", e)
          

    if is_speech:
        ad = fetch_ad(req.ad_id, req.user_id, req.channel_id)
        ad.filename = filename
        ad.duration = duration_seconds
        ad.voice_model = channel["voice"]["source"]
        ad.voice_speaker = channel["voice"]["name"]
        ad.voice_sex = channel["voice"]["sex"]
        update_ad(ad)

        return {
            "success": "ok",
            "text": req.ad_text,
            "audio_filename": filename,
            "duration": duration_seconds,
            "format": "wav"
        }

    return {"success": "error"}


@router.post("/generate_transition_phrase_speech")
def generate_transition_phrase_speech(req: GenerateBrandPhraseSpeechRequest, user=Depends(get_current_user)):
    
    success = spend_subscription(req.user_id, "prerecord_transition_num", decrement = 1)
    if not success:
        return {"track": "error", "error": "prerecord_transition_num limit exceeded"}
    
    channel = get_channel_by_id(req.user_id, req.channel_id)
    # channel = Channel(**channel)
    
    sample_rate = 48000
    
    retries = 3
    is_speech = False
    audio = None
    while audio is None and retries > 0:
        try:
            retries -= 1
            audio = generate_speech(channel, req.ad_text, sample_rate)
            is_speech = has_speech(audio, sample_rate, threshold=0.5)
            duration_seconds = 30
            # Количество сэмплов
            num_samples = audio.shape[0]
            # Длительность в секундах
            duration_seconds = num_samples / sample_rate
            print(f"Generated {duration_seconds:.2f} sec audio with {channel["voice"]["source"]}")
            raw = f"{req.user_id}|{req.channel_id}|{req.ad_text}"
            h = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]  # короткий хэш

            filename = f"dj_{h}.wav"
            dir_path = f"channels_data/{req.user_id}/{req.channel_id}/prerecord_transition_speech"
            os.makedirs(dir_path, exist_ok=True)
            write(f"{dir_path}/{filename}", sample_rate, audio)
        except Exception as e:
            print("ERROR!", e)
          

    if is_speech:
        ad = fetch_ad(req.ad_id, req.user_id, req.channel_id)
        ad.filename = filename
        ad.duration = duration_seconds
        ad.voice_model = channel["voice"]["source"]
        ad.voice_speaker = channel["voice"]["name"]
        ad.voice_sex = channel["voice"]["sex"]
        update_ad(ad)

        return {
            "success": "ok",
            "text": req.ad_text,
            "audio_filename": filename,
            "duration": duration_seconds,
            "format": "wav"
        }

    return {"success": "error"}


@router.post("/add_prerecord_brand_phrase")
def add_prerecord_brand_phrase(req: AddAdPhraseRequest, user=Depends(get_current_user)):    

    channel = get_channel_by_id(req.user_id, req.channel_id)

    voice = channel["voice"]
    
    transitions = fetch_ad_library(req.user_id, req.channel_id, "prerecord_transition_speech")
    if len(transitions) <= 0:        
        current_user = fetch_user_by_id(req.user_id)
        for _ in range(current_user.prerecord_transition_num):
            transition = AddAdPhraseRequest(user_id=req.user_id, channel_id=req.channel_id)
            transition = add_prerecord_transition_phrase(transition, user)["ad"]
            transition.ad_text = brand_transition_text(AdPhraseRequest(**transition.model_dump()), user)["text"]
            transition = UpdateAdPhraseRequest(**transition.model_dump())
            update_prerecord_transition_phrase(transition, user)
            generate_transition_phrase_speech(GenerateBrandPhraseSpeechRequest(**transition.model_dump()), user)

    payload = AdPhrase(
        ad_id=str(uuid.uuid4()), 
        user_id=req.user_id, 
        channel_id=req.channel_id, 
        ad_text=channel["description"], 
        speech="", 
        filename="", 
        voice_model=voice["source"], 
        voice_speaker=voice["name"], 
        voice_sex=voice["sex"], 
        type="prerecord_brand_speech", 
    )
    add_ad(payload)
    return {"success": "ok"}


@router.post("/add_prerecord_ad_phrase")
def add_prerecord_ad_phrase(req: AddAdPhraseRequest, user=Depends(get_current_user)):

    channel = get_channel_by_id(req.user_id, req.channel_id)

    voice = channel["voice"]

    payload = AdPhrase(
        ad_id=str(uuid.uuid4()), 
        user_id=req.user_id, 
        channel_id=req.channel_id, 
        ad_text="", 
        speech="", 
        filename="", 
        voice_model=voice["source"], 
        voice_speaker=voice["name"], 
        voice_sex=voice["sex"], 
        type="prerecord_ad_speech", 
    )
    add_ad(payload)
    return {"success": "ok"}


@router.post("/add_prerecord_transition_phrase")
def add_prerecord_transition_phrase(req: AddAdPhraseRequest, user=Depends(get_current_user)):

    channel = get_channel_by_id(req.user_id, req.channel_id)

    voice = channel["voice"]

    payload = AdPhrase(
        ad_id=str(uuid.uuid4()), 
        user_id=req.user_id, 
        channel_id=req.channel_id, 
        ad_text="", 
        speech="", 
        filename="", 
        voice_model=voice["source"], 
        voice_speaker=voice["name"], 
        voice_sex=voice["sex"], 
        type="prerecord_transition_speech", 
    )
    add_ad(payload)
    return {"success": "ok", "ad": payload}


@router.post("/update_prerecord_brand_phrase")
def update_prerecord_brand_phrase(req: UpdateAdPhraseRequest, user=Depends(get_current_user)):

    ad = fetch_ad(req.ad_id, req.user_id, req.channel_id)

    ad.ad_text = req.ad_text
    ad.speech = req.speech
    ad.voice_model = req.voice_model
    ad.voice_speaker = req.voice_speaker
    ad.voice_sex = req.voice_sex

    update_ad(ad)
    return {"success": "ok"}


@router.post("/update_prerecord_ad_phrase")
def update_prerecord_ad_phrase(req: UpdateAdPhraseRequest, user=Depends(get_current_user)):

    print("Updating ad:", req)

    ad = fetch_ad(req.ad_id, req.user_id, req.channel_id)

    ad.ad_text = req.ad_text
    ad.speech = req.speech
    ad.voice_model = req.voice_model
    ad.voice_speaker = req.voice_speaker
    ad.voice_sex = req.voice_sex

    update_ad(ad)
    return {"success": "ok"}


@router.post("/update_prerecord_transition_phrase")
def update_prerecord_transition_phrase(req: UpdateAdPhraseRequest, user=Depends(get_current_user)):

    print("Updating ad:", req)

    ad = fetch_ad(req.ad_id, req.user_id, req.channel_id)

    ad.ad_text = req.ad_text
    ad.speech = req.speech
    ad.voice_model = req.voice_model
    ad.voice_speaker = req.voice_speaker
    ad.voice_sex = req.voice_sex

    update_ad(ad)
    return {"success": "ok"}
