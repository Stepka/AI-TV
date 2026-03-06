from pydantic import BaseModel


class PlaylistRequest(BaseModel):
    user_id: str
    channel_id: str
    max_results: int = 10