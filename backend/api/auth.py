from fastapi import APIRouter, Depends
from services.auth import get_current_user, authenticate_user, create_access_token
from db.auth import fetch_user
from models.auth import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        return {"ok": False, "error": "wrong login or password"}

    token = create_access_token({"sub": user["username"]})
    return {"ok": True, "access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(username: str = Depends(get_current_user)):
    user_data = fetch_user(username)
    return {"ok": True, "user": user_data.dict()}
