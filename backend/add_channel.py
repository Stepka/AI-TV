import sqlite3
import uuid
import json
import os
import requests
from dotenv import load_dotenv
from openai import OpenAI

# ===== LOAD ENV =====
load_dotenv()

DB_PATH = os.getenv("DB_PATH", "data/users.db")
CHANNELS_ROOT = "channels_data"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_VOICE = {
    "source": "silero",
    "name": "xenia",
    "sex": "female"
}

client = OpenAI(api_key=OPENAI_API_KEY)


# ========= HELPERS =========

def ensure_channel_dirs(user_uid: str, channel_uid: str):
    base_path = os.path.join(CHANNELS_ROOT, user_uid, channel_uid)
    speech_path = os.path.join(base_path, "speech")
    os.makedirs(speech_path, exist_ok=True)


def detect_location():
    try:
        r = requests.get("https://ipinfo.io/json", timeout=5)
        data = r.json()
        city = data.get("city")
        country = data.get("country")
        if city and country:
            return f"{city}, {country}"
    except Exception:
        pass
    return ""


def generate_style_from_description(description: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You generate short music style descriptions for TV or streaming channels."
            },
            {
                "role": "user",
                "content": f"Based on this channel description:\n\n{description}\n\nGenerate a concise but vivid music style description."
            }
        ],
        temperature=0.9,
    )
    return response.choices[0].message.content.strip()


def get_user_uid_by_username(cur, username: str):
    cur.execute("SELECT user_uid FROM users WHERE username = ?", (username,))
    row = cur.fetchone()
    return row[0] if row else None


# ========= MAIN SCRIPT =========

def add_channel():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("\n=== Add New Channel ===")

    username = input("Username: ").strip()

    user_uid = get_user_uid_by_username(cur, username)

    if not user_uid:
        print("❌ User not found.")
        conn.close()
        return

    print(f"✅ Found user_uid: {user_uid}")

    name = input("Channel name: ").strip()
    ch_type = input("Channel type (music_tv / brand_space): ").strip()
    description = input("Channel description: ").strip()

    # --- STYLE GENERATION ---
    style = None
    while not style:
        style = input("Style (leave empty to generate via AI): ").strip()
        if not style:
            style = generate_style_from_description(description)

            print("\n🎵 Generated style:\n")
            print(style)
            print()

            confirm = input("Use this style? (y/n): ").strip().lower()

            if confirm != "y":
                style = None

    # --- AUTO LOCATION ---
    DEFAULT_LOCATION = detect_location()
    print(f"\n📍 Detected location: {DEFAULT_LOCATION}")
    
    location = input(f"Location [{DEFAULT_LOCATION}]: ").strip()
    if not location:
        location = DEFAULT_LOCATION

    print("\n--- Voice ---")
    voice_source = input(f"Voice source [{DEFAULT_VOICE['source']}]: ").strip() or DEFAULT_VOICE["source"]
    voice_name = input(f"Voice name [{DEFAULT_VOICE['name']}]: ").strip() or DEFAULT_VOICE["name"]
    voice_sex = input(f"Voice sex [{DEFAULT_VOICE['sex']}]: ").strip() or DEFAULT_VOICE["sex"]
    voice = json.dumps({
            "source": voice_source,
            "name": voice_name,
            "sex": voice_sex
        }, ensure_ascii=False)

    print("\n--- Actions (enter empty line to finish) ---")
    actions = []
    while True:
        a = input("> ")
        if not a:
            break
        actions.append(a)
    actions = json.dumps(actions, ensure_ascii=False)

    print("\n--- Menu (enter empty line to finish) ---")
    menu = []
    while True:
        m = input("> ")
        if not m:
            break
        menu.append(m)
    menu = json.dumps(menu, ensure_ascii=False)

    channel_uid = str(uuid.uuid4())

    cur.execute("""
        INSERT INTO channels (
            channel_uid, user_uid, name, type, style, description, location,
            voice_json, actions_json, menu_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        channel_uid,
        user_uid,
        name,
        ch_type,
        style,
        description,
        location,
        voice,
        actions,
        menu
    ))

    conn.commit()
    conn.close()

    ensure_channel_dirs(user_uid, channel_uid)

    print("\n✅ Channel successfully created!")
    print(f"Channel UID: {channel_uid}")


if __name__ == "__main__":
    add_channel()
