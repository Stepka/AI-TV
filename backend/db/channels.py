
import json
from typing import List

from fastapi import HTTPException

from models.dj import Voice
from models.channels import Channel, ChannelUpdate
from db.common import get_db


def fetch_channels(username: str) -> List[Channel]:
    conn = get_db()
    cur = conn.cursor()

    # 1) ищем пользователя
    user_row = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    user_uid = user_row["user_uid"]

    # 2) ищем каналы
    channels_rows = cur.execute("SELECT * FROM channels WHERE user_uid = ?", (user_uid,)).fetchall()
    channels = []
    for row in channels_rows:
        channels.append(Channel(
            channel_uid=row["channel_uid"],
            name=row["name"],
            type=row["type"],
            style=row["style"],
            description=row["description"],
            location=row["location"] if row["location"] is not None else "",
            voice=Voice(**json.loads(row["voice_json"])),
            actions=json.loads(row["actions_json"] or "[]"),
            menu=json.loads(row["menu_json"] or "[]"),
            url=row["url"],
        ))

    conn.close()

    return channels

    
def get_channel_by_id(user_uid: str, channel_id: str):
    conn = get_db()
    cur = conn.cursor()

    row = cur.execute("""
        SELECT * FROM channels
        WHERE user_uid = ? AND channel_uid = ?
    """, (user_uid, channel_id)).fetchone()

    conn.close()

    if not row:
        return None

    return {
        "channel_uid": row["channel_uid"],
        "name": row["name"],
        "type": row["type"],
        "style": row["style"],
        "description": row["description"],
        "location": row["location"],
        "voice": json.loads(row["voice_json"] or "{}"),
        "actions": json.loads(row["actions_json"] or "[]"),
        "menu": json.loads(row["menu_json"] or "[]"),
        "url": row["url"],
    }


def update_channel(channel_uid: str, payload: ChannelUpdate):
    conn = get_db()
    cursor = conn.cursor()


    # Пытаемся обновить
    cursor.execute("""
        UPDATE channels
        SET name = ?,
            type = ?,
            style = ?,
            description = ?,
            location = ?,
            voice_json = ?,
            actions_json = ?,
            menu_json = ?,
            url = ?
        WHERE channel_uid = ? AND user_uid = ?
    """, (
        payload.name,
        payload.type,
        payload.style,
        payload.description,
        payload.location,
        payload.voice_json,
        payload.actions_json,
        payload.menu_json,
        payload.url,
        channel_uid,
        payload.user_id
    ))

    if cursor.rowcount == 0:
        # Канал не найден — создаём новый
        cursor.execute("""
            INSERT INTO channels (
                channel_uid, user_uid, name, type, style, description, location,
                voice_json, actions_json, menu_json, created_at, last_played_json, url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), '[]', ?)
        """, (
            channel_uid,
            payload.user_id,
            payload.name,
            payload.type,
            payload.style,
            payload.description,
            payload.location,
            payload.voice_json,
            payload.actions_json,
            payload.menu_json,
            payload.url
        ))

    conn.commit()
    conn.close()
    

def delete_channel(channel_uid: str, user_uid: str):
    conn = get_db()
    cursor = conn.cursor()

    # Пытаемся удалить канал текущего пользователя
    cursor.execute("""
        DELETE FROM channels
        WHERE channel_uid = ? AND user_uid = ?
    """, (channel_uid, user_uid))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Channel not found or not owned by user")

    conn.commit()
    conn.close()