

import uuid

from fastapi import HTTPException

from db.common import get_db
from models.auth import CreateUserRequest, UserResponse, LoginRequest, Subscription


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

    user_row = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    subscription_row = cur.execute("SELECT * FROM subscriptions WHERE id = ?", (user_row["subscription_id"],)).fetchone()
    if not subscription_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Subscription not found")

    conn.close()

    subscription = Subscription(**subscription_row)

    return UserResponse(
        **user_row, subscription=subscription
    )


def fetch_user_by_id(user_id: str) -> UserResponse:
    conn = get_db()
    cur = conn.cursor()

    user_row = cur.execute("SELECT * FROM users WHERE user_uid = ?", (user_id,)).fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    subscription_row = cur.execute("SELECT * FROM subscriptions WHERE id = ?", (user_row["subscription_id"],)).fetchone()
    if not subscription_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Subscription not found")

    conn.close()

    subscription = Subscription(**subscription_row)

    return UserResponse(
        **user_row, subscription=subscription
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
    
    
    existing_subscription = cur.execute(
        "SELECT * FROM subscriptions WHERE name = ?",
        (payload.subscription,)
    ).fetchone()

    if not existing_subscription:
        conn.close()
        raise HTTPException(status_code=400, detail="Subscription does not exists")

    user_uid = str(uuid.uuid4())
    # 2) вставка
    cur.execute(
        """
        INSERT INTO users (user_uid, username, password_hash, role, tokens, subscription_id, 
        ai_tracks_num, prerecord_welcome_num, prerecord_ad_num, voice_num, prerecord_transition_num, channels_num)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (user_uid, payload.username, payload.password_hash, "customer", 1000, 
         existing_subscription["id"], existing_subscription["ai_tracks_num"], existing_subscription["prerecord_welcome_num"], 
         existing_subscription["prerecord_ad_num"], existing_subscription["voice_num"], 
         existing_subscription["prerecord_transitions_num"], existing_subscription["channels_num"])
    )

    conn.commit()

    # 3) получаем созданного пользователя
    user_row = cur.execute(
        "SELECT * FROM users WHERE username = ?",
        (payload.username,)
    ).fetchone()
    
    subscription_row = cur.execute("SELECT * FROM subscriptions WHERE id = ?", (user_row["subscription_id"],)).fetchone()
    if not subscription_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Subscription not found")

    conn.close()

    subscription = Subscription(**subscription_row)

    return UserResponse(**user_row, subscription=subscription)