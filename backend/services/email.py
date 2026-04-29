import os
import smtplib
from email.mime.text import MIMEText
from urllib.parse import urlencode

from dotenv import load_dotenv


load_dotenv()


def send_email(to_email: str, subject: str, text: str):
    from_email = os.getenv("GMAIL_APP_MAIL")
    app_password = os.getenv("GMAIL_APP_PASS")

    if not from_email or not app_password:
        raise RuntimeError("Email credentials are not configured")

    msg = MIMEText(text)
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
    try:
        server.login(from_email, app_password)
        server.send_message(msg)
    finally:
        server.quit()


def build_email_verification_link(to_email: str, code: str) -> str:
    frontend_url = (
        os.getenv("FRONTEND_URL")
        or os.getenv("APP_URL")
        or "https://cyberculturecorp.com"
    ).rstrip("/")
    params = urlencode({
        "email": to_email,
        "verification_code": code,
    })
    return f"{frontend_url}/#/register?{params}"


def send_email_verification_code(to_email: str, code: str):
    verification_link = build_email_verification_link(to_email, code)
    send_email(
        to_email,
        "AI-TV email confirmation",
        (
            "Your AI-TV confirmation code:\n\n"
            f"{code}\n\n"
            "Or open this link to continue registration:\n\n"
            f"{verification_link}\n\n"
            "The code is valid for 30 minutes. If you did not request this, ignore this email."
        ),
    )
