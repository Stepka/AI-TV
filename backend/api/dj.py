import random

from fastapi import APIRouter, Depends

from db.media import fetch_ad
from db.channels import get_channel_by_id
from services.common import replace_words
from db.subscription import fetch_subscription
from db.auth import fetch_user_by_id
from services.llm import add_emotions_llm, add_promo, convert_digits, convert_to_russian, generate_short_text, generate_ultra_short_text, shortener
from services.dj import generate_dj_speech, get_prerecord_ad_speech, get_prerecord_brand_speech, get_prerecord_transition_speech
from services.auth import get_current_user
from models.dj import AdPhraseRequest, DJRequest


router = APIRouter(prefix="/dj", tags=["dj"])

@router.post("/transition")
def dj_transition(req: DJRequest, user=Depends(get_current_user)):
    current_user = fetch_user_by_id(req.user_id)
    subscription = current_user.subscription.name

    match subscription:
        case "basic":
            return get_prerecord_brand_speech(req) if random.random() > 0.8 else get_prerecord_transition_speech(req)
        case "plus":
            rand = random.random()
            if rand > 0.8:
                return get_prerecord_brand_speech(req)
            elif rand > 0.4:
                return get_prerecord_ad_speech(req)
            else:
                return get_prerecord_transition_speech(req)
        case _:
            return generate_dj_speech(req)


@router.post("/hello")
def dj_hello(req: DJRequest, user=Depends(get_current_user)):
    current_user = fetch_user_by_id(req.user_id)
    subscription = current_user.subscription.name

    match subscription:
        case "basic":
            return get_prerecord_brand_speech(req)
        case "plus":
            return get_prerecord_brand_speech(req)
        case _:
            req.from_artist = None
            req.from_title = None
            return generate_dj_speech(req)


@router.post("/brand_phrase_text")
def brand_phrase_text(req: AdPhraseRequest, user=Depends(get_current_user)):
    
    channel = get_channel_by_id(req.user_id, req.channel_id)

    text = generate_short_text(req.user_id, req.channel_id)
    
    if len(text) > 500:
        text = shortener(text, req.user_id, req.channel_idd, max_symbols=500)
    
    if channel["voice"]["source"] == "silero":
        text = convert_to_russian(text, "", "")
        text = convert_digits(text)   
        text = replace_words(text)
    
    if channel["voice"]["source"] == "elevenlabs":
        print("Adding emotions")
        text = add_emotions_llm(text, req.user_id, req.channel_id)

    return {"status": "ok", "text": text}


@router.post("/ad_phrase_text")
def ad_phrase_text(req: AdPhraseRequest, user=Depends(get_current_user)):
    
    channel = get_channel_by_id(req.user_id, req.channel_id)
    
    ad = fetch_ad(req.ad_id, req.user_id, req.channel_id)

    print(ad.ad_text)

    text = generate_short_text(req.user_id, req.channel_id)
    text = add_promo(text, ad.ad_text, req.user_id, req.channel_id)
    
    if len(text) > 500:
        text = shortener(text, req.user_id, req.channel_id, max_symbols=500)
    
    if channel["voice"]["source"] == "silero":
        text = convert_to_russian(text, "", "")
        text = convert_digits(text)   
        text = replace_words(text)
    
    if channel["voice"]["source"] == "elevenlabs":
        print("Adding emotions")
        text = add_emotions_llm(text, req.user_id, req.channel_id)

    return {"status": "ok", "text": text}


@router.post("/brand_transition_text")
def brand_transition_text(req: AdPhraseRequest, user=Depends(get_current_user)):
    
    channel = get_channel_by_id(req.user_id, req.channel_id)

    text = generate_ultra_short_text(req.user_id, req.channel_id)
    
    if len(text) > 100:
        text = shortener(text, req.user_id, req.channel_id, max_symbols=100)
    
    if channel["voice"]["source"] == "silero":
        text = convert_to_russian(text, "", "")
        text = convert_digits(text)   
        text = replace_words(text)
    
    if channel["voice"]["source"] == "elevenlabs":
        print("Adding emotions")
        text = add_emotions_llm(text, req.user_id, req.channel_id)

    # text = "Переходим к следующей песне"
    print(text)
    return {"status": "ok", "text": text}