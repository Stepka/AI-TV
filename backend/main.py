import ctypes
from datetime import datetime
import hashlib
import random
import re
import numpy as np

from fastapi import Depends, FastAPI, Query
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from phonemizer.backend.espeak.wrapper import EspeakWrapper
from auth import authenticate_user, create_access_token, get_current_user
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import sqlite3, json
from typing import List, Dict

import requests
from dotenv import load_dotenv
import sqlite3
import os
import json
from scipy.io.wavfile import write
from openai import OpenAI
import torch
import torchaudio

from phonemizer import phonemize
import re

load_dotenv()
# EspeakWrapper.set_library(r"C:\Program Files\eSpeak NG\libespeak-ng.dll")

from yt_cache import YouTubeCache
from elevenlabs.client import ElevenLabs
from silero import silero_tts

app = FastAPI()

# Разрешаем фронтенду подключаться
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data/youtube_music_hits.db"

llm_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

elevenlabs_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

silero_model, _ = silero_tts(language='ru',
                                 speaker='v5_1_ru')

# ===== 3) Silero VAD =====
silero_vad_model, vad_utils = torch.hub.load(
    repo_or_dir="snakers4/silero-vad",
    model="silero_vad",
    force_reload=False
)

(get_speech_timestamps, _, _, _, _) = vad_utils

# Предопределенные каналы
# CHANNELS = {
    
#     "MTV": {
#         "type": "music_tv",
#         "name": "MTV",
#         "style": "modern popular music 2010-2024",
#         "description": "global chart hits, pop, hip hop, dance",
#         # "voice": {
#         #     "source": "silero", 
#         #     "name": "xenia",
#         #     "sex": "female"
#         # }
#         "voice": {
#             "source": "elevenlabs", 
#             # "name": "PB6BdkFkZLbI39GHdnbQ", # eleven_multilingual_v2 sexy expensive 
#             "name": "jGhxZDfdcvgMh6tm2PBj", # drugaya_natasha         
#             # "name": "2zRM7PkgwBPiau2jvVXc", # бодро
#             "sex": "female"
#         },
#     },
    
#     "Retro": {
#         "type": "music_tv",
#         "name": "Retro TV",
#         "style": "classic hits 1980-1989",
#         "description": "80s pop, disco, synth, rock",
#         "voice": {
#             "source": "silero", 
#             "name": "xenia",
#             "sex": "female"
#         }
#     },
    
#     "Retro Synth": {
#         "type": "music_tv",
#         "name": "Retro Synth TV",
#         "style": "classic synth hits 1980-1989",
#         "description": "80s synth, soviet synth",
#         "voice": {
#             "source": "silero", 
#             "name": "xenia",
#             "sex": "female"
#         }
#     },
    
#     "A One": {
#         "type": "music_tv",
#         "name": "A One",
#         "style": "rock and alternative 1995-2010",
#         "description": "alternative rock, grunge, indie",
#         "voice": {
#             "source": "silero", 
#             "name": "xenia",
#             "sex": "female"
#         }
#     },
    
#     "Другое Место": {
#         "type": "brand_space",
#         # "style": 
#         #     "chill electronic and oriental lounge, "
#         #     "deep house, organic house, downtempo, "
#         #     "oriental chill, hookah lounge vibes",
#         "style":
#             "organic house, melodic house, "
#             "downtempo, chill progressive, "
#             "soft oriental fusion, ",
#         # "style":
#         #     "luxury lounge, "
#         #     "organic house, melodic house, "
#         #     "downtempo, chill progressive, "
#         #     "soft oriental fusion, "
#         #     "sunset rooftop vibes, hookah lounge mood",
#         # "style":
#         #     "modern chill, "
#         #     "lo-fi house, deep house, "
#         #     "slow techno, minimal grooves, "
#         #     "late night city vibes, "
#         #     "smooth electronic background, "
#         #     "hookah lounge energy",

#         "name": "Лаунж кафе Другое Место на артиллерийской",
#         "description": "Лаунж кафе Другое Место на артиллерийской, кальяны, чай",
#         # "voice": {
#         #     "source": "elevenlabs", 
#         #     # "name": "PB6BdkFkZLbI39GHdnbQ", # eleven_multilingual_v2 sexy expensive 
#         #     "name": "jGhxZDfdcvgMh6tm2PBj", # drugaya_natasha         
#         #     # "name": "2zRM7PkgwBPiau2jvVXc", # бодро
#         #     "sex": "female"
#         # },
#         "voice": {
#             "source": "silero", 
#             "name": "xenia",
#             "sex": "female"
#         },
#         "action": [
#             "Наше лаунж кафе дарит гостям униувльную возможность - стать обладателем легендарного кольца Картье! Условия акции уточняйте у официанта.",
#             "Второй кальян в подарок - дымный бонус к выходным. Суббота и воскресенье с 12:00 до 15:00",
#             "Минус цена - плюс удовольствие. С понедельника по пятницу с 12:00 до 16:00",
#             "Скидка 20 процентов при заказе на вынос",
#         ],
#         "location": "Калининград",
#         "menu": [
#             "Фруктовая чаша 700 рублей",
#             "Фруктовая чаша ананас 1000 рублей",
#             "Апероль Шпритц 900 рублей",
#             "Вино Пино Гриджио 4000 рублей",
#             "Мартини Фиеро тоник 900 рублей",
#             "Салат Цезарь с креветкой 800 рублей",
#             "Ролл Калифорния с креветкой и снежным крабом 1250 рублей",
#             "Вок с курицей в сливочном соусе 950 рублей",
#             "Чизкейк 700 рублей",
#             "Лимонад цитрусовый 0,7 литра 800 рублей",
#         ]
#     },
    
#     "Пеперончино": {
#         "type": "brand_space",
#         "style": 
#             "family-friendly pop and soft rock, "
#             "italian classics, acoustic hits, "
#             "easy listening, light funk, "
#             "feel-good background music",
#         "name": "Пеперончино",
#         "description": "ПЕПЕРОНЧИНО🌶️ | Пиццерия Калининград",
#         "voice": {
#             "source": "silero", 
#             "name": "xenia",
#             "sex": "female"
#         },
#         "action": [
#             "Покажите ваш билет на концерт (в день мероприятия) и получите две фирменные настойки на выбор в подарок!",
#             "Бокал игристого каждому гостю при заказе завтрака с 11:00 до 14:00",
#         ],
#         "location": "Калининград",
#         "menu": [
#             "Неполитанская пицца Пьемонт 550 рублей (было 695)",
#             "Неполитанская пицца Цезарио 550 рублей (было 695)",
#             "Куриный суп с домашней лапшой 315 рублей (было 395)",
#             "NEW Салат с креветками 655 рублей",
#             "Чизкейк Сан-Себастьян 315 рублей (было 395)",
#         ]
#     },
    
#     "X-Fit": {
#         "type": "brand_space",
#         "style":
#             "energetic workout pop, "
#             "motivational EDM, "
#             "commercial house, "
#             "clean hip-hop, "
#             "uplifting dance hits, "
#             "gym-friendly bangers",
#         "name": "X-Fit",
#         "description": "X-Fit | Фитнес-клуб и тренажёрный зал",
#         "voice": {
#             "source": "elevenlabs", 
#             "name": "random_female",
#             "sex": "female"
#         },
#         "action": [
#             "Гостевой визит на 1 день бесплатно при записи через администратора",
#             "Скидка 20% на персональные тренировки при покупке пакета 10 занятий",
#             "Акция: приведи друга — получите по семь дней продления абонемента",
#         ],
#         "location": "Калининград",
#         "menu": [
#             "Абонемент 1 месяц — от 4 990 ₽",
#             "Абонемент 3 месяца — от 12 990 ₽",
#             "Персональная тренировка — от 1 500 ₽",
#             "Пакет 10 персональных тренировок — от 12 900 ₽",
#             "Фитнес-тестирование + консультация тренера — 990 ₽",
#         ],
#     },

#     "Эдкар": {
#         "type": "brand_space",
#         "style":
#             "calm modern lounge, "
#             "soft chill electronic, "
#             "warm acoustic pop, "
#             "smooth jazz, "
#             "relaxing background music, "
#             "minimal piano and ambient",
#         "name": "Эдкар",
#         "description": "Эдкар | Семейная медицина и стоматология",
#         "voice": {
#             "source": "silero", 
#             "name": "xenia",
#             "sex": "female"
#         },
#         "action": [
#             "Профилактический осмотр стоматолога — бесплатно при первом визите",
#             "Комплекс: профгигиена + консультация — по специальной цене",
#             "Семейная программа: скидка 10% при записи 2+ членов семьи",
#         ],
#         "location": "Калининград",
#         "menu": [
#             "Консультация стоматолога — от 800 ₽",
#             "Профессиональная гигиена полости рта — от 3 500 ₽",
#             "Лечение кариеса — от 4 200 ₽",
#             "УЗИ (по направлению) — от 1 200 ₽",
#             "Приём терапевта — от 1 600 ₽",
#         ],
#     },

#     "Exeed": {
#         "type": "brand_space",
#         "style":
#             "premium modern pop, "
#             "cinematic electronic, "
#             "future bass, "
#             "clean trap beats, "
#             "high-end lounge, "
#             "confident driving vibes",
#         "name": "EXEED",
#         "description": "EXEED | Автомобильный дилерский центр",
#         "voice": {
#             "source": "silero", 
#             "name": "xenia",
#             "sex": "female"
#         },
#         "action": [
#             "Тест-драйв в удобное время + фирменный подарок при записи онлайн",
#             "Trade-in: дополнительная выгода до 150 000 ₽ при сдаче авто",
#             "Кредитная программа: сниженная ставка при первом взносе от 30%",
#         ],
#         "location": "Калининград",
#         "menu": [
#             "EXEED LX — от 2 800 000 ₽",
#             "EXEED TXL — от 3 600 000 ₽",
#             "EXEED RX — от 4 500 000 ₽",
#             "КАСКО + ОСАГО в дилерском центре — индивидуальный расчёт",
#             "Сервисное ТО — от 12 000 ₽",
#         ],
#     },

#     "О, Pretty People": {
#         "type": "brand_space",
#         "style":
#             "trendy beauty lounge pop, "
#             "soft r&b, "
#             "modern chill, "
#             "minimal deep house, "
#             "clean tik-tok hits, "
#             "warm aesthetic vibes",
#         "name": "О, Pretty People",
#         "description": "О, Pretty People | Салон красоты",
#         "voice": {
#             "source": "silero", 
#             "name": "xenia",
#             "sex": "female"
#         },
#         "action": [
#             "Скидка 15% на первое посещение при записи онлайн",
#             "Маникюр + покрытие — по спеццене в будние дни до 15:00",
#             "Приведи подругу — получите по 10% скидки на следующую услугу",
#         ],
#         "location": "Калининград",
#         "menu": [
#             "Маникюр + покрытие гель-лак — от 2 200 ₽",
#             "Педикюр + покрытие — от 3 200 ₽",
#             "Стрижка женская — от 1 800 ₽",
#             "Окрашивание (тон/сложное) — от 4 500 ₽",
#             "Ламинирование ресниц — от 2 400 ₽",
#         ],
#     },

#     "OldBoy": {
#         "type": "brand_space",
#         "style":
#             "confident hip-hop, "
#             "old school rap, "
#             "modern trap, "
#             "funky beats, "
#             "barbershop swagger, "
#             "clean rock classics, "
#             "masculine lounge vibes",
#         "name": "OldBoy",
#         "description": "OldBoy | Барбершоп",
#         "voice": {
#             "source": "elevenlabs", 
#             "name": "random_male",
#             "sex": "male"
#         },
#         "action": [
#             "Скидка 10% на первое посещение при записи через администратора",
#             "Отец + сын: специальная цена на комплекс стрижек",
#             "Стрижка + борода: выгодный комбо-тариф в будние дни",
#         ],
#         "location": "Калининград",
#         "menu": [
#             "Мужская стрижка — от 1 600 ₽",
#             "Стрижка машинкой — от 900 ₽",
#             "Оформление бороды — от 1 100 ₽",
#             "Комплекс: стрижка + борода — от 2 500 ₽",
#             "Детская стрижка — от 1 200 ₽",
#         ],
#     },

# }

REPLACE_DICT = {
    "трек": "трэк",
    "треком": "трэком",
    "треки": "трэки",
    "трека": "трэка",
    "треку": "трэку",
    "энергия": "энэргия",
    "энергию": "энэргию",
    # "энергией": "энэргией",
    "энергии": "энэргии",
}

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") 


class PlaylistRequest(BaseModel):
    user_id: str
    channel_id: str
    max_results: int = 10

    
class DJRequest(BaseModel):
    user_id: str
    channel_id: str
    from_title: str
    to_title: str


class LoginRequest(BaseModel):
    username: str
    password: str


### Аутентификация и авторизация (JWT) для админки и будущих персональных кабинетов пользователей

USERS_DB_PATH = "data/users.db"

# -----------------------------
# Pydantic модели
# -----------------------------
class Voice(BaseModel):
    source: str
    name: str
    sex: str

class Channel(BaseModel):
    channel_uid: str
    name: str
    type: str
    style: str
    description: str
    location: str = ""
    voice: Voice
    actions: List[str] = []
    menu: List[str] = []

class UserResponse(BaseModel):
    username: str
    user_uid: str
    channels: List[Channel] = []


# -----------------------------
# Получение пользователя + каналов из базы
# -----------------------------
def fetch_user_with_channels(username: str) -> UserResponse:
    conn = sqlite3.connect(USERS_DB_PATH)
    conn.row_factory = sqlite3.Row
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
            menu=json.loads(row["menu_json"] or "[]")
        ))

    conn.close()

    return UserResponse(
        username=username,
        user_uid=user_uid,
        channels=channels
    )

# -----------------------------
# Эндпоинты
# -----------------------------
@app.post("/auth/login")
def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        return {"ok": False, "error": "wrong login or password"}

    token = create_access_token({"sub": user["username"]})
    return {"ok": True, "access_token": token, "token_type": "bearer"}

@app.get("/me")
def me(username: str = Depends(get_current_user)):
    user_data = fetch_user_with_channels(username)
    return {"ok": True, "user": user_data.dict()}


### Основные эндпоинты для получения плейлиста, генерации текста и аудио для DJ переходов, а также получения видео по ID

@app.post("/playlist")
def get_playlist(req: PlaylistRequest):
    cache = YouTubeCache()  # при первом запуске база создастся автоматически

    # tracks = generate_playlist_llm(req.user_id, req.channel_id, req.max_results*4)
    tracks = []
    try:
        tracks = generate_playlist_ppx(req.user_id, req.channel_id, req.max_results)
        print(f"PPX tracks found: {len(tracks)}")
        if len(tracks) == 0: raise Exception("No found tracks")
    except Exception as e:
        print(e)
    
    gpt_tracks = generate_playlist_llm(req.user_id, req.channel_id, req.max_results)
    print(f"GPT tracks found: {len(gpt_tracks)}")
    tracks += gpt_tracks
    print(f"Generated tracks {len(tracks)}:", tracks)

    videos = []
    for track in tracks:
        video_id = cache.get_video(track['artist'], track['title'])
        if not video_id:

            found = find_tracks(track['artist'], track['title'])

            if len(found) > 0:
                print(found)
                video_id = found[0]['youtubeId']
                
            else:
                # поиск через YouTube API
                print("Searching YouTube for:", track)

                query = f"{track['artist']} {track['title']} official music video"
                yt_video = search_youtube_video(query)
                # print("YouTube search result:", yt_video)

                if yt_video:
                    matched = check_title_llm(track['artist'] + " - " + track['title'], yt_video['title'])
                    if matched:
                        video_id = yt_video["videoId"]

                        try:
                            video_duration = get_video_duration(video_id)
                            if not video_duration or video_duration < 60 or video_duration > 15*60:  # фильтр по длительности (не больше 15 минут)
                                continue
                            cache.save_video(track['artist'], track['title'], video_id)
                        except Exception as e:
                            print(e)
                            continue
            
        if video_id:
            videos.append({
                "artist": track['artist'],
                "title": track['title'],
                "videoId": video_id,
                "match": track['match']
            })
            
    
    indexed = [(i, t) for i, t in enumerate(videos)]
    top_n = sorted(indexed, key=lambda x: float(x[1]["match"]), reverse=True)[:req.max_results]
    videos = [t for i, t in sorted(top_n, key=lambda x: x[0])]

    print("Selected videos:")
    print(videos)
    return {
        "playlist": videos,
        "source": "llm+youtube"
    }



@app.get("/")
def get_home():
    return "It's AI-TV, baby!"


@app.get("/audio")
def get_audio(filename: str, user_id: str, channel_id: str, user=Depends(get_current_user)):
    print("Serving audio file:", user_id, channel_id, filename)
    return FileResponse(f"channels_data/{user_id}/{channel_id}/speech/{filename}", media_type="audio/wav", filename=filename)


@app.post("/dj_transition")
def dj_transition(req: DJRequest, user=Depends(get_current_user)):
    sample_rate = 48000

    text = generate_dj_text(
        user_uid=req.user_id,
        channel_uid=req.channel_id,
        from_title=req.from_title,
        to_title=req.to_title,
    )

    print("Generated text:", text)
    
    meta = get_channel_by_id(req.user_id, req.channel_id)

    def generate_speech():
        audio = None
        match meta["voice"]["source"]:
        
            case "elevenlabs":
                # Get raw response with headers
                if meta["voice"]["sex"] == "male":
                    voice_id = "YOq2y2Up4RgXP2HyXjE5" if meta["voice"]["name"] == "random_male" else meta["voice"]["name"]  # пример, нужно подобрать под нужные голоса
                else:
                    voice_id = "2zRM7PkgwBPiau2jvVXc" if meta["voice"]["name"] == "random_female" else meta["voice"]["name"]  # пример, нужно подобрать под нужные голоса
                
                audio = elevenlabs_client.text_to_speech.convert(
                    text=text,
                    # model_id="eleven_multilingual_v2",
                    model_id="eleven_v3",
                    voice_id=voice_id,
                    output_format="wav_48000",
                )
                # from elevenlabs.play import play
                # play(audio)
                audio_data = b"".join(audio)    
                # Преобразуем байты в NumPy массив int16
                audio = np.frombuffer(audio_data, dtype=np.int16)
                print("Generated audio with elevenlabs")
            
            case _:
                ssml_text = f"<speak>{text}</speak>"
                audio = silero_model.apply_tts(
                    ssml_text=ssml_text,
                    sample_rate=sample_rate
                )
                audio_numpy = audio.cpu().numpy()  # конвертируем в numpy
                audio = (audio_numpy * 32767).astype(np.int16)  # приводим к int16

        return audio
    
    retries = 3
    is_speech = False
    audio = None
    while audio is None and retries > 0:
        audio = generate_speech()
        is_speech = has_speech(audio, sample_rate, threshold=0.5)
        retries -= 1
        duration_seconds = 30
        # Количество сэмплов
        num_samples = audio.shape[0]
        # Длительность в секундах
        duration_seconds = num_samples / sample_rate
        print(f"Generated {duration_seconds:.2f} sec audio with {meta["voice"]["source"]}")
        raw = f"{req.user_id}|{req.channel_id}|{req.from_title}|{req.to_title}"
        h = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]  # короткий хэш

        filename = f"dj_{h}.wav"
        write(f"channels_data/{req.user_id}/{req.channel_id}/speech/{filename}", sample_rate, audio)
          

    if is_speech:
        return {
            "text": text,
            "audio_filename": filename,
            "duration": duration_seconds,
            "format": "wav"
        }
    
    print(f"!!!!!!!!!!!!!!!!!!!!! {filename} bad speech")

    return {
        "text": text,
        "audio_filename": "",
        "duration": 0,
        "format": "wav"
    }


@app.post("/dj_hello")
def dj_hello(req: DJRequest, user=Depends(get_current_user)):
    sample_rate = 48000

    text = generate_dj_text(
        user_uid=req.user_id,
        channel_uid=req.channel_id,
        from_title=None,
        to_title=req.to_title,
    )

    print("Generated text:", text)
    
    meta = get_channel_by_id(req.user_id, req.channel_id)

    def generate_speech():
        audio = None
        match meta["voice"]["source"]:
        
            case "elevenlabs":
                # Get raw response with headers
                if meta["voice"]["sex"] == "male":
                    voice_id = "YOq2y2Up4RgXP2HyXjE5" if meta["voice"]["name"] == "random_male" else meta["voice"]["name"]  # пример, нужно подобрать под нужные голоса
                else:
                    voice_id = "2zRM7PkgwBPiau2jvVXc" if meta["voice"]["name"] == "random_female" else meta["voice"]["name"]  # пример, нужно подобрать под нужные голоса
                
                audio = elevenlabs_client.text_to_speech.convert(
                    text=text,
                    # model_id="eleven_multilingual_v2",
                    model_id="eleven_v3",
                    voice_id=voice_id,
                    output_format="wav_48000",
                )
                # from elevenlabs.play import play
                # play(audio)
                audio_data = b"".join(audio)    
                # Преобразуем байты в NumPy массив int16
                audio = np.frombuffer(audio_data, dtype=np.int16)
                print("Generated audio with elevenlabs")
            
            case _:
                ssml_text = f"<speak>{text}</speak>"
                audio = silero_model.apply_tts(
                    ssml_text=ssml_text,
                    sample_rate=sample_rate
                )
                audio_numpy = audio.cpu().numpy()  # конвертируем в numpy
                audio = (audio_numpy * 32767).astype(np.int16)  # приводим к int16

        return audio
    
    retries = 3
    is_speech = False
    audio = None
    while audio is None and retries > 0:
        audio = generate_speech()
        is_speech = has_speech(audio, sample_rate, threshold=0.5)
        retries -= 1
        duration_seconds = 30
        # Количество сэмплов
        num_samples = audio.shape[0]
        # Длительность в секундах
        duration_seconds = num_samples / sample_rate
        print(f"Generated {duration_seconds:.2f} sec audio with {meta["voice"]["source"]}")
        raw = f"{req.user_id}|{req.channel_id}|{req.from_title}|{req.to_title}"
        h = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]  # короткий хэш

        filename = f"dj_{h}.wav"
        write(f"channels_data/{req.user_id}/{req.channel_id}/speech/{filename}", sample_rate, audio)
          

    if is_speech:
        return {
            "text": text,
            "audio_filename": filename,
            "duration": duration_seconds,
            "format": "wav"
        }
    
    print(f"!!!!!!!!!!!!!!!!!!!!! {filename} bad speech")

    return {
        "text": text,
        "audio_filename": "",
        "duration": 0,
        "format": "wav"
    }


@app.get("/video")
def get_video(
    user_id: str = Query(...),
    channel_id: str = Query(...),
    filename: str = Query(...)
):
    print("Serving video file:", user_id, channel_id, filename)

    base_path = os.path.join(
        "channels_data",
        user_id,
        channel_id,
        "videos"
    )

    file_path = os.path.join(base_path, filename)

    # # 🔒 защита от path traversal
    # file_path = os.path.normpath(file_path)
    # if not file_path.startswith(os.path.abspath("channels_data")):
    #     return {"error": "Invalid path"}

    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(
            file_path,
            media_type="video/mp4",
            filename=filename
        )

    # 🔁 fallback
    fallback_path = os.path.join(
        "channels_data",
        "common",
        "videos",
        "13637307_1920_1080_24fps.mp4"
    )

    if os.path.exists(fallback_path):
        return FileResponse(
            fallback_path,
            media_type="video/mp4",
            filename="fallback.mp4"
        )

    return {"error": "Video not found"}


################################################ 


def search_youtube_video(query: str):
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 1,
        "key": YOUTUBE_API_KEY
    }
    r = requests.get(url, params=params)
    # print("YouTube API response:", r.json())
    items = r.json().get("items", [])

    if not items:
        return None

    item = items[0]
    # print("Found YouTube video:", item)
    # return item["id"]["videoId"]
    return {
        "title": item["snippet"]["title"],
        "videoId": item["id"]["videoId"],
        "channelTitle": item["snippet"]["channelTitle"]
    }


def get_video_duration(video_id: str) -> str:
    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "contentDetails",
        "id": video_id,
        "key": YOUTUBE_API_KEY
    }

    r = requests.get(url, params=params)
    r.raise_for_status()

    items = r.json().get("items", [])
    if not items:
        return None

    # print("Video content details:", items[0])

    # ISO 8601 duration, например "PT3M25S"
    return parse_yt_duration_to_seconds(items[0]["contentDetails"]["duration"])


def parse_yt_duration_to_seconds(duration: str) -> int:
    """
    YouTube duration ISO 8601 -> seconds
    Examples:
      PT3M25S -> 205
      PT45S   -> 45
      PT1H2M10S -> 3730
    """
    if not duration:
        return None

    pattern = r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
    m = re.match(pattern, duration)
    if not m:
        return None

    hours = int(m.group(1) or 0)
    minutes = int(m.group(2) or 0)
    seconds = int(m.group(3) or 0)

    return hours * 3600 + minutes * 60 + seconds


def replace_words(text: str, replace_dict: dict) -> str:
    """
    Заменяет слова в тексте по словарю replace_dict.
    
    text: исходный текст
    replace_dict: словарь вида {"старое_слово": "новое_слово", ...}
    
    Возвращает текст с заменами.
    """
    # создаём регулярку, которая ищет любые ключи как отдельные слова
    pattern = r'\b(' + '|'.join(map(re.escape, replace_dict.keys())) + r')\b'
    
    # функция замены
    def repl(match):
        return replace_dict[match.group(0)]
    
    return re.sub(pattern, repl, text, flags=re.IGNORECASE)


def generate_playlist_llm(user_uid: str, channel_uid: str, count: int = 10):
    meta = get_channel_by_id(user_uid, channel_uid)

    if not meta:
        raise ValueError("Unknown channel")

    prompt = f"""
You are a professional music editor.

Create a playlist for the channel "{meta['name']}".
"""
    
    if meta.get("type") == "brand_space":
        prompt += f"""The channel is for a brand space with the following description: "{meta['description']}".
"""

    prompt = f"""
Style: {meta["style"]}

Rules:
- EXACTLY {count} items
- Each item must include artist and title
- No live versions
- Prefer no remixes
- Prefer new fresh tracks
- Prefer tracks with the video clip on Youtube
- Try to make different playlist with different tracks each time
- Avoid duplicate artists
- Use various artists in generated playlist. Add not more 2 tracks from a single artist
- Do not arrange tracks on its popularity

Return ONLY valid JSON. Add infoormation about how well the track matches the channel style in "match" field (0-100). The higher the better.
Format:
{{
  "tracks": [
  {{ "artist": "Artist name", "title": "Song title", "match": "0-100" }}
  ]
}}
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # быстрый и дешёвый для MVP
        messages=[
            {"role": "system", "content": "You generate structured and smooth music playlists."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)["tracks"]
    except json.JSONDecodeError:
        # защита от мусора
        raise RuntimeError(f"LLM returned invalid JSON: {content}")


def generate_playlist_ppx(user_uid: str, channel_uid: str, count: int = 10):
    meta = get_channel_by_id(user_uid, channel_uid)

    if not meta:
        raise ValueError("Unknown channel")
        
    api_key = os.getenv("PERPLEXITY_API_KEY")

    url = "https://api.perplexity.ai/chat/completions"


    prompt = f"""
You are a professional music editor.

Create a playlist for the channel "{meta['name']}".
"""
    
    if meta.get("type") == "brand_space":
        prompt += f"""The channel is for a brand space with the following description: "{meta['description']}".
"""

    prompt = f"""
Style: {meta["style"]}

Rules:
- EXACTLY {count} items
- Each item must include artist and title
- No live versions
- No long DJ sets, DJ mixes, etc
- Prefer no remixes
- Prefer new fresh tracks
- Try to select tracks with duration from 2 to 10 minutes, avoid tracks with duretion more than 10 minutes
- Prefer tracks with the video clip on Youtube
- Try to make different playlist with different tracks each time
- Avoid duplicate artists
- If possible make query music databases, YouTube, Spotify, or music streaming platforms
- If there are few tracks anyway return those tracks
- Use various artists in generated playlist. Add not more 2 tracks from a single artist
- Use different sources
- If track is a part of a big youtube video then use different videos as source. T
ry to do not select tracks from a same set or from a same big youtube video (check it with youtube_id)
- Do not arrange tracks on its popularity
- Add youtube id of the video on youtube if it possible.
- Add youtube link with timestamp if it is a fragment of video
- Add duration if it is a fragment of video
- IMPORTANT! Select only one track with the same youtube_id to the result playlist

Add information about how well the track matches the channel style in "match" field (0-100). The higher the better.

Return ONLY valid JSON. Do not use markdown.
Format:
{{
  "tracks": [
  {{ "artist": "Artist name", "title": "Song title", "match": "0-100", "youtube_id": "xxx", "youtube_url": "xxx", "fragment_duration": "duration" }}
  ]
}}
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": "Return only valid JSON. No markdown."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.8,
    }

    r = requests.post(url, headers=headers, json=payload, timeout=30)
    r.raise_for_status()

    content = r.json()["choices"][0]["message"]["content"].strip()

    # Если модель вернула NONE
    if content.upper() == "NONE":
        raise Exception("No suitable tracks found")

    print(content)
    try:
        data = json.loads(content)["tracks"]
        return data
    except Exception as e:
        print(e)
        try:
            data = json.loads(content.replace("```json", "").replace("```", ""))["tracks"]
            return data
        except Exception as e:
            print(e)
            print(content)
            raise Exception("Perplexity returned invalid JSON")
        raise Exception("Perplexity returned invalid JSON")
    

def generate_dj_text(user_uid: str, channel_uid: str, from_title: str, to_title: str) -> str:
    meta = get_channel_by_id(user_uid, channel_uid)
    channel = meta['name']
    text = generate_text(user_uid, channel_uid, from_title, to_title)
    if from_title:
        if meta["type"] == "brand_space":
                match random.random():
                    case x if x <= 0.3:
                        print("Adding promo")
                        text = add_promo(text, user_uid, channel_uid)
                    case x if x <= 0.6:
                        print("Adding menu")
                        text = add_menu(text, user_uid, channel_uid)
                    case x if x <= 0.7:
                        print("Adding weather")
                        text = add_weather(text, user_uid, channel_uid)
                    # case x if x <= 0.9:
                    #     print("Adding local events")
                    #     text = add_local_events(text, channel)
                    # case x if x <= 1:
                    #     print("Adding local news")
                    #     text = add_local_news(text, channel)
    else:
        print("Adding weather")
        text = add_weather(text, user_uid, channel_uid)

    if len(text) > 500:
        print(text)
        print("Text length before shortening:", len(text))
        text = shortener(text, user_uid, channel_uid, max_symbols=500)
        print("Text length after shortening:", len(text))
    
    if meta["voice"]["source"] == "silero":
        print("Converting text to Russian")
        text = convert_to_russian(text, from_title, to_title)
        print(text)
        print("Converting digits to words")
        text = convert_digits(text)        
        text = convert_abbreviatures(text)        
        text = replace_words(text, REPLACE_DICT)
        text = add_silero_emotions_llm(text)
    
    if meta["voice"]["source"] == "elevenlabs":
        print("Adding emotions")
        text = add_emotions_llm(text)

    # text = add_pauses_llm(text)
        
    print("Text length after all:", len(text))
    return text
    

def generate_text(user_uid: str, channel_uid: str, from_title: str, to_title: str) -> str:
    
    meta = get_channel_by_id(user_uid, channel_uid)

    channel = meta['name']

    prompt = f"""
Ты — радио-диджей брендированного музыкального канала {channel}. 
"""
    
    if meta["type"] == "brand_space":
        prompt += f"""
Ты играешь музыку в заведении {meta["name"]}, вот его описание: {meta["description"]}.
Упоминай в тексте заведение и его атмосферу, а также особенности музыки канала.
"""
    else:
        prompt += f"""
Ты играешь музыку на канале {meta["name"]}, вот его описание: {meta["description"]}.
"""
    prompt += f"""
Сегодня {datetime.now()}. Если будешь в тексте упоминать время дня, то соотноси его с текущим временем. 
"""
    if from_title is None:        
        prompt += f"""
Теперь придумай представление для трека {to_title}, с которого начнется вещание. 
Это единственный трек, который надо будет упомняуть. Это твоя первая реплика в эфире, сделай ее привественной.

"""
    else:
        prompt += f"""
Нужно плавно и в стиле канала ({meta["style"]}) перейти от одного клипа к другому.
Теперь придумай переход от трека {from_title}, который заканчивает играть, к треку {to_title}, который будет играть следующим. 
Расскажи пару слов о треке, который будет играть, какие он эмоции вызовет. 

"""
    
    prompt += f"""
Требования к тексту:
— русский язык
— нельзя использовать слова на английском или других языках, кроме русского
— Имена исполнителей или исполнителя пиши в русской фонетической передаче 
— Не переводи на русский названия треков или трека
— от {'мужского' if meta["voice"]["sex"] == "male" else 'женского'} пола 
— разговорный стиль
— живо, уверенно, как на музыкальном ТВ
— 1–2 предложения
"""
    print(prompt)

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You write short DJ speech for radio."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()


def add_menu(text, user_uid: str, channel_uid: str) -> str:
    
    meta = get_channel_by_id(user_uid, channel_uid)
    channel = meta['name']

    prompt = f"""
Перед тобой текст для радио-диджея, который играет на канале {channel} и делает переход между треками.
Добавь в этот текст информацию об одной позиции в меню заведения {meta["name"]}, которое играет на канале {channel}.
Вот текст, который нужно дополнить: {text}
Вот позиция в меню: {random.choice(meta["menu"])}

Верни дополненный текст, который диджей может сказать в эфире, чтобы прорекламировать заведение и его предложения, 
не нарушая при этом стиль канала и не делая прямой рекламы.
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You write short DJ speech for radio."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()


def add_promo(text, user_uid: str, channel_uid: str) -> str:
    
    meta = get_channel_by_id(user_uid, channel_uid)

    channel = meta['name']

    prompt = f"""
Перед тобой текст для радио-диджея, который играет на канале {channel} и делает переход между треками.
Добавь в этот текст информацию об одной из акций заведения {meta["name"]}, которое играет на канале {channel}.
Вот текст, который нужно дополнить: {text}
Вот акция: {random.choice(meta["actions"])}

Верни дополненный текст, который диджей может сказать в эфире, чтобы прорекламировать заведение и его предложения, 
не нарушая при этом стиль канала и не делая прямой рекламы.
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You write short DJ speech for radio."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()


def add_local_news(text, user_uid: str, channel_uid: str) -> str:
    
    meta = get_channel_by_id(user_uid, channel_uid)

    channel = meta['name']

    news = get_local_news_perplexity(channel)

    print("Local news:", news)
    
    if not news or not news.get("ok"):
        return text
        # facts.append(
        #     f"- Локальная новость: {news['title']}. Коротко: {news['summary']}. Источник: {news['source_url']}."
        # )

    one_news = random.choice(news.get("news", []))

    prompt = f"""
Перед тобой текст для радио-диджея, который играет на канале {channel} и делает переход между треками.
Добавь в этот текст информацию о локальных новостях города {meta["location"]}.
Используй только эту новость: {one_news.get("summary")} (Источник: {one_news.get("source_url")})
Вот текст, который нужно дополнить: {text}

Верни дополненный текст, который диджей может сказать в эфире, чтобы сделать его более живым и актуальным для слушателей,
не нарушая при этом стиль канала.
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You write short DJ speech for radio."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()


def add_local_events(text, user_uid: str, channel_uid: str) -> str:
    
    meta = get_channel_by_id(user_uid, channel_uid)

    channel = meta['name']

    events = get_local_events_perplexity(channel)

    print("Local events:", events)
    
    if not events or not events.get("ok"):
        return text
        # facts.append(
        #     f"- Локальная новость: {news['title']}. Коротко: {news['summary']}. Источник: {news['source_url']}."
        # )

    event = random.choice(events.get("events", []))

    prompt = f"""
Перед тобой текст для радио-диджея, который играет на канале {channel} и делает переход между треками.
Добавь в этот текст информацию о локальных событиях города {meta["location"]}.
Используй только это событие: {event.get("summary")} (Дата: {event.get("date")}, Источник: {event.get("source_url")})
Вот текст, который нужно дополнить: {text}

Верни дополненный текст, который диджей может сказать в эфире, чтобы сделать его более живым и актуальным для слушателей,
не нарушая при этом стиль канала.
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You write short DJ speech for radio."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()


def add_weather(text, user_uid: str, channel_uid: str) -> str:
    
    meta = get_channel_by_id(user_uid, channel_uid)

    channel = meta['name']

    weather_info = get_weather(meta["location"])

    if weather_info['ok']:

        print("Weather info:", weather_info)

        prompt = f"""
    Перед тобой текст для радио-диджея, который играет на канале {channel} и делает переход между треками.
    Добавь в этот текст информацию о погоде в {meta["location"]}. 
    Используй только эту информацию о погоде: {weather_info}
    Округляй температуру до целых чисел, а описание погоды делай максимально коротким (одно-два слова).
    Вот текст, который нужно дополнить: {text}

    Верни дополненный текст, который диджей может сказать в эфире, чтобы сделать его более живым и актуальным для слушателей,
    не нарушая при этом стиль канала.
    """

        response = llm_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You write short DJ speech for radio."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
        )

        return response.choices[0].message.content.strip()
    return text


def shortener(text, user_uid: str, channel_uid: str, max_symbols: int) -> str:
    
    meta = get_channel_by_id(user_uid, channel_uid)

    channel = meta['name']

    prompt = f"""
Перед тобой текст для радио-диджея, который играет на канале {channel} и делает переход между треками.
Сократи этот текст, чтобы он был длиной меньше {max_symbols} символов. Ты можешь перевращировать предложения, опуская ненужные слова. 
В крайнем случае можешь выкинуть ненужные предложения.
Вот текст, который нужно сократить: {text}

Верни сокращенный текст, который диджей может сказать в эфире,
не нарушая при этом стиль канала.
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You write short DJ speech for radio."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()
    
IPA_TO_RU = {
    # СОГЛАСНЫЕ
    "p": "п", "b": "б", "t": "т", "d": "д", "k": "к", "g": "г",
    "f": "ф", "v": "в", "θ": "с", "ð": "з", "s": "с", "z": "з",
    "ʃ": "ш", "ʒ": "ж", "tʃ": "ч", "dʒ": "дж",
    "m": "м", "n": "н", "ŋ": "нг", "l": "л", "r": "р", "ɹ": "р",
    "j": "й", "w": "у", "h": "х",

    # ГЛАСНЫЕ
    "i": "и", "ɪ": "и", "e": "е", "ɛ": "е", "æ": "э",
    "ʌ": "а", "ɑ": "а", "ɔ": "о", "o": "о", "oʊ": "оу",
    "u": "у", "ʊ": "у", "ə": "э", "ɜ": "ё", "ɒ": "о", "ɶ": "ё",

    # ДИФТОНГИ
    "aɪ": "ай", "aʊ": "ау", "ɔɪ": "ой", "eɪ": "эй", "oɪ": "ой",
    "ju": "ю", "ɪə": "ие", "eə": "еа", "ʊə": "уа",

    # СЛОЖНЫЕ СОГЛАСНЫЕ / ПОЛУСОГЛАСНЫЕ
    "tr": "тр", "dr": "др", "ts": "ц", "dz": "дз",

    # УДАРЕНИЯ И МЕТКИ
    "ˈ": "", "ˌ": "", "ː": "", "̆": "",

    # ПРОЧИЕ ФОНЕМЫ И РЕДУКЦИИ
    "ɾ": "р", "ɫ": "л", "ʰ": "", "ʼ": "", "ʲ": "", "̩": "",

    # АСПИРАЦИЯ, носовые и прочие
    "n̩": "н", "m̩": "м", "l̩": "л",

    # Новые
    "ю": "ю", "ö": "ё", "ё": "ё", "ɡ": "г", "ɐ": "э", "ɚ": "э", "ᵻ": "и", "ö": "ё"
}

# Функция конвертации IPA → русский текст
def ipa_to_ru(ipa_text):
    text = ipa_text
    # сортируем по длине ключей, чтобы сначала более длинные соответствия (tʃ перед t и т.д.)
    for ipa, ru in sorted(IPA_TO_RU.items(), key=lambda x: -len(x[0])):
        text = text.replace(ipa, ru)
    # удаляем лишние символы
    text = re.sub(r"[ˈˌ]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def convert_latin_to_cyrillic(text):
    ipa = phonemize(text, language="en-us")
    cyrillic = ipa_to_ru(ipa)
    return cyrillic

def convert_to_russian(text: str, from_title: str, to_title: str) -> str:
    prompt = f"""
Преобразуй любые названия, в том числе треков и каналов:
"""
    if from_title is None:        
        prompt += f"""
перепиши {to_title} по русски.

"""
    else:
        prompt += f"""
перепиши {from_title} и {to_title} по русски.

"""
        
    prompt += f"""
Не делай прямой перевод, а пиши так, как названия песен произносят на русском радио и ТВ.

имена исполнителей и названия песен запиши КИРИЛЛИЦЕЙ. 

Очень важно! Не делай перевод названий песен, а только фонетическую конвертацию названия на кириллице так, как его должен прочитать русскоговорящий человек, если бы он читал английское название. 
Если не можешь сделать такую конвертацию, лучше оставь англоязычное написание песни. 

В итоговом тексте замени все имена и названия и используй ТОЛЬКО кириллические версии, латиница запрещена.

Верни оригинальный текст, но с русскими названиями. Вот текст:
{text}
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You convert foreign names and titles to Russian equivalents."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
    )

    converted_text = response.choices[0].message.content.strip()

    # Регулярка для поиска фраз на латинице
    latin_phrases = re.findall(r'[A-Za-z][A-Za-z]*(?: [A-Za-z][A-Za-z]*)*', text)
    for phrase in latin_phrases:
        converted_text = converted_text.replace(phrase, convert_latin_to_cyrillic(phrase))

    return converted_text
    

def convert_digits(text: str) -> str:
    prompt = f"""
Преобразуй любые цифры и числа в тексте в из буквенной написание, 
например 1 - один, 10 - десять, 80s -> восемьдесятые, 90s -> девяностые, 2020 -> две тысячи двадцатый и т.д.

Обязательно заменяй числа так, чтобы они были согласованы в предложении по правилам русккого языка.

Верни оригинальный текст, но с русскими названиями. Вот текст:
{text}
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You convert numbers in text to their Russian word equivalents."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()
    

def convert_abbreviatures(text: str) -> str:
    prompt = f"""
Ты — редактор текста для синтеза речи.

Твоя задача: подготовить текст для озвучки на русском языке.

Правила:
1. Найди все аббревиатуры (латиница, кириллица, сокращения из заглавных букв).
2. Не расшифровывай их по смыслу.
3. Вместо аббревиатуры запиши отдельные слова с фонетическим произношением букв на русском.
4. Каждая буква должна быть отдельным словом.
5. Используй естественное разговорное звучание.
6. Не добавляй комментарии. Верни только готовый текст.

Примеры:
NASA → эн эй эс эй
GPT → джи пи ти
ТВ → тэ вэ
MTV → эм ти ви
USA → ю эс эй
AI → эй ай
BTC → би ти си
ООН → о о эн

Текст:

{text}
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Ты — редактор текста для синтеза речи."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()
    

def check_title_llm(searching_title: str, found_title: str) -> dict:
    prompt = f"""
Ты сравниваешь два названия треков и определяешь, один и тот же ли это трек.

Вход:
A = "{searching_title}"
B = "{found_title}"

Правила:
- Игнорируй HTML entities (&amp; -> &)
- Игнорируй мусорные префиксы релиза типа "EP", "Radio Edit", "Original Mix"
- Если артист тот же и название трека совпадает — это MATCH, даже если в B добавлены feat / ремикс / дополнительные артисты
- Если артист в B совпадает с артистом в A, а название трека в B содержит название из A — это может быть MATCH
- Если артист в B совпадает с артистом в A, а название трека в B содержит часть названия из A — это может быть MATCH
- в score ставь число от 0 до 100, которое отражает степень совпадения. 100 — идеально совпало, 0 — совершенно разные треки.

Верни строго JSON:
{{
  "match": true/false,
  "score": 0-100,
  "normalized_a": "...",
  "normalized_b": "...",
  "reason": "коротко"
}}
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a track title matcher."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)

    print("Title match result:", result)

    return result['match']
    

def add_emotions_llm(text: str) -> dict:
    prompt = f"""
Ты — редактор текста для озвучки в ElevenLabs (модель eleven_v3).

Дополни текст который тебе передали так, чтобы он звучал максимально естественно и “по-человечески”.

Правила:

Добавляй короткие эмоциональные подсказки, которые уместны в тексте в квадратных скобках на английском.
Эти подсказки не должны быть длинными.
Добавляй это перед кусочком текста, который надо озвучить с такой эмоцией.
Максимум 4-5 штук на весь текст.

Добавляй голосовые звуки вроде смешков, ухмылок, покашливаний, заминок, запинок, заиканий и других звуков, 
которые человек издает голосом, в квадратных скобках на английском. 
Добавляй эти ухмылки в середину текста и даже предложений.
Максимум 2-3 штуки на весь текст.

Добавляй паузы в виде троеточий в середине предложений - это уже без квадратных строк, прямо в текст.
Максимум 2-3 штуки на весь текст.

Вот твой текст: {text}

Верни дополненный текст, который звучит максимально естественно и по-человечески, с добавленными эмоциями и звуками, 
который можно отправлять в озвучку в ElevenLabs.
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Ты — редактор текста для озвучки в ElevenLabs (модель eleven_v3)."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
    )

    return response.choices[0].message.content.strip()
    

def add_silero_emotions_llm(text: str) -> dict:
    prompt = f"""
Ты — редактор текста для озвучки в Silero.

Дополни текст который тебе передали так SSML тегами, чтобы он звучал максимально естественно и “по-человечески”.

Используй только эти теги:
---
<prosody rate="slow"/>

Example: Когда я просыпаюсь, <prosody rate="slow">я говорю довольно медленно</prosody>

Правила:

Выделяй названия треков и артистов (или трека и артиста, если он встречается в тексте однажды) тегом так, 
чтобы озвучка silero четче и медленнее проговаривала их. 

Выделяй только те названия и имена, которые имеют иностранное происхождение, для имен и названий на русском ничего не делай. 

Выделяй только названия треков и имена исполнтелей. Названия каналов, простанств, брендов не трогай. 
Не добавляй от себя ничего в текст, в том числе названия треков или артистов, которых нет в тексте. 
В тексте может быть один или два исполнителя и один или два трека.

Дополнительно замени или убери спецсимволы xml, которые могут словать xml-разметку

Вот твой текст: {text}

Верни дополненный текст, который звучит максимально естественно и по-человечески, с добавленными эмоциями, 
который можно отправлять в озвучку в Silero.
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Дополни текст который тебе передали так SSML тегами для озвучки в Silero."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
    )

    return response.choices[0].message.content.strip()
    

def add_pauses_llm(text: str) -> dict:
    prompt = f"""
Ты — редактор текста для озвучки. Добавь паузы в виде троеточий в середине предложений - прямо в текст, посередине предложений.
Добавь 2-3 штуки на весь текст.

Вот твой текст: {text}

Верни дополненный текст.
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Ты — редактор текста для озвучки."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
    )

    return response.choices[0].message.content.strip()



######################


def get_weather(city: str) -> dict:
    """
    Возвращает текущую погоду по городу через Open-Meteo.
    Без API ключей. Достаточно точная для DJ-вставки.
    """

    # 1) Geocoding
    geo_url = "https://geocoding-api.open-meteo.com/v1/search"
    geo_params = {"name": city, "count": 1, "language": "ru", "format": "json"}
    geo = requests.get(geo_url, params=geo_params, timeout=10).json()

    if not geo.get("results"):
        return {"ok": False, "error": f"City not found: {city}"}

    place = geo["results"][0]
    lat, lon = place["latitude"], place["longitude"]

    # 2) Weather
    weather_url = "https://api.open-meteo.com/v1/forecast"
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,apparent_temperature,precipitation,wind_speed_10m",
        "timezone": "auto"
    }
    w = requests.get(weather_url, params=weather_params, timeout=10).json()

    current = w.get("current", {})
    if not current:
        return {"ok": False, "error": "No current weather in response"}

    return {
        "ok": True,
        "city": place.get("name", city),
        "country": place.get("country", ""),
        "temperature_c": current.get("temperature_2m"),
        "feels_like_c": current.get("apparent_temperature"),
        "wind_m_s": current.get("wind_speed_10m"),
        "precip_mm": current.get("precipitation"),
        "time": current.get("time"),
    }


def get_local_news_perplexity(
    user_uid: str, channel_uid: str, news_count: int = 5
) -> dict:
    meta = get_channel_by_id(user_uid, channel_uid)
    if not meta:
        return {"ok": False, "error": f"Channel not found: {channel}"}
    channel = meta['name']
    location = meta.get("location")
    channel_style = meta.get("style")
    channel_description = meta.get("description")
    api_key = os.getenv("PERPLEXITY_API_KEY")

    """
    Возвращает news_count реальную локальную новость за последние 24 часа
    (обязательно со ссылкой), релевантную стилю канала.

    Важно: Perplexity должен вернуть источник (URL).
    """

    url = "https://api.perplexity.ai/chat/completions"

    prompt = f"""
Ты — новостной ресёрчер.
Найди {news_count} реальных новостей за последние 24 часа, связанных с этим местом: {location}.

В приоритете новости, интересные для аудитории этого места: {channel_description}. 
Если таких новостей нет, можно использовать другие новости этого города, не связанные напрямую с описанием, 
но всё равно релевантные для местной аудитории.

Требования:
- новость должна быть реальной и проверяемой
- обязательно верни 1 ссылку на первоисточник (URL)
- новость должна быть короткой и понятной
- новость не должна быть криминальной, плохой, связанной с негативом, конфликтами, политикой и т.п. — нам нужна позитивная или нейтральная новость для озвучки в эфире
- если за 24 часа ничего подходящего нет — верни "NONE"

Формат ответа строго JSON:
{{
    "ok": true/false,
    "news": [
        {{
            "title": "...",
            "summary": "...",
            "source_url": "...",
            "published_hint": "today/yesterday/час назад"
        }}
    ]
}}
- верни ТОЛЬКО чистый JSON
- без markdown
- без тройных кавычек
- без пояснений
- без текста до и после JSON
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": "Return only valid JSON. No markdown."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }

    r = requests.post(url, headers=headers, json=payload, timeout=30)
    r.raise_for_status()

    content = r.json()["choices"][0]["message"]["content"].strip()

    # Если модель вернула NONE
    if content.upper() == "NONE":
        return {"ok": False, "error": "No suitable news found"}

    try:
        data = json.loads(content)
        return data
    except Exception:
        return {"ok": False, "error": "Perplexity returned invalid JSON", "raw": content}



def get_local_events_perplexity(
    user_uid: str, channel_uid: str, events_count: int = 5
) -> dict:
    meta = get_channel_by_id(user_uid, channel_uid)
    if not meta:
        return {"ok": False, "error": f"Channel not found: {channel_uid}"}
    location = meta.get("location")
    channel_style = meta.get("style")
    channel_description = meta.get("description")
    api_key = os.getenv("PERPLEXITY_API_KEY")

    """
    Возвращает 1 реальное локальное событие на ближайшие 3 дня
    (обязательно со ссылкой), релевантную стилю канала.

    Важно: Perplexity должен вернуть источник (URL).
    """

    url = "https://api.perplexity.ai/chat/completions"

    prompt = f"""Ты — локальный афиша-ресёрчер.
Найди {events_count} реальных событий, которые пройдут в ближайшие 3 дня, связанных с этим местом: {location}.

В приоритете события, интересные для аудитории этого места: {channel_description} . 
Если таких событий нет, можно использовать другие мероприятия этого города, не связанные напрямую с описанием, 
но всё равно релевантные для местной аудитории.

Требования:
- событие должно быть реальным и проверяемым
- оно должно проходить в ближайшие 3 дня (включая сегодня)
- обязательно верни 1 ссылку на первоисточник (страница события / афиша / официальный сайт)
- событие должно быть коротким и понятным для озвучки в эфире
- если подходящих событий нет — верни "NONE"
- не выдумывай ничего: если не уверен — лучше верни "NONE"

Формат ответа строго JSON:
{{
    "ok": true/false,
    "events": [
        {{
            "ok": true/false,
            "title": "...",
            "summary": "...",
            "date": "YYYY-MM-DD or today/tomorrow",
            "place_name": "...",
            "source_url": "...",
            "confidence": "high/medium/low"
        }}
    ]
}}
- верни ТОЛЬКО чистый JSON
- без markdown
- без тройных кавычек
- без пояснений
- без текста до и после JSON
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": "Return only valid JSON. No markdown."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }

    r = requests.post(url, headers=headers, json=payload, timeout=30)
    r.raise_for_status()

    content = r.json()["choices"][0]["message"]["content"].strip()

    # Если модель вернула NONE
    if content.upper() == "NONE":
        return {"ok": False, "error": "No suitable news found"}

    try:
        data = json.loads(content)
        return data
    except Exception:
        return {"ok": False, "error": "Perplexity returned invalid JSON", "raw": content}



def rms(audio_int16):
    x = audio_int16.astype(np.float32)
    return float(np.sqrt(np.mean(x * x)))

def has_speech(audio_int16, sample_rate, threshold=0.5):
    x = audio_int16.astype(np.float32) / 32768.0

    # silero лучше всего работает на 16000
    if sample_rate != 16000:
        x_t = torch.from_numpy(x).unsqueeze(0)
        x_t = torchaudio.functional.resample(x_t, sample_rate, 16000)
        x = x_t.squeeze(0).numpy()
        sample_rate = 16000

    speech_timestamps = get_speech_timestamps(
        torch.from_numpy(x),
        silero_vad_model,
        sampling_rate=sample_rate,
        threshold=threshold
    )
    return len(speech_timestamps) > 0


def find_tracks(artist: str, title: str, limit: int = 3):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

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

    
def get_channel_by_id(user_uid: str, channel_id: str):
    conn = sqlite3.connect(USERS_DB_PATH)
    conn.row_factory = sqlite3.Row
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
    }