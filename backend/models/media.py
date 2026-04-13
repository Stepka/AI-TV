

from fastapi import Form
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

class UploadVideoRequest(BaseModel):
    user_id: str
    channel_id: str

    @classmethod
    def as_form(
        cls,
        user_id: str = Form(...),
        channel_id: str = Form(...)
    ):
        return cls(user_id=user_id, channel_id=channel_id)
    
class DeleteVideoRequest(BaseModel):
    user_id: str
    channel_id: str
    filename: str
    
class DeleteAudioRequest(BaseModel):
    user_id: str
    channel_id: str
    filename: str
    
class DeletePrerecordAdPhraseRequest(BaseModel):
    user_id: str
    channel_id: str
    ad_id: str
    
class DeletePrerecordBrandPhraseRequest(BaseModel):
    user_id: str
    channel_id: str
    ad_id: str