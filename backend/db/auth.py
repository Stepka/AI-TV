
import uuid
import secrets

from fastapi import HTTPException

from db.common import get_db
from models.auth import CreateUserRequest, InviteResponse, UserResponse, Subscription


def ensure_invites_table():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS invites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            subscription_id INTEGER NOT NULL,
            created_by TEXT,
            used_by TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            used_at TEXT,
            FOREIGN KEY(subscription_id) REFERENCES subscriptions(id),
            FOREIGN KEY(created_by) REFERENCES users(user_uid),
            FOREIGN KEY(used_by) REFERENCES users(user_uid)
        )
        """
    )
    columns = {row["name"] for row in cur.execute("PRAGMA table_info(invites)").fetchall()}
    if "email" not in columns:
        cur.execute("ALTER TABLE invites ADD COLUMN email TEXT")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);")
    conn.commit()
    conn.close()


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


def create_invite(email: str, subscription_name: str, created_by: str) -> InviteResponse:
    ensure_invites_table()

    conn = get_db()
    cur = conn.cursor()
    normalized_email = email.strip().lower()

    if "@" not in normalized_email:
        conn.close()
        raise HTTPException(status_code=400, detail="invalid email")

    subscription_row = cur.execute(
        "SELECT * FROM subscriptions WHERE name = ?",
        (subscription_name,)
    ).fetchone()

    if not subscription_row:
        conn.close()
        raise HTTPException(status_code=400, detail="Subscription does not exists")

    while True:
        invite_code = secrets.token_urlsafe(9).replace("-", "").replace("_", "").upper()[:12]
        existing = cur.execute(
            "SELECT id FROM invites WHERE code = ?",
            (invite_code,)
        ).fetchone()
        if not existing:
            break

    cur.execute(
        """
        INSERT INTO invites (code, email, subscription_id, created_by)
        VALUES (?, ?, ?, ?)
        """,
        (invite_code, normalized_email, subscription_row["id"], created_by)
    )
    conn.commit()
    conn.close()

    return InviteResponse(
        code=invite_code,
        email=normalized_email,
        subscription=subscription_row["name"],
        created_by=created_by,
        is_used=False,
    )


def create_user(payload: CreateUserRequest) -> UserResponse:
    ensure_invites_table()

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
    
    
    existing_subscription = None

    if payload.invite_code:
        invite_code = payload.invite_code.strip().upper()
        invite_row = cur.execute(
            """
            SELECT invites.*, subscriptions.name AS subscription_name
            FROM invites
            JOIN subscriptions ON subscriptions.id = invites.subscription_id
            WHERE invites.code = ?
            """,
            (invite_code,)
        ).fetchone()

        if not invite_row:
            conn.close()
            raise HTTPException(status_code=400, detail="Invite code not found")

        if invite_row["used_by"]:
            conn.close()
            raise HTTPException(status_code=400, detail="Invite code already used")

        invite_email = (invite_row["email"] or "").strip().lower()
        if invite_email and invite_email != payload.username.strip().lower():
            conn.close()
            raise HTTPException(status_code=400, detail="Invite email does not match")

        existing_subscription = cur.execute(
            "SELECT * FROM subscriptions WHERE id = ?",
            (invite_row["subscription_id"],)
        ).fetchone()
    else:
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
         existing_subscription["prerecord_transitions_num"], existing_subscription["channel_num"])
    )

    if payload.invite_code:
        cur.execute(
            """
            UPDATE invites
            SET used_by = ?, used_at = datetime('now')
            WHERE code = ?
            """,
            (user_uid, payload.invite_code.strip().upper())
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
