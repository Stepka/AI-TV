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

import requests
from dotenv import load_dotenv
import os
import json
from scipy.io.wavfile import write
from openai import OpenAI

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

llm_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

elevenlabs_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

silero_model, _ = silero_tts(language='ru',
                                 speaker='v5_1_ru')


# Предопределенные каналы
CHANNELS = {
    
    "MTV": {
        "type": "music_tv",
        "style": "modern popular music 2010-2024",
        "description": "global chart hits, pop, hip hop, dance",
        "voice": {
            "source": "silero", 
            "name": "xenia",
            "sex": "female"
        }
    },
    
    "Retro": {
        "type": "music_tv",
        "style": "classic hits 1980-1989",
        "description": "80s pop, disco, synth, rock",
        "voice": {
            "source": "silero", 
            "name": "xenia",
            "sex": "female"
        }
    },
    
    "Retro Synth": {
        "type": "music_tv",
        "style": "classic synth hits 1980-1989",
        "description": "80s synth, soviet synth",
        "voice": {
            "source": "silero", 
            "name": "xenia",
            "sex": "female"
        }
    },
    
    "A One": {
        "type": "music_tv",
        "style": "rock and alternative 1995-2010",
        "description": "alternative rock, grunge, indie",
        "voice": {
            "source": "silero", 
            "name": "xenia",
            "sex": "female"
        }
    },
    
    "Другое Место": {
        "type": "brand_space",
        # "style": 
        #     "chill electronic and oriental lounge, "
        #     "deep house, organic house, downtempo, "
        #     "oriental chill, hookah lounge vibes",
        "style":
            "organic house, melodic house, "
            "downtempo, chill progressive, "
            "soft oriental fusion, ",
        # "style":
        #     "luxury lounge, "
        #     "organic house, melodic house, "
        #     "downtempo, chill progressive, "
        #     "soft oriental fusion, "
        #     "sunset rooftop vibes, hookah lounge mood",
        # "style":
        #     "modern chill, "
        #     "lo-fi house, deep house, "
        #     "slow techno, minimal grooves, "
        #     "late night city vibes, "
        #     "smooth electronic background, "
        #     "hookah lounge energy",

        "name": "Лаунж кафе Другое Место на артиллерийской",
        "description": "Лаунж кафе Другое Место на артиллерийской, кальяны, чай",
        # "voice": {
        #     "source": "elevenlabs", 
        #     # "name": "PB6BdkFkZLbI39GHdnbQ", # eleven_multilingual_v2 sexy expensive 
        #     "name": "jGhxZDfdcvgMh6tm2PBj", # drugaya_natasha         
        #     # "name": "2zRM7PkgwBPiau2jvVXc", # бодро
        #     "sex": "female"
        # },
        "voice": {
            "source": "silero", 
            "name": "xenia",
            "sex": "female"
        },
        "action": [
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
    },
    
    "Пеперончино": {
        "type": "brand_space",
        "style": 
            "family-friendly pop and soft rock, "
            "italian classics, acoustic hits, "
            "easy listening, light funk, "
            "feel-good background music",
        "name": "Пеперончино",
        "description": "ПЕПЕРОНЧИНО🌶️ | Пиццерия Калининград",
        "voice": {
            "source": "silero", 
            "name": "xenia",
            "sex": "female"
        },
        "action": [
            "Покажите ваш билет на концерт (в день мероприятия) и получите две фирменные настойки на выбор в подарок!",
            "Бокал игристого каждому гостю при заказе завтрака с 11:00 до 14:00",
        ],
        "location": "Калининград",
        "menu": [
            "Неполитанская пицца Пьемонт 550 рублей (было 695)",
            "Неполитанская пицца Цезарио 550 рублей (было 695)",
            "Куриный суп с домашней лапшой 315 рублей (было 395)",
            "NEW Салат с креветками 655 рублей",
            "Чизкейк Сан-Себастьян 315 рублей (было 395)",
        ]
    },
    
    "X-Fit": {
        "type": "brand_space",
        "style":
            "energetic workout pop, "
            "motivational EDM, "
            "commercial house, "
            "clean hip-hop, "
            "uplifting dance hits, "
            "gym-friendly bangers",
        "name": "X-Fit",
        "description": "X-Fit | Фитнес-клуб и тренажёрный зал",
        "voice": {
            "source": "elevenlabs", 
            "name": "random_female",
            "sex": "female"
        },
        "action": [
            "Гостевой визит на 1 день бесплатно при записи через администратора",
            "Скидка 20% на персональные тренировки при покупке пакета 10 занятий",
            "Акция: приведи друга — получите по семь дней продления абонемента",
        ],
        "location": "Калининград",
        "menu": [
            "Абонемент 1 месяц — от 4 990 ₽",
            "Абонемент 3 месяца — от 12 990 ₽",
            "Персональная тренировка — от 1 500 ₽",
            "Пакет 10 персональных тренировок — от 12 900 ₽",
            "Фитнес-тестирование + консультация тренера — 990 ₽",
        ],
    },

    "Эдкар": {
        "type": "brand_space",
        "style":
            "calm modern lounge, "
            "soft chill electronic, "
            "warm acoustic pop, "
            "smooth jazz, "
            "relaxing background music, "
            "minimal piano and ambient",
        "name": "Эдкар",
        "description": "Эдкар | Семейная медицина и стоматология",
        "voice": {
            "source": "silero", 
            "name": "xenia",
            "sex": "female"
        },
        "action": [
            "Профилактический осмотр стоматолога — бесплатно при первом визите",
            "Комплекс: профгигиена + консультация — по специальной цене",
            "Семейная программа: скидка 10% при записи 2+ членов семьи",
        ],
        "location": "Калининград",
        "menu": [
            "Консультация стоматолога — от 800 ₽",
            "Профессиональная гигиена полости рта — от 3 500 ₽",
            "Лечение кариеса — от 4 200 ₽",
            "УЗИ (по направлению) — от 1 200 ₽",
            "Приём терапевта — от 1 600 ₽",
        ],
    },

    "Exeed": {
        "type": "brand_space",
        "style":
            "premium modern pop, "
            "cinematic electronic, "
            "future bass, "
            "clean trap beats, "
            "high-end lounge, "
            "confident driving vibes",
        "name": "EXEED",
        "description": "EXEED | Автомобильный дилерский центр",
        "voice": {
            "source": "silero", 
            "name": "xenia",
            "sex": "female"
        },
        "action": [
            "Тест-драйв в удобное время + фирменный подарок при записи онлайн",
            "Trade-in: дополнительная выгода до 150 000 ₽ при сдаче авто",
            "Кредитная программа: сниженная ставка при первом взносе от 30%",
        ],
        "location": "Калининград",
        "menu": [
            "EXEED LX — от 2 800 000 ₽",
            "EXEED TXL — от 3 600 000 ₽",
            "EXEED RX — от 4 500 000 ₽",
            "КАСКО + ОСАГО в дилерском центре — индивидуальный расчёт",
            "Сервисное ТО — от 12 000 ₽",
        ],
    },

    "О, Pretty People": {
        "type": "brand_space",
        "style":
            "trendy beauty lounge pop, "
            "soft r&b, "
            "modern chill, "
            "minimal deep house, "
            "clean tik-tok hits, "
            "warm aesthetic vibes",
        "name": "О, Pretty People",
        "description": "О, Pretty People | Салон красоты",
        "voice": {
            "source": "silero", 
            "name": "xenia",
            "sex": "female"
        },
        "action": [
            "Скидка 15% на первое посещение при записи онлайн",
            "Маникюр + покрытие — по спеццене в будние дни до 15:00",
            "Приведи подругу — получите по 10% скидки на следующую услугу",
        ],
        "location": "Калининград",
        "menu": [
            "Маникюр + покрытие гель-лак — от 2 200 ₽",
            "Педикюр + покрытие — от 3 200 ₽",
            "Стрижка женская — от 1 800 ₽",
            "Окрашивание (тон/сложное) — от 4 500 ₽",
            "Ламинирование ресниц — от 2 400 ₽",
        ],
    },

    "OldBoy": {
        "type": "brand_space",
        "style":
            "confident hip-hop, "
            "old school rap, "
            "modern trap, "
            "funky beats, "
            "barbershop swagger, "
            "clean rock classics, "
            "masculine lounge vibes",
        "name": "OldBoy",
        "description": "OldBoy | Барбершоп",
        "voice": {
            "source": "elevenlabs", 
            "name": "random_male",
            "sex": "male"
        },
        "action": [
            "Скидка 10% на первое посещение при записи через администратора",
            "Отец + сын: специальная цена на комплекс стрижек",
            "Стрижка + борода: выгодный комбо-тариф в будние дни",
        ],
        "location": "Калининград",
        "menu": [
            "Мужская стрижка — от 1 600 ₽",
            "Стрижка машинкой — от 900 ₽",
            "Оформление бороды — от 1 100 ₽",
            "Комплекс: стрижка + борода — от 2 500 ₽",
            "Детская стрижка — от 1 200 ₽",
        ],
    },

}

REPLACE_DICT = {
    "трек": "трэк",
    "треком": "трэком",
    "треки": "трэки",
    "трека": "трэка",
    "треку": "трэку",
}

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") 


class PlaylistRequest(BaseModel):
    channel: str
    max_results: int = 10

    
class DJRequest(BaseModel):
    channel: str
    from_title: str
    to_title: str


class LoginRequest(BaseModel):
    username: str
    password: str


### Аутентификация и авторизация (JWT) для админки и будущих персональных кабинетов пользователей

@app.post("/auth/login")
def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        return {"ok": False, "error": "wrong login or password"}

    token = create_access_token({"sub": user["username"]})
    return {"ok": True, "access_token": token, "token_type": "bearer"}


@app.get("/me")
def me(user=Depends(get_current_user)):
    return {"ok": True, "user": user}


### Основные эндпоинты для получения плейлиста, генерации текста и аудио для DJ переходов, а также получения видео по ID

@app.post("/playlist")
def get_playlist(req: PlaylistRequest):
    cache = YouTubeCache()  # при первом запуске база создастся автоматически

    tracks = generate_playlist_llm(req.channel, req.max_results*4)
    print("Generated tracks:", tracks)
    
    indexed = [(i, t) for i, t in enumerate(tracks)]
    top_n = sorted(indexed, key=lambda x: float(x[1]["match"]), reverse=True)[:req.max_results]
    tracks = [t for i, t in sorted(top_n, key=lambda x: x[0])]

    # tracks = random.sample(tracks, min(req.max_results, len(tracks)))
    print("Selected tracks:", tracks)
    # return tracks

    videos = []
    for track in tracks:
        video_id = cache.get_video(track['artist'], track['title'])
        if not video_id:
            # поиск через YouTube API
            print("Searching YouTube for:", track)

            query = f"{track['artist']} {track['title']} official music video"
            yt_video = search_youtube_video(query)
            # print("YouTube search result:", yt_video)

            if yt_video:
                video_duration = get_video_duration(yt_video["videoId"])
                if not video_duration or video_duration < 60 or video_duration > 15*60:  # фильтр по длительности (не больше 15 минут)
                    continue
                matched = check_title_llm(track['artist'] + " - " + track['title'], yt_video['title'])
                if matched:
                    video_id = yt_video["videoId"]
                    cache.save_video(track['artist'], track['title'], video_id)
            
        if video_id:
            videos.append({
                "artist": track['artist'],
                "title": track['title'],
                "videoId": video_id
            })
    return {
        "playlist": videos,
        "source": "llm+youtube"
    }



@app.get("/")
def get_home():
    return "It's AI-TV, baby!"


@app.get("/audio")
def get_audio(filename: str, user=Depends(get_current_user)):
    print("Serving audio file:", filename)
    return FileResponse(f"wav_folder/{filename}", media_type="audio/wav", filename=filename)


@app.post("/dj_transition")
def dj_transition(req: DJRequest, user=Depends(get_current_user)):
    sample_rate = 48000

    text = generate_dj_text(
        channel=req.channel,
        from_title=req.from_title,
        to_title=req.to_title,
    )

    print("Generated text:", text)
    
    meta = CHANNELS.get(req.channel)

    duration_seconds = 30

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
            # Количество сэмплов
            num_samples = audio_numpy.shape[0]
            # Длительность в секундах
            duration_seconds = num_samples / sample_rate
            print(f"Generated {duration_seconds:.2f} sec audio with silero")
    
    raw = f"{req.channel}|{req.from_title}|{req.to_title}"
    h = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]  # короткий хэш

    filename = f"dj_{h}.wav"
    write(f"wav_folder/{filename}", sample_rate, audio)

    return {
        "text": text,
        "audio_filename": filename,
        "duration": duration_seconds,
        "format": "wav"
    }


@app.get("/video")
def get_video(channel: str = Query(...), filename: str = Query(...)):
    print("Serving video file:", channel, filename)
    return FileResponse(
        f"channels_data/{channel}/videos/{filename}",
        media_type="video/mp4",
        filename=filename
    )


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


def generate_playlist_llm(channel: str, count: int = 10):
    meta = CHANNELS.get(channel)
    if not meta:
        raise ValueError("Unknown channel")

    prompt = f"""
You are a professional music editor.

Create a playlist for the radio channel "{channel}".
"""
    
    if meta.get("type") == "brand_space":
        prompt += f"""The channel is for a brand space with the following description: "{meta['description']}".
"""

    prompt = f"""
Style: {meta["style"]}

Rules:
- EXACTLY {count} items
- Each item must include artist and title
- No remixes, no live versions
- Avoid duplicate artists

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
    

def generate_dj_text(channel: str, from_title: str, to_title: str) -> str:
    meta = CHANNELS.get(channel)
    text = generate_text(channel, from_title, to_title)
    if meta["type"] == "brand_space":
        match random.random():
            case x if x <= 0.3:
                print("Adding promo")
                text = add_promo(text, channel)
            case x if x <= 0.6:
                print("Adding menu")
                text = add_menu(text, channel)
            case x if x <= 0.7:
                print("Adding weather")
                text = add_weather(text, channel)
            # case x if x <= 0.9:
            #     print("Adding local events")
            #     text = add_local_events(text, channel)
            # case x if x <= 1:
            #     print("Adding local news")
            #     text = add_local_news(text, channel)

    if len(text) > 500:
        print(text)
        print("Text length before shortening:", len(text))
        text = shortener(text, channel, max_symbols=500)
        print("Text length after shortening:", len(text))
    
    if meta["voice"]["source"] == "silero":
        print("Converting text to Russian")
        text = convert_to_russian(text, from_title, to_title)
        print("Converting digits to words")
        text = convert_digits(text)        
        text = replace_words(text, REPLACE_DICT)
    
    if meta["voice"]["source"] == "elevenlabs":
        print("Adding emotions")
        text = add_emotions_llm(text)
        
    print("Text length after all:", len(text))
    return text
    

def generate_text(channel: str, from_title: str, to_title: str) -> str:
    
    meta = CHANNELS.get(channel)

    

    prompt = f"""
Ты — радио-диджей брендированного музыкального канала {channel}. 
"""
    
    if meta["type"] == "brand_space":
        prompt += f"""
Ты играешь музыку в заведении {meta["name"]}, вот его описание: {meta["description"]}.
"""
    prompt += f"""
Сегодня {datetime.now()}.
Нужно плавно и в стиле канала ({meta["style"]}) перейти от одного клипа к другому.
Упоминай в тексте заведение и его атмосферу, а также особенности музыки канала.

Теперь придумай переход от трека {from_title} к треку {to_title}

Требования к тексту:
— русский язык
— нельзя использовать слова на английском или других языках, кроме русского
— Имена исполнителей пиши в русской передаче 
— Не переводи на русский названия треков
— от {'мужского' if meta["voice"]["sex"] == "male" else 'женского'} пола 
— разговорный стиль
— живо, уверенно, как на музыкальном ТВ
— 1–2 предложения
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


def add_menu(text, channel: str) -> str:
    
    meta = CHANNELS.get(channel)

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


def add_promo(text, channel: str) -> str:
    
    meta = CHANNELS.get(channel)

    prompt = f"""
Перед тобой текст для радио-диджея, который играет на канале {channel} и делает переход между треками.
Добавь в этот текст информацию об одной из акций заведения {meta["name"]}, которое играет на канале {channel}.
Вот текст, который нужно дополнить: {text}
Вот акция: {random.choice(meta["action"])}

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


def add_local_news(text, channel: str) -> str:
    
    meta = CHANNELS.get(channel)

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


def add_local_events(text, channel: str) -> str:
    
    meta = CHANNELS.get(channel)

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


def add_weather(text, channel: str) -> str:
    
    meta = CHANNELS.get(channel)

    weather_info = get_weather(meta["location"])

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


def shortener(text, channel: str, max_symbols: int) -> str:
    
    meta = CHANNELS.get(channel)

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
    "ю": "ю", "ö": "ё", "ё": "ё", "ɡ": "г", "ɐ": "э"
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
#     prompt = f"""
# Преобразуй любые названия, в том числе треков и каналов:

# перепиши {from_title} и {to_title} по русски

# Не делай прямой перевод, а пиши так, как названия песен произносят на русском радио и ТВ.

# имена исполнителей и названия песен запиши КИРИЛЛИЦЕЙ

# В итоговом тексте замени все имена и названия и используй ТОЛЬКО кириллические версии, латиница запрещена.

# Верни оригинальный текст, но с русскими названиями. Вот текст:
# {text}
# """

#     response = llm_client.chat.completions.create(
#         model="gpt-4o-mini",
#         messages=[
#             {"role": "system", "content": "You convert foreign names and titles to Russian equivalents."},
#             {"role": "user", "content": prompt},
#         ],
#         temperature=0.8,
#     )

#     return response.choices[0].message.content.strip()


    converted_text = text
    # Регулярка для поиска фраз на латинице
    latin_phrases = re.findall(r'[A-Za-z][A-Za-z]*(?: [A-Za-z][A-Za-z]*)*', text)
    for phrase in latin_phrases:
        converted_text = converted_text.replace(phrase, convert_latin_to_cyrillic(phrase))

    return converted_text
    

def convert_digits(text: str) -> str:
    prompt = f"""
Преобразуй любые цифры и числа в тексте в из буквенной написание, 
например 1 - один, 10 - десять, 80s -> восемьдесятые, 90s -> девяностые, 2020 -> две тысячи двадцатый и т.д.:

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
Максимум 4-5 штук на весь текст.

Добавляй голосовые звуки вроде смешков, ухмылок, покашливаний и других звуков, которые человек издает голосом, в квадратных скобках на английском.
Максимум 2-3 штуки на весь текст.

Добавляй несловесные речевые звуки и междометия на русском (“мм…”, “эм…”, “ах…”, “хех…”, “ну…”, “м-м…”) - это уже без квадратных строк, прямо в текст.
Максимум 4-5 штук на весь текст.

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
    channel: str, news_count: int = 5
) -> dict:
    meta = CHANNELS.get(channel)
    if not meta:
        return {"ok": False, "error": f"Channel not found: {channel}"}
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
    channel: str, events_count: int = 5
) -> dict:
    meta = CHANNELS.get(channel)
    if not meta:
        return {"ok": False, "error": f"Channel not found: {channel}"}
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
