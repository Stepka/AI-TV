from fastapi import APIRouter, Depends, HTTPException
from services.auth import get_current_user, authenticate_user, create_access_token, get_password_hash
from db.auth import create_invite, create_user, fetch_user
from models.auth import AddUserRequest, CreateInviteRequest, CreateUserRequest, LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        return {"ok": False, "error": "wrong login or password"}

    token = create_access_token({"sub": user["username"]})
    return {"ok": True, "access_token": token, "token_type": "bearer"}


@router.post("/register")
def register(req: RegisterRequest):
    try:
        email = req.email.strip().lower()
        if "@" not in email:
            return {"ok": False, "error": "invalid email"}

        invite_code = (req.invite_code or "").strip().upper()

        create_req = CreateUserRequest(
            username=email,
            password=req.password,
            password_hash=get_password_hash(req.password),
            invite_code=invite_code or None,
            subscription="free",
        )
        created_user = create_user(create_req)
        return {"ok": True, "created_user": created_user}
    except HTTPException as exc:
        return {"ok": False, "error": exc.detail}


@router.get("/me")
def me(username: str = Depends(get_current_user)):
    user_data = fetch_user(username)
    return {"ok": True, "user": user_data.dict()}


@router.post("/add_user")
def me(req: AddUserRequest, username: str = Depends(get_current_user)):
    user_data = fetch_user(username)
    if user_data.role == "admin":
        add_ser_req = CreateUserRequest(
            username=req.username, 
            subscription=req.subscription, 
            password=req.password, 
            password_hash=get_password_hash(req.password)
        )
        created_user = create_user(add_ser_req)
        return {"ok": True, "created_user": created_user}
    
    return {"ok": False}


@router.post("/create_invite")
def create_invite_code(req: CreateInviteRequest, username: str = Depends(get_current_user)):
    user_data = fetch_user(username)
    if user_data.role != "admin":
        return {"ok": False, "error": "forbidden"}

    try:
        invite = create_invite(req.email, req.subscription, user_data.user_uid)
        return {"ok": True, "invite": invite}
    except HTTPException as exc:
        return {"ok": False, "error": exc.detail}

