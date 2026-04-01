

from pydantic import BaseModel


class GenerateAITrackRequest(BaseModel):
    user_id: str
    channel_id: str

class GenerateBrandPhraseSpeechRequest(BaseModel):
    user_id: str
    channel_id: str
    text: str