import sqlite3
import os

class YouTubeCache:
    def __init__(self, db_path="youtube_cache.db"):
        self.db_path = db_path
        # Если база не существует — создаём её
        first_time = not os.path.exists(self.db_path)
        self.conn = sqlite3.connect(self.db_path)
        self.c = self.conn.cursor()

        if first_time:
            self._create_table()

    def _create_table(self):
        """Создаём таблицу для кеша треков"""
        self.c.execute("""
            CREATE TABLE IF NOT EXISTS track_cache (
                artist TEXT NOT NULL,
                title TEXT NOT NULL,
                videoId TEXT NOT NULL,
                PRIMARY KEY (artist, title)
            )
        """)
        self.conn.commit()

    def get_video(self, artist: str, title: str):
        """Проверяем есть ли видео в кеше"""
        self.c.execute(
            "SELECT videoId FROM track_cache WHERE artist=? AND title=?",
            (artist, title)
        )
        row = self.c.fetchone()
        if row:
            return row[0]
        return None

    def save_video(self, artist: str, title: str, videoId: str):
        """Сохраняем видео в кеш"""
        self.c.execute(
            "INSERT OR REPLACE INTO track_cache (artist, title, videoId) VALUES (?, ?, ?)",
            (artist, title, videoId)
        )
        self.conn.commit()

    def close(self):
        """Закрыть соединение с базой"""
        self.conn.close()
