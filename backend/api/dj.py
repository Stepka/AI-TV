from fastapi import APIRouter, Depends

from db.subscription import fetch_subscription
from db.auth import fetch_user_by_id
from services.llm import add_promo, generate_short_text
from services.dj import generate_dj_speech, get_prerecord_brand_speech
from services.auth import get_current_user
from models.dj import BrandPhraseRequest, DJRequest


router = APIRouter(prefix="/dj", tags=["dj"])

@router.post("/transition")
def dj_transition(req: DJRequest, user=Depends(get_current_user)):
    current_user = fetch_user_by_id(req.user_id)
    subscription = current_user.subscription.name

    match subscription:
        case "basic":
            return get_prerecord_brand_speech(req)
        case _:
            return generate_dj_speech(req)


@router.post("/hello")
def dj_hello(req: DJRequest, user=Depends(get_current_user)):
    current_user = fetch_user_by_id(req.user_id)
    subscription = current_user.subscription.name

    match subscription:
        case "basic":
            return get_prerecord_brand_speech(req)
        case _:
            req.from_artist = None
            req.from_title = None
            return generate_dj_speech(req)


@router.post("/brand_phrase_text")
def brand_phrase_text(req: BrandPhraseRequest, user=Depends(get_current_user)):

    print("generate brand text")

    text = generate_short_text(req.user_id, req.channel_id)

    return {"status": "ok", "text": text}


@router.post("/ad_phrase_text")
def ad_phrase_text(req: BrandPhraseRequest, user=Depends(get_current_user)):

    text = generate_short_text(req.user_id, req.channel_id)
    text = add_promo(text, req.user_id, req.channel_id)

    return {"status": "ok", "text": text}