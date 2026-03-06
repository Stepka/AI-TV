from fastapi import APIRouter, Depends

from services.dj import generate_dj_speech
from services.auth import get_current_user
from models.dj import DJRequest


router = APIRouter(tags=["dj"])

@router.post("/dj_transition")
def dj_transition(req: DJRequest, user=Depends(get_current_user)):
    return generate_dj_speech(req)


@router.post("/dj_hello")
def dj_hello(req: DJRequest, user=Depends(get_current_user)):
    req.from_artist = None
    req.from_title = None
    return generate_dj_speech(req)