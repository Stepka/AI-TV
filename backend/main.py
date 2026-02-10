import random
from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
import numpy as np
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv
import os
import os
import json
from scipy.io.wavfile import write
from openai import OpenAI

load_dotenv()

from yt_cache import YouTubeCache
from silero import silero_tts

app = FastAPI()

# Разрешаем фронтенду подключаться
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

silero_model, _ = silero_tts(language='ru',
                                 speaker='v5_1_ru')

# Предопределенные каналы
CHANNELS = {
    
    "MTV": {
        "type": "music_tv",
        "style": "modern popular music",
        "era": "2010-2024",
        "description": "global chart hits, pop, hip hop, dance"
    },
    
    "Retro": {
        "type": "music_tv",
        "style": "classic hits",
        "era": "1980-1989",
        "description": "80s pop, disco, synth, rock"
    },
    
    "Retro Synth": {
        "type": "music_tv",
        "style": "classic synth hits",
        "era": "1980-1989",
        "description": "80s synth, soviet synth"
    },
    
    "A One": {
        "type": "music_tv",
        "style": "rock and alternative",
        "era": "1995-2010",
        "description": "alternative rock, grunge, indie"
    },
    
    "Другое Место": {
        "type": "brand_space",
        "style": 
            "chill electronic and oriental lounge, "
            "deep house, organic house, downtempo, "
            "oriental chill, arabic fusion, hookah lounge vibes",
        "era": "2005-2025",
        "name": "Лаунж кафе Другое Место на артиллерийской",
        "description": "Лаунж кафе Другое Место на артиллерийской, кальяны, чай",
        "action": [
            "При покупке двух кальянов - третий в подарок",
        ],
        "location": "Калининград",
        "menu": [
            "Чай с жасмином 500 рублей",
            "Чай с мятой 500 рублей",
            "Лимонад с базиликом 700 рублей",
            "Кофе по-восточному 600 рублей",
        ]
    },
    
    "Пеперончино": {
        "type": "brand_space",
        "style": 
            "family-friendly pop and soft rock, "
            "italian classics, acoustic hits, "
            "easy listening, light funk, "
            "feel-good background music",
        "era": "1985-2025",
        "name": "Пеперончино",
        "description": "ПЕПЕРОНЧИНО🌶️ | Пиццерия Калининград",
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
        "era": "2008-2025",
        "name": "X-Fit",
        "description": "X-Fit | Фитнес-клуб и тренажёрный зал",
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
        "era": "1995-2025",
        "name": "Эдкар",
        "description": "Эдкар | Семейная медицина и стоматология",
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
        "era": "2012-2025",
        "name": "EXEED",
        "description": "EXEED | Автомобильный дилерский центр",
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
        "era": "2015-2025",
        "name": "О, Pretty People",
        "description": "О, Pretty People | Салон красоты",
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
        "era": "1990-2025",
        "name": "OldBoy",
        "description": "OldBoy | Барбершоп",
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



YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") 


class PlaylistRequest(BaseModel):
    channel: str
    max_results: int = 10

    
class DJRequest(BaseModel):
    channel: str
    from_title: str
    to_title: str


@app.post("/playlist")
def get_playlist(req: PlaylistRequest):
    cache = YouTubeCache()  # при первом запуске база создастся автоматически

    tracks = generate_playlist_llm(req.channel, req.max_results*4)
    tracks = random.sample(tracks, min(req.max_results, len(tracks)))
    # return tracks

    videos = []
    for track in tracks:
        video_id = cache.get_video(track['artist'], track['title'])
        if not video_id:
            # поиск через YouTube API
            print("Searching YouTube for:", track)

            query = f"{track['artist']} {track['title']} official music video"
            video_id = search_youtube_video(query)

            if video_id:
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


@app.get("/test_speech")
def test_speech():
    sample_rate = 48000

    text = generate_dj_text(
        channel="MTV",
        from_title="Dua Lipa - Levitating",
        to_title="Charlie XCX - Boom Clap",
    )

    print("Generated text:", text)
    
    audio = silero_model.apply_tts(
        text=text,
        sample_rate=sample_rate
    )
    
    audio_numpy = audio.cpu().numpy()  # конвертируем в numpy
    audio_int16 = (audio_numpy * 32767).astype(np.int16)  # приводим к int16
    filename = "dj.wav"
    write(f"wav_folder/{filename}", sample_rate, audio_int16)

    html_content = f"""
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>DJ Transition Player</title>
    </head>
    <body style="background-color:#111;color:#fff;text-align:center;padding-top:50px;font-family:sans-serif;">
        <h1>DJ Transition Player</h1>
        <audio controls autoplay>
            <source src="/audio?filename={filename}" type="audio/wav">
            Ваш браузер не поддерживает аудио.
        </audio>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/audio")
def get_audio(filename: str):
    print("Serving audio file:", filename)
    return FileResponse(f"wav_folder/{filename}", media_type="audio/wav", filename=filename)


@app.post("/dj_transition")
def dj_transition(req: DJRequest):
    sample_rate = 48000

    text = generate_dj_text(
        channel=req.channel,
        from_title=req.from_title,
        to_title=req.to_title,
    )

    print("Generated text:", text)
    
    audio = silero_model.apply_tts(
        text=text,
        sample_rate=sample_rate
    )
    
    audio_numpy = audio.cpu().numpy()  # конвертируем в numpy
    audio_int16 = (audio_numpy * 32767).astype(np.int16)  # приводим к int16
    filename = f"DJ - {req.channel} - {req.from_title} - {req.to_title}.wav"
    write(f"wav_folder/{filename}", sample_rate, audio_int16)

    return {
        "text": text,
        "audio_filename": filename,
        "format": "wav"
    }


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
    items = r.json().get("items", [])

    if not items:
        return None

    item = items[0]
    return item["id"]["videoId"]
    # {
    #     "title": item["snippet"]["title"],
    #     "videoId": item["id"]["videoId"],
    #     "channelTitle": item["snippet"]["channelTitle"]
    # }


def generate_playlist_llm(channel: str, count: int = 10):
    meta = CHANNELS.get(channel)
    if not meta:
        raise ValueError("Unknown channel")

    prompt = f"""
You are a professional music TV editor.

Create a playlist for the TV channel "{channel}".

Style: {meta["style"]}
Era: {meta["era"]}

Rules:
- EXACTLY {count} items
- Popular and recognizable songs
- Each item must include artist and title
- No remixes, no live versions
- Avoid duplicate artists

Return ONLY valid JSON.
Format:
{{
  "tracks": [
  {{ "artist": "Artist name", "title": "Song title" }}
  ]
}}
"""

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # быстрый и дешёвый для MVP
        messages=[
            {"role": "system", "content": "You generate structured music playlists."},
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
            case x if x <= 0.2:
                print("Adding promo")
                text = add_promo(text, channel)
            case x if x <= 0.4:
                print("Adding menu")
                text = add_menu(text, channel)
            case x if x <= 0.6:
                print("Adding weather")
                text = add_weather(text, channel)
            case x if x <= 0.8:
                print("Adding local events")
                text = add_local_events(text, channel)
            case x if x <= 1:
                print("Adding local news")
                text = add_local_news(text, channel)

    if len(text) > 1000:
        text = shortener(text, channel, max_symbols=1000)
        
    text = convert_to_russian(text, from_title, to_title)
    text = convert_digits(text)
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
Нужно плавно и в стиле канала ({meta["style"]}) перейти от одного клипа к другому.
Упоминай в тексте заведение и его атмосферу, а также особенности музыки канала.

Теперь придумай переход от трека {from_title} к треку {to_title}

Требования к тексту:
— русский язык
— разговорный стиль
— живо, уверенно, как на музыкальном ТВ
— 2–3 предложения
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
Сократи этот текст, чтобы он был длиной меньше {max_symbols} символов.
Вот текст, который нужно дополнить: {text}

Верни дополненный текст, который диджей может сказать в эфире,
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
    

def convert_to_russian(text: str, from_title: str, to_title: str) -> str:
    prompt = f"""
Преобразуй любые названия, в том числе треков и каналов:

перепиши {from_title} и {to_title} по русски

Не делай прямой перевод, а пиши так, как названия песен произносят на русском радио и ТВ.

имена исполнителей и названия песен запиши КИРИЛЛИЦЕЙ

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
        temperature=0.8,
    )

    return response.choices[0].message.content.strip()
    

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
