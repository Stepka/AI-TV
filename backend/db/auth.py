
from http.client import HTTPException

from db.common import get_db
from models.auth import UserResponse


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

    user_uid = user_row["user_uid"]

    conn.close()

    return UserResponse(
        username=username,
        user_uid=user_uid
    )