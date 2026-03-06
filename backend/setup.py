import os
import sqlite3
import uuid
import json
from hashlib import sha256

from backend.services.auth import get_password_hash

DB_PATH = "data/users.db"
BASE_CHANNELS_PATH = "channels_data"

def setup_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # USERS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_uid TEXT UNIQUE NOT NULL,          -- публичный id (uuid)
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,

        created_at TEXT DEFAULT (datetime('now'))
    );
    """)

    # CHANNELS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        channel_uid TEXT UNIQUE NOT NULL,       -- публичный id (uuid)
        user_uid TEXT NOT NULL,                 -- связь по user_uid (не по id)

        name TEXT NOT NULL,
        type TEXT NOT NULL,
        style TEXT,
        description TEXT,
        location TEXT,

        voice_json TEXT,                        -- {"source":"silero","name":"xenia","sex":"female"}
        actions_json TEXT,                      -- ["...", "..."]
        menu_json TEXT,                         -- ["...", "..."]

        created_at TEXT DEFAULT (datetime('now')),

        FOREIGN KEY(user_uid) REFERENCES users(user_uid) ON DELETE CASCADE
    );
    """)

    # Индексы
    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_uid ON users(user_uid);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_channels_user_uid ON channels(user_uid);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);")

    conn.commit()
    conn.close()
    print("✅ DB created:", DB_PATH)


def ensure_channel_dirs(user_uid: str, channel_uid: str):
    path = os.path.join(
        BASE_CHANNELS_PATH,
        user_uid,
        channel_uid,
        "speech"
    )
    os.makedirs(path, exist_ok=True)
    return path


def seed_admin():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1️⃣ Создаем admin пользователя
    username = "admin"
    password = "admin"  # не безопасно, потом заменим на hash
    password_hash = get_password_hash(password)
    user_uid = str(uuid.uuid4())

    cur.execute("""
    INSERT OR IGNORE INTO users (user_uid, username, password_hash)
    VALUES (?, ?, ?)
    """, (user_uid, username, password_hash))

    # 2️⃣ Каналы
    channels = {
        "MTV": {
            "type": "music_tv",
            "name": "MTV",
            "style": "modern popular music 2010-2024",
            "description": "global chart hits, pop, hip hop, dance",
            "voice": {"source": "elevenlabs", "name": "jGhxZDfdcvgMh6tm2PBj", "sex": "female"},
        },
        "Retro": {
            "type": "music_tv",
            "name": "Ретро ТВ",
            "style": "classic hits 1980-1989",
            "description": "80s pop, disco, synth, rock",
            "voice": {"source": "silero", "name": "xenia", "sex": "female"},
        },
        "Retro Synth": {
            "type": "music_tv",
            "name": "Ретровейв ТВ",
            "style": "classic synth hits 1980-1989",
            "description": "80s synth, soviet synth",
            "voice": {"source": "silero", "name": "xenia", "sex": "female"},
        },
        "A One": {
            "type": "music_tv",
            "name": "A One",
            "style": "rock and alternative 1995-2010",
            "description": "alternative rock, grunge, indie",
            "voice": {"source": "silero", "name": "xenia", "sex": "female"},
        },
        "Другое Место": {
            "type": "brand_space",
            "name": "Другое Место на Артиллерийской",
            "style": "organic house, melodic house, downtempo, chill progressive, soft oriental fusion",
            "description": "Лаунж кафе Другое Место на артиллерийской, кальяны, чай",
            "voice": {"source": "silero", "name": "xenia", "sex": "female"},
            "actions": [
                "Наше лаунж кафе дарит гостям униувльную возможность - стать обладателем легендарного кольца Картье! Условия акции уточняйте у официанта.",
                "Второй кальян в подарок - дымный бонус к выходным. Суббота и воскресенье с 12:00 до 15:00",
                "Минус цена - плюс удовольствие. С понедельника по пятницу с 12:00 до 16:00",
                "Скидка 20 процентов при заказе на вынос",
            ],
            "location": "Калининград",
            "menu": [
                "Фруктовая чаша 700 рублей",
                "Фруктовая чаша ананас 1000 рублей",
                "Апероль Шпритц 900 рублей",
                "Вино Пино Гриджио 4000 рублей",
                "Мартини Фиеро тоник 900 рублей",
                "Салат Цезарь с креветкой 800 рублей",
                "Ролл Калифорния с креветкой и снежным крабом 1250 рублей",
                "Вок с курицей в сливочном соусе 950 рублей",
                "Чизкейк 700 рублей",
                "Лимонад цитрусовый 0,7 литра 800 рублей",
            ]
        }
    }

    # 3️⃣ Вставка каналов
    for ch_key, ch in channels.items():
        channel_uid = str(uuid.uuid4())
        actions_json = json.dumps(ch.get("actions", []), ensure_ascii=False)
        menu_json = json.dumps(ch.get("menu", []), ensure_ascii=False)
        voice_json = json.dumps(ch.get("voice", {}), ensure_ascii=False)
        location = ch.get("location", "")

        cur.execute("""
        INSERT OR IGNORE INTO channels (
            channel_uid, user_uid, name, type, style, description, location,
            voice_json, actions_json, menu_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            channel_uid,
            user_uid,
            ch["name"],
            ch["type"],
            ch.get("style", ""),
            ch.get("description", ""),
            location,
            voice_json,
            actions_json,
            menu_json
        ))

        # 🔥 создаём папки
        ensure_channel_dirs(user_uid, channel_uid)

    conn.commit()
    conn.close()
    print("✅ Admin and channels seeded!")


if __name__ == "__main__":
    setup_db()
    seed_admin()
