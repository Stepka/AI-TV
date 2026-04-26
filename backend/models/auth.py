from typing import Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    invite_code: str


class AddUserRequest(BaseModel):
    username: str
    password: str
    subscription: str


class CreateUserRequest(BaseModel):
    username: str
    password: str
    subscription: str = "free"
    password_hash: str
    invite_code: Optional[str] = None


class CreateInviteRequest(BaseModel):
    email: str
    subscription: str = "free"


class InviteResponse(BaseModel):
    code: str
    email: str
    subscription: str
    created_by: str
    used_by: Optional[str] = None
    is_used: bool = False


class Subscription(BaseModel):
    id: int
    name: str


class UserResponse(BaseModel):
    username: str
    user_uid: str
    role: str
    tokens: int
    subscription: Subscription
    ai_tracks_num: int
    prerecord_welcome_num: int
    prerecord_ad_num: int
    voice_num: int
    prerecord_transition_num: int
    channels_num: int
