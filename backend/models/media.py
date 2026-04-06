

from pydantic import BaseModel


class GenerateAITrackRequest(BaseModel):
    user_id: str
    channel_id: str

class GenerateBrandPhraseSpeechRequest(BaseModel):
    ad_id: str
    user_id: str
    channel_id: str
    ad_text: str

class AdPhrase(BaseModel):
    ad_id: str
    user_id: str
    channel_id: str
    ad_text: str
    speech: str
    filename: str
    voice_model: str
    voice_speaker: str
    voice_sex: str
    type: str
    duration: float = -1

class AddAdPhraseRequest(BaseModel):
    user_id: str
    channel_id: str

class UpdateAdPhraseRequest(BaseModel):
    ad_id: str
    user_id: str
    channel_id: str
    ad_text: str = ""
    speech: str = ""
    voice_model: str = ""
    voice_speaker: str = ""
    voice_sex: str = ""