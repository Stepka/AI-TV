
import numpy as np
import torch
import torchaudio


silero_vad_model, vad_utils = torch.hub.load(
    repo_or_dir="snakers4/silero-vad",
    model="silero_vad",
    force_reload=False
)

(get_speech_timestamps, _, _, _, _) = vad_utils


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
