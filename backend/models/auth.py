from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateUserRequest(BaseModel):
    username: str
    password: str
    password_hash: str


class UserResponse(BaseModel):
    username: str
    user_uid: str
    role: str
    tokens: int