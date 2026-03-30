

import uuid

from fastapi import HTTPException

from db.common import get_db
from models.auth import CreateUserRequest, UserResponse, LoginRequest


def get_user_by_username(username: str):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cur.fetchone()

    conn.close()
    return row


def fetch_user(username: str) -> UserResponse:
    conn = get_db()
    cur = conn.cursor()

    # 1) ищем пользователя
    user_row = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    conn.close()

    return UserResponse(
        **user_row
    )

def create_user(payload: CreateUserRequest) -> UserResponse:
    conn = get_db()
    cur = conn.cursor()

    # 1) проверка — существует ли уже
    existing = cur.execute(
        "SELECT * FROM users WHERE username = ?",
        (payload.username,)
    ).fetchone()

    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="User already exists")

    user_uid = str(uuid.uuid4())
    # 2) вставка
    cur.execute(
        """
        INSERT INTO users (user_uid, username, password_hash, role, tokens)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_uid, payload.username, payload.password_hash, "customer", 1000)
    )

    conn.commit()

    # 3) получаем созданного пользователя
    user_row = cur.execute(
        "SELECT * FROM users WHERE username = ?",
        (payload.username,)
    ).fetchone()

    conn.close()

    return UserResponse(**user_row)