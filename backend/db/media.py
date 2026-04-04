from fastapi import HTTPException

from models.media import AdPhrase
from db.common import get_db


def fetch_ad_library(user_id: str, channel_id: str, type: str) -> AdPhrase:
    conn = get_db()
    cur = conn.cursor()

    rows = cur.execute("SELECT * FROM ads WHERE user_id = ? and channel_id = ? and type = ?", (user_id, channel_id, type)).fetchall()

    conn.close()

    return [AdPhrase(**row) for row in rows]


def fetch_ad(id: str, user_id: str, channel_id: str) -> AdPhrase:
    conn = get_db()
    cur = conn.cursor()

    row = cur.execute("SELECT * FROM ads WHERE user_id = ? and channel_id = ? and id = ?", (user_id, channel_id, id)).fetchone()

    conn.close()

    return AdPhrase(**row)


def add_ad(payload: AdPhrase):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO ads (
            id, channel_id, user_id, ad_text, speech, filename, voice_model, voice_speaker, voice_sex, type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payload.id,
        payload.channel_id,
        payload.user_id,
        payload.ad_text,
        payload.speech,
        payload.filename,
        payload.voice_model,
        payload.voice_speaker,
        payload.voice_sex,
        payload.type
    ))

    conn.commit()
    conn.close()


def update_ad(payload: AdPhrase):
    conn = get_db()
    cursor = conn.cursor()


    # Пытаемся обновить
    cursor.execute("""
        UPDATE ads
        SET ad_text = ?,
            speech = ?,
            filename = ?,
            voice_model = ?,
            voice_speaker = ?,
            voice_sex = ?,
            type = ?,
            duration = ?
        WHERE channel_id = ? AND user_id = ? AND id = ?
    """, (
            payload.ad_text,
            payload.speech,
            payload.filename,
            payload.voice_model,
            payload.voice_speaker,
            payload.voice_sex,
            payload.type,
            payload.duration,
            payload.channel_id,
            payload.user_id,
            payload.id
    ))

    if cursor.rowcount == 0:
        # Канал не найден — создаём новый
        add_ad(payload)
    else:
        conn.commit()

    conn.close()