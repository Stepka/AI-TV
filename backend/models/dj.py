
from pydantic import BaseModel


class Voice(BaseModel):
    source: str
    name: str
    sex: str

    
class DJRequest(BaseModel):
    user_id: str
    channel_id: str
    from_title: str
    to_title: str