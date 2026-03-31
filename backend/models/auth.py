from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class AddUserRequest(BaseModel):
    username: str
    password: str
    subscription: str


class CreateUserRequest(BaseModel):
    username: str
    password: str
    subscription: str
    password_hash: str


class UserResponse(BaseModel):
    username: str
    user_uid: str
    role: str
    tokens: int
    subscription: Subscription


class Subscription(BaseModel):
    id: int
    name: str