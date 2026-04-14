from fastapi import APIRouter
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os
import requests

load_dotenv()

router = APIRouter(prefix="/lead", tags=["lead"])

TELEGRAM_TOKEN = os.getenv("TG_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TG_CHAT_ID")

class Lead(BaseModel):
    name: str
    phone: str
    tg: str
    email: str = ""
    message: str = ""

@router.post("/send")
def send_lead(data: Lead):
    text = f"""
Новая заявка:

Имя: {data.name}
Телефон: {data.phone}
Email: {data.email}
Telegram: {data.tg}
Сообщение: {data.message}
"""

    msg = MIMEText(text)
    msg["Subject"] = "Новая заявка AI-TV"
    msg["From"] = os.getenv("GMAIL_APP_MAIL")
    msg["To"] = os.getenv("GMAIL_APP_MAIL")

    server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
    server.login(os.getenv("GMAIL_APP_MAIL"), os.getenv("GMAIL_APP_PASS"))
    server.send_message(msg)
    server.quit()

    send_to_telegram(text)

    return {"status": "ok"}

def send_to_telegram(text: str):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    requests.post(url, json={
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text
    })