import ctypes
from datetime import datetime
import hashlib
import random
import re
import numpy as np

from fastapi import Depends, FastAPI, Query
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from phonemizer.backend.espeak.wrapper import EspeakWrapper
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import sqlite3, json
from typing import List, Dict, Optional

import requests
from dotenv import load_dotenv
import sqlite3
import os
import json

import re


from api import auth
from api import channels
from api import media
from api import playlist
from api import dj

load_dotenv()

from elevenlabs.client import ElevenLabs
from silero import silero_tts

app = FastAPI()

# Разрешаем фронтенду подключаться
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://84.32.97.178", "http://84.32.97.178:3030", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(channels.router)
app.include_router(media.router)
app.include_router(playlist.router)
app.include_router(dj.router)


@app.get("/")
def get_home():
    return "It's AI-TV, baby!"
