from fastapi import APIRouter, Depends

from services.llm import add_promo, generate_short_text
from services.dj import generate_dj_speech
from services.auth import get_current_user
from models.dj import BrandPhraseRequest, DJRequest


router = APIRouter(prefix="/dj", tags=["dj"])

@router.post("/transition")
def dj_transition(req: DJRequest, user=Depends(get_current_user)):
    return generate_dj_speech(req)


@router.post("/hello")
def dj_hello(req: DJRequest, user=Depends(get_current_user)):
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