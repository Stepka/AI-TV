from typing import List, Optional

from pydantic import BaseModel

from models.dj import Voice


class Channel(BaseModel):
    channel_uid: str
    name: str
    type: str
    style: str
    description: str
    location: str = ""
    voice: Voice
    actions: List[str] = []
    menu: List[str] = []
    sources: List[str] = []
    url: str = ""


class ChannelUpdate(BaseModel):
    user_id: str
    name: str
    type: str
    style: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    voice_json: Optional[str] = None
    actions_json: Optional[str] = None
    menu_json: Optional[str] = None
    sources_json: Optional[str] = None
    url: Optional[str] = None


class FillChannelWithLLM(BaseModel):
    user_id: str
    url: str