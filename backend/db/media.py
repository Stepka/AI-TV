import uuid
import json

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


def ensure_ai_track_generation_jobs_table():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS ai_track_generation_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            branded_track INTEGER NOT NULL DEFAULT 0,
            requested_tracks_count INTEGER NOT NULL,
            generated_tracks_count INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL,
            error TEXT,
            result_json TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            started_at TEXT,
            finished_at TEXT
        )
        """
    )
    cur.execute("CREATE INDEX IF NOT EXISTS idx_ai_track_jobs_user_channel ON ai_track_generation_jobs(user_id, channel_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_ai_track_jobs_status ON ai_track_generation_jobs(status);")
    conn.commit()
    conn.close()


def create_ai_track_generation_job(
    user_id: str,
    channel_id: str,
    branded_track: bool,
    requested_tracks_count: int,
) -> str:
    ensure_ai_track_generation_jobs_table()

    job_id = str(uuid.uuid4())
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO ai_track_generation_jobs (
            job_id, user_id, channel_id, branded_track, requested_tracks_count, status
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        (job_id, user_id, channel_id, int(branded_track), requested_tracks_count, "queued")
    )
    conn.commit()
    conn.close()
    return job_id


def fetch_ai_track_generation_job(job_id: str):
    ensure_ai_track_generation_jobs_table()

    conn = get_db()
    cur = conn.cursor()
    row = cur.execute(
        "SELECT * FROM ai_track_generation_jobs WHERE job_id = ?",
        (job_id,)
    ).fetchone()
    conn.close()

    if not row:
        return None

    data = dict(row)
    data["branded_track"] = bool(data["branded_track"])
    data["result"] = json.loads(data["result_json"]) if data.get("result_json") else None
    data.pop("result_json", None)
    return data


def fetch_latest_active_ai_track_generation_job(user_id: str, channel_id: str):
    ensure_ai_track_generation_jobs_table()

    conn = get_db()
    cur = conn.cursor()
    row = cur.execute(
        """
        SELECT * FROM ai_track_generation_jobs
        WHERE user_id = ?
          AND channel_id = ?
          AND status IN ('queued', 'running')
        ORDER BY id DESC
        LIMIT 1
        """,
        (user_id, channel_id)
    ).fetchone()
    conn.close()

    if not row:
        return None

    data = dict(row)
    data["branded_track"] = bool(data["branded_track"])
    data["result"] = json.loads(data["result_json"]) if data.get("result_json") else None
    data.pop("result_json", None)
    return data


def mark_ai_track_generation_job_running(job_id: str):
    ensure_ai_track_generation_jobs_table()

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE ai_track_generation_jobs
        SET status = 'running', started_at = datetime('now')
        WHERE job_id = ?
        """,
        (job_id,)
    )
    conn.commit()
    conn.close()


def mark_ai_track_generation_job_done(job_id: str, result: dict):
    ensure_ai_track_generation_jobs_table()

    generated_count = result.get("generated_tracks_count", 0)
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE ai_track_generation_jobs
        SET status = 'done',
            generated_tracks_count = ?,
            result_json = ?,
            finished_at = datetime('now')
        WHERE job_id = ?
        """,
        (generated_count, json.dumps(result, ensure_ascii=False), job_id)
    )
    conn.commit()
    conn.close()


def mark_ai_track_generation_job_failed(job_id: str, error: str):
    ensure_ai_track_generation_jobs_table()

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE ai_track_generation_jobs
        SET status = 'failed',
            error = ?,
            finished_at = datetime('now')
        WHERE job_id = ?
        """,
        (error, job_id)
    )
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
