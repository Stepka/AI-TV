
from typing import Optional

from pydantic import BaseModel


class Voice(BaseModel):
    source: str
    name: str
    sex: str
    prompt: Optional[str] = ""

    
class DJRequest(BaseModel):
    user_id: str
    channel_id: str
    from_artist: str
    from_title: str
    to_artist: str
    to_title: str
    

class BrandPhraseRequest(BaseModel):
    user_id: str
    channel_id: str