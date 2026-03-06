
import re

import numpy as np
import requests

from phonemizer import phonemize


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


def replace_words(text: str) -> str:
    """
    Заменяет слова в тексте по словарю replace_dict.
    
    text: исходный текст
    replace_dict: словарь вида {"старое_слово": "новое_слово", ...}
    
    Возвращает текст с заменами.
    """
    # создаём регулярку, которая ищет любые ключи как отдельные слова
    pattern = r'\b(' + '|'.join(map(re.escape, REPLACE_DICT.keys())) + r')\b'
    
    # функция замены
    def repl(match):
        return REPLACE_DICT[match.group(0)]
    
    return re.sub(pattern, repl, text, flags=re.IGNORECASE)


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


def rms(audio_int16):
    x = audio_int16.astype(np.float32)
    return float(np.sqrt(np.mean(x * x)))
