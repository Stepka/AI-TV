import json

from db.common import get_db, get_yt_db


def get_last_played(user_uid: str, channel_id: str):
    conn = get_db()
    cur = conn.cursor()

    row = cur.execute("""
        SELECT * FROM channels
        WHERE user_uid = ? AND channel_uid = ?
    """, (user_uid, channel_id)).fetchone()

    conn.close()

    if not row:
        return []

    return json.loads(row["last_played_json"] or "[]")

    
def save_last_played(user_uid: str, channel_id: str, last_played_list):
    """
    Сохраняет последний плейлист для конкретного канала пользователя
    и возвращает его как список.
    """
    # Преобразуем список в JSON
    last_played_json = json.dumps(last_played_list, ensure_ascii=False)

    conn = get_db()
    cur = conn.cursor()

    # Обновляем last_played_json
    cur.execute("""
        UPDATE channels
        SET last_played_json = ?
        WHERE user_uid = ? AND channel_uid = ?
    """, (last_played_json, user_uid, channel_id))

    conn.commit()
    conn.close()

    return last_played_list



def find_tracks(artist: str, title: str, limit: int = 3):
    conn = get_yt_db()

    q = """
    SELECT *
    FROM youtube_music_hits
    WHERE lower(performerLabel) LIKE '%' || lower(?) || '%'
      AND lower(itemLabel)  LIKE '%' || lower(?) || '%'
    LIMIT ?
    """

    rows = conn.execute(q, (artist, title, limit)).fetchall()
    conn.close()

    return [dict(r) for r in rows]


def get_video_sources(user_uid: str, channel_id: str):
    conn = get_db()
    cur = conn.cursor()

    row = cur.execute("""
        SELECT * FROM channels
        WHERE user_uid = ? AND channel_uid = ?
    """, (user_uid, channel_id)).fetchone()

    conn.close()

    if not row:
        return []

    return json.loads(row["sources_json"] or "[]")