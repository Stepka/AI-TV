import uuid

from fastapi import HTTPException

from models.media import AITrack, AdPhrase
from db.common import get_db


def ensure_ai_tracks_table():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            file_path TEXT UNIQUE NOT NULL,
            image_path TEXT,
            artist TEXT NOT NULL,
            title TEXT NOT NULL,
            duration REAL NOT NULL DEFAULT 0,
            style TEXT NOT NULL DEFAULT '',
            branded_track INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
        """
    )
    columns = {row["name"] for row in cur.execute("PRAGMA table_info(ai_tracks)").fetchall()}
    if "image_path" not in columns:
        cur.execute("ALTER TABLE ai_tracks ADD COLUMN image_path TEXT")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_ai_tracks_user_channel ON ai_tracks(user_id, channel_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_ai_tracks_file_path ON ai_tracks(file_path);")
    conn.commit()
    conn.close()


def add_ai_track(
    user_id: str,
    channel_id: str,
    file_path: str,
    image_path: str | None,
    artist: str,
    title: str,
    duration: float,
    style: str,
    branded_track: bool,
):
    ensure_ai_tracks_table()

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT OR REPLACE INTO ai_tracks (
            track_id, user_id, channel_id, file_path, image_path, artist, title, duration, style, branded_track
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            user_id,
            channel_id,
            file_path,
            image_path,
            artist,
            title,
            duration,
            style,
            int(branded_track),
        )
    )
    conn.commit()
    conn.close()


def fetch_ai_tracks(user_id: str, channel_id: str) -> list[AITrack]:
    ensure_ai_tracks_table()

    conn = get_db()
    cur = conn.cursor()
    rows = cur.execute(
        """
        SELECT track_id, user_id, channel_id, file_path, image_path, artist, title, duration, style, branded_track
        FROM ai_tracks
        WHERE user_id = ? AND channel_id = ?
        ORDER BY created_at DESC, id DESC
        """,
        (user_id, channel_id)
    ).fetchall()
    conn.close()

    return [AITrack(**row) for row in rows]


def delete_ai_track_by_filename(user_id: str, channel_id: str, filename: str) -> AITrack | None:
    ensure_ai_tracks_table()

    conn = get_db()
    cur = conn.cursor()
    row = cur.execute(
        """
        SELECT track_id, user_id, channel_id, file_path, image_path, artist, title, duration, style, branded_track
        FROM ai_tracks
        WHERE user_id = ? AND channel_id = ? AND file_path LIKE ?
        ORDER BY id DESC
        LIMIT 1
        """,
        (user_id, channel_id, f"%/{filename}")
    ).fetchone()

    if not row:
        conn.close()
        return None

    cur.execute("DELETE FROM ai_tracks WHERE track_id = ?", (row["track_id"],))
    conn.commit()
    conn.close()

    return AITrack(**row)


def fetch_ad_library(user_id: str, channel_id: str, type: str) -> AdPhrase:
    conn = get_db()
    cur = conn.cursor()

    rows = cur.execute("SELECT * FROM ads WHERE user_id = ? and channel_id = ? and type = ?", (user_id, channel_id, type)).fetchall()

    conn.close()

    return [AdPhrase(**row) for row in rows]


def fetch_ad(ad_id: str, user_id: str, channel_id: str) -> AdPhrase:
    conn = get_db()
    cur = conn.cursor()

    row = cur.execute("SELECT * FROM ads WHERE user_id = ? and channel_id = ? and ad_id = ?", (user_id, channel_id, ad_id)).fetchone()

    conn.close()

    return AdPhrase(**row)


def add_ad(payload: AdPhrase):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO ads (
            ad_id, channel_id, user_id, ad_text, speech, filename, voice_model, voice_speaker, voice_sex, type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payload.ad_id,
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
        WHERE channel_id = ? AND user_id = ? AND ad_id = ?
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
            payload.ad_id
    ))

    if cursor.rowcount == 0:
        # Канал не найден — создаём новый
        add_ad(payload)
    else:
        conn.commit()

    conn.close()

def delete_ad(ad_id: str, user_id: str, channel_id: str) -> bool:
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "DELETE FROM ads WHERE user_id = ? AND channel_id = ? AND ad_id = ?",
        (user_id, channel_id, ad_id)
    )

    conn.commit()
    deleted = cur.rowcount  # сколько строк удалено

    conn.close()

    return deleted > 0
