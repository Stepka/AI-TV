from fastapi import APIRouter, Depends
from services.auth import get_current_user, authenticate_user, create_access_token, get_password_hash
from db.auth import create_user, fetch_user
from models.auth import CreateUserRequest, LoginRequest

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


@router.post("/add_user")
def me(req: LoginRequest, username: str = Depends(get_current_user)):
    user_data = fetch_user(username)
    if user_data.role == "admin":
        add_ser_req = CreateUserRequest(username=req.username, password=req.password, password_hash=get_password_hash(req.password))
        created_user = create_user(add_ser_req)
        return {"ok": True, "created_user": created_user}
    
    return {"ok": False}

