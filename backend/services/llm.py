from datetime import datetime
import json
import random
import re
from typing import List

from openai import OpenAI
import os

import requests

from services.common import convert_latin_to_cyrillic, get_weather, replace_words
from db.channels import get_channel_by_id


llm_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_playlist_llm(user_uid: str, channel_uid: str, count: int = 10, last_played: List[dict] = None):
    meta = get_channel_by_id(user_uid, channel_uid)

    last_played = last_played or []
    last_played_str = ", ".join(f"{t.get('artist','')} - {t.get('title','')}" for t in last_played) or "Список треков пуст"

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
- Today {datetime.now()}. Detect part of the day and prefer tracks that fit this part of the day 
- Prefer tracks with the video clip on Youtube
- Try to make different playlist with different tracks each time
- Avoid duplicate artists
- Use various artists in generated playlist. Add not more 2 tracks from a single artist
- Do not arrange tracks on its popularity

Also exclude tracks, that already played on this channel recently. 
Here is the list of recently played tracks: {last_played_str}

Return ONLY valid JSON. 
Format:
{{
  "tracks": [
  {{ "artist": "Artist name", "title": "Song title" }}
  ]
}}
"""
    # print(prompt)

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # быстрый и дешёвый для MVP
        messages=[
            {"role": "system", "content": "You generate structured and smooth music playlists."},
            {"role": "user", "content": prompt}
        ],
        temperature=1.0,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)["tracks"]
    except json.JSONDecodeError:
        # защита от мусора
        raise RuntimeError(f"LLM returned invalid JSON: {content}")


def generate_playlist_ppx(user_uid: str, channel_uid: str, count: int = 10, last_played: List[dict] = None):
    meta = get_channel_by_id(user_uid, channel_uid)

    last_played = last_played or []
    last_played_str = ", ".join(f"{t.get('artist','')} - {t.get('title','')}" for t in last_played) or "Список треков пуст"

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
- Today {datetime.now()}. Detect part of the day and prefer tracks that fit this part of the day 
- Try to select tracks with duration from 2 to 10 minutes, avoid tracks with duration more than 10 minutes
- Prefer tracks with the video clip on Youtube
- Try to make different playlist with different tracks each time
- Avoid duplicate artists
- If possible make query music databases, YouTube, Spotify, or music streaming platforms
- If there are few tracks anyway return those tracks
- Use various artists in generated playlist. Add not more 2 tracks from a single artist
- Use different sources
- Do not arrange tracks on its popularity

Also exclude tracks, that already played on this channel recently. 
Here is the list of recently played tracks: {last_played_str}

Return ONLY valid JSON. Do not use markdown.
Format:
{{
  "tracks": [
  {{ "artist": "Artist name", "title": "Song title" }}
  ]
}}
"""
    # print(prompt)

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
        "temperature": 1.0,
    }

    r = requests.post(url, headers=headers, json=payload, timeout=30)
    r.raise_for_status()

    content = r.json()["choices"][0]["message"]["content"].strip()

    # Если модель вернула NONE
    if content.upper() == "NONE":
        raise Exception("No suitable tracks found")

    # print(content)
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
    



def check_style_match_level(user_uid: str, channel_uid: str, tracks: List[dict]):
    meta = get_channel_by_id(user_uid, channel_uid)

    if not meta:
        raise ValueError("Unknown channel")

    prompt = f"""

You got a json with a list of tracks for the channel "{meta['name']}".

Add information to the given json about how well the track matches the channel style in "match" field (0-100). The higher the better. 

Channel style: {meta["style"]}

Json: {json.dumps(tracks)}

Return updated json.

Format:
{{
  "tracks": [
  {{ "artist": "Artist name", "title": "Song title", "info": "Song info", "match": 0-100 }}
  ]
}}
"""
    # print(prompt)

    response = llm_client.chat.completions.create(
        model="gpt-4o-mini",  # быстрый и дешёвый для MVP
        messages=[
            {"role": "system", "content": "Add information to the given json about how well the track matches the channel style"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)["tracks"]
    except json.JSONDecodeError:
        # защита от мусора
        raise RuntimeError(f"LLM returned invalid JSON: {content}")
    

def generate_dj_text(user_uid: str, channel_uid: str, from_artist: str, from_title: str, to_artist: str, to_title: str) -> str:
    meta = get_channel_by_id(user_uid, channel_uid)
    channel = meta['name']
    to_track_description = get_track_info_ppx(to_artist, to_title)
    print("To track info:", to_track_description)
    from_track_description = get_track_info_ppx(from_artist, from_title) if from_artist and from_title else ""
    print("From track info:", from_track_description)

    text = generate_text(user_uid, channel_uid, from_artist, from_title, from_track_description, to_artist, to_title, to_track_description)

    if from_title:
        if meta["type"] == "brand_space":
                match random.random():
                    case x if x <= 0.4:
                        print("Adding promo")
                        text = add_promo(text, user_uid, channel_uid)
                    case x if x <= 0.8:
                        print("Adding menu")
                        text = add_menu(text, user_uid, channel_uid)
                    case x if x <= 0.9:
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
        # print("Adding promo")
        # text = add_promo(text, user_uid, channel_uid)

    if len(text) > 600:
        print("Text is too long, shortening")
        print("Text length before shortening:", len(text))
        print(text)
        text = shortener(text, user_uid, channel_uid, max_symbols=600)
        print("Text length after shortening:", len(text))
        print(text)
    
    if meta["voice"]["source"] == "silero":
        print("Converting text to Russian")
        text = convert_to_russian(text, from_title, to_title)
        print(text)
        print("Converting digits to words")
        text = convert_digits(text)        
        print(text)
        # print("Converting abbreviatures")
        # text = convert_abbreviatures(text)       
        # print(text) 
        print("Replacing words")
        text = replace_words(text)
        # print(text)
        # print("Adding emotions")
        # text = add_silero_emotions_llm(text)
        # print("Add homographs")
        # text = add_homographs(text)
    
    if meta["voice"]["source"] == "elevenlabs":
        print("Adding emotions")
        text = add_emotions_llm(text)

    # text = add_pauses_llm(text)
        
    print("Text length after all:", len(text))
    return text
    

def generate_text(user_uid: str, channel_uid: str, 
                  from_artist: str, from_title: str, from_track_description: str, 
                  to_artist: str, to_title: str, to_track_description: str) -> str:
    
    meta = get_channel_by_id(user_uid, channel_uid)

    channel = meta['name']

    prompt = f"""
Ты — радио-диджей брендированного музыкального канала "{channel}". 
"""
    
    if meta["type"] == "brand_space":
        prompt += f"""
Ты играешь музыку в заведении "{meta["name"]}", вот его описание: {meta["description"]}.
Упоминай в тексте заведение и его атмосферу и описание.
"""
    else:
        prompt += f"""
Ты играешь музыку на канале "{meta["name"]}", вот его описание: {meta["description"]}.
"""
    prompt += f"""
Сегодня {datetime.now()}. Если будешь в тексте упоминать время дня, то соотноси его с текущим временем и временем дня. 
"""
    if from_title is None and from_artist is None:        
        prompt += f"""
Теперь представь трек "{to_title}" от исполнителя "{to_artist}", с которого начнется вещание. 
Это единственный трек, который надо будет упомняуть. Это твоя первая реплика в эфире, сделай ее привественной.

Используй это описание и факты о треке: {to_track_description}. Только не сильно увлекайся цифрами.

"""
    else:
        prompt += f"""
Нужно плавно и в стиле канала перейти от одного клипа к другому.
Теперь придумай переход от трека "{from_title}" от исполнителя "{from_artist}", который заканчивает играть, 
к треку "{to_title}" от исполнителя "{to_artist}", который будет играть следующим. 
Расскажи пару слов о треке, который будет играть. 

 Стиль канала: ({meta["style"]})

Используй это описание и факты о треках: 
- {from_artist} - {from_title}: {from_track_description}
- {to_artist} - {to_title}: {to_track_description}

"""
    
    prompt += f"""
Требования к тексту:
— русский язык
— нельзя использовать слова на английском или других языках, кроме русского
— Имена исполнителей или исполнителя пиши в русской фонетической передаче 
— Не переводи на русский названия треков или трека
— от {'мужского' if meta["voice"]["sex"] == "male" else 'женского'} пола 
— разговорный стиль
— не придумывай ничего от себя, а используй только информацию, описания и факты, которые тебе передали
— 1–2 предложения
"""
    
    print("Prompt for DJ text generation:", prompt)

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
Вот акция: {random.choice(meta["actions"]) if meta["actions"] else "Нет акций"}

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
Перед тобой текст для радио-диджея, который ведёт эфир на канале {channel} и делает переход между треками.
Сократи этот текст так, чтобы его длина была ококло {max_symbols} символов.

Сокращай текст по следующему приоритету (сначала удаляй элементы из верхних пунктов, пока длина текста не достигнет {max_symbols} символов, 
как только текст станет короче {max_symbols} символов, прекрати сокращение, даже если останется не удалённый пункт из списка):
1. Предложения с приветствиями, прощаниями и финальными фразами
(например: «Приятного прослушивания», «Оставайтесь с нами», «Не переключайтесь» и т.п.).
2. Упоминание автора трека, который уже прозвучал.
3. Упоминание названия трека, который уже прозвучал.
4. Упоминание автора следующего трека.
5. Упоминание названия следующего трека.
6. Описание эмоций или настроения от треков.
7. Факты о треках.
8. Любые дополнительные описания треков.
9. Описание канала.

Требования:
- Сохраняй грамматическую согласованность предложений.
- Текст должен звучать естественно.
- Если возможно, оставь логичный переход между треками.
- Нельзя удалять промо тексты об акциях и позициях меню, если они есть в тексте.

Текст для сокращения:

{text}

Верни только сокращённый текст, без пояснений.
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
6. Внимательно ищи только аббревиатуры. Если не уверен - не исправляй слово. Аббревиаутры - это короткие слова с зашлавными буквами, обычно 3-4 буквы. В тексте могут быть слова, которые являются фонетическим написанием английских слов - их не трогай. 
7. ВАЖНО! Меня только общеизвестные и широко распространенные аббревиатуры.
8. Не добавляй комментарии. Верни только готовый текст.

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
    

def add_homographs(text: str) -> str:
    prompt = f"""
Перед тобой текст на русском языке.
Твоя задача — расставить ударения во всех словах текста.

Правила:
- Ударение обозначается символом + перед ударной гласной.
- Ударение должно быть в каждом слове, где есть гласная.
- Если слово состоит из одной гласной, поставь + перед ней.
- Не изменяй порядок слов.
- Не добавляй новые слова.
- Не удаляй слова.
- Сохраняй всю пунктуацию и структуру текста.
- Имена собственные и иностранные слова тоже должны получить ударение, если это возможно.
- Если слово может иметь несколько вариантов ударения, выбери наиболее распространённый в современной речи.

Формат ответа:
- Верни только текст с расставленными ударениями.
- Не добавляй комментарии, объяснения или дополнительный текст.

Текст:
{text}
"""

    response = llm_client.chat.completions.create(
        model="gpt-5.2",
        messages=[
            {"role": "system", "content": "Отредактируй текст, расставив ударения в каждом слове."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
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
Не переводи названия треков и артистов с русского, а только оборачивай их тегами для медленной и четкой озвучки.
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


def get_track_info_ppx(artist: str, title: str) -> str:
    api_key = os.getenv("PERPLEXITY_API_KEY")
    url = "https://api.perplexity.ai/chat/completions"

    prompt = f"""
Artist: {artist}
Track: {title}

Given a music track or artist name, find a short factual description, notable fact, or recent news.
Return exactly **one concise sentence (max 20 words)** describing the artist or the track.
No lists, no extra commentary, no more than one sentence.

"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": "Return only one sentence of plain text."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 1.0,
    }

    r = requests.post(url, headers=headers, json=payload, timeout=30)
    r.raise_for_status()

    content = r.json()["choices"][0]["message"]["content"].strip()

    # убираем возможные переносы строк
    content = content.replace("\n", " ").strip()

    return content


def get_track_info_list_ppx(tracks) -> str:
    api_key = os.getenv("PERPLEXITY_API_KEY")
    url = "https://api.perplexity.ai/chat/completions"

    prompt = f"""
You got a json with a list of tracks. Each track has an artist and a title.

For each track make the following: 
Given a music track and artist name, find a short track description with basic info about track including genre.
Search exactly **one concise sentence (max 20 words)** describing the track. You can use Soundcharts, ACRCloud, or TheAudioDB.
No lists, no extra commentary, no more than one sentence. Add found info to the field "info" for each track in the json.

Json: {json.dumps(tracks)}

Return updated json.

Format:
{{
  "tracks": [
  {{ "artist": "Artist name", "title": "Song title", "info": "Song info" }}
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
            {"role": "system", "content": "Return valid json. No markdown."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 1.0,
    }

    r = requests.post(url, headers=headers, json=payload, timeout=30)
    r.raise_for_status()

    content = r.json()["choices"][0]["message"]["content"].strip()

    # убираем возможные переносы строк
    content = content.replace("\n", " ").strip()

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
