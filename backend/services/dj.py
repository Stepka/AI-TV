import hashlib
import os
from scipy.io.wavfile import write

from elevenlabs import ElevenLabs
from fastapi import APIRouter, Depends
import numpy as np
from silero import silero_tts
from silero_stress import load_accentor

from db.channels import get_channel_by_id
from services.silero import has_speech
from services.llm import generate_dj_text
from models.dj import DJRequest

elevenlabs_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

silero_model, _ = silero_tts(language='ru',
                                 speaker='v5_cis_base_nostress')
silero_model.packages[0].ext_alph = {}
accentor = load_accentor(lang='ru')


def generate_dj_speech(req: DJRequest):
    sample_rate = 48000

    text = generate_dj_text(
        user_uid=req.user_id,
        channel_uid=req.channel_id,
        from_artist=req.from_artist,
        from_title=req.from_title,
        to_artist=req.to_artist,
        to_title=req.to_title,
    )

    print()
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
                stress_text = accentor(text)
                audio = silero_model.apply_tts(
                    # ssml_text=ssml_text,
                    text=stress_text,
                    speaker=meta["voice"]["name"],
                    put_accent=True,
                    put_yo=True,
                    put_stress_homo=True,
                    put_yo_homo=True,
                    sample_rate=sample_rate
                )
                audio_numpy = audio.cpu().numpy()  # конвертируем в numpy
                audio = (audio_numpy * 32767).astype(np.int16)  # приводим к int16

        return audio
    
    retries = 3
    is_speech = False
    audio = None
    while audio is None and retries > 0:
        try:
            retries -= 1
            audio = generate_speech()
            is_speech = has_speech(audio, sample_rate, threshold=0.5)
            duration_seconds = 30
            # Количество сэмплов
            num_samples = audio.shape[0]
            # Длительность в секундах
            duration_seconds = num_samples / sample_rate
            print(f"Generated {duration_seconds:.2f} sec audio with {meta["voice"]["source"]}")
            raw = f"{req.user_id}|{req.channel_id}|{req.from_title}|{req.to_title}"
            h = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]  # короткий хэш

            filename = f"dj_{h}.wav"
            dir_path = f"channels_data/{req.user_id}/{req.channel_id}/speech"
            os.makedirs(dir_path, exist_ok=True)
            write(f"{dir_path}/{filename}", sample_rate, audio)
        except Exception as e:
            print("ERROR!", e)
          

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