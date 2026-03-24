

from pydantic import BaseModel


class GenerateAITrackRequest(BaseModel):
    user_id: str
    channel_id: str