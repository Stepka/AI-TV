from fastapi import HTTPException

from models.auth import Subscription
from db.common import get_db
from db.auth import fetch_user, fetch_user_by_id


def fetch_subscription(subscription_id: int) -> Subscription:
    conn = get_db()
    cur = conn.cursor()

    subscription_row = cur.execute("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,)).fetchone()
    if not subscription_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Subscription not found")

    conn.close()

    subscription = Subscription(**subscription_row)

    return subscription


def spend_subscription(user_id: str, field: str, decrement: int = 1) -> bool:
    user = fetch_user_by_id(user_id)

    value = getattr(user, field)

    print(value)

    if value == -1:
        return True

    if value < decrement:
        return False
    
    conn = get_db()
    cursor = conn.cursor()

    # Пытаемся обновить
    cursor.execute(f"""
        UPDATE users
        SET {field} = ?
        WHERE user_uid = ?
    """, (
        value - decrement, user_id
    ))

    conn.commit()
    conn.close()

    return True

