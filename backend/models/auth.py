from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    subscription: str = "free"


class AddUserRequest(BaseModel):
    username: str
    password: str
    subscription: str


class CreateUserRequest(BaseModel):
    username: str
    password: str
    subscription: str
    password_hash: str


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
