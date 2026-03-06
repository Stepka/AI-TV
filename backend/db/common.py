import sqlite3


USERS_DB_PATH = "data/users.db"
YT_DB_PATH = "data/youtube_music_hits.db"


def get_db():
    conn = sqlite3.connect(USERS_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_yt_db():
    conn = sqlite3.connect(YT_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn