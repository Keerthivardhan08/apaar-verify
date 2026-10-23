import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    recipient_id: uuid.UUID,
    notification_type: str,
    title: str,
    message: str,
    db: Session,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
) -> Notification:
    """Create and persist an in-app notification for a user."""
    notif = Notification(
        id=uuid.uuid4(),
        recipient_id=recipient_id,
        notification_type=notification_type,
        title=title,
        message=message,
        target_type=target_type,
        target_id=target_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(notif)
    db.flush()
    return notif


def mark_as_read(
    notification_id: uuid.UUID,
    recipient_id: uuid.UUID,
    db: Session,
) -> bool:
    """Mark a specific notification as read."""
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.recipient_id == recipient_id,
        )
        .first()
    )
    if not notif:
        return False
    notif.read_at = datetime.now(timezone.utc)
    db.flush()
    return True


def mark_all_as_read(
    recipient_id: uuid.UUID,
    db: Session,
) -> int:
    """Mark all unread notifications for a user as read."""
    unread = (
        db.query(Notification)
        .filter(
            Notification.recipient_id == recipient_id,
            Notification.read_at.is_(None),
        )
        .all()
    )
    now = datetime.now(timezone.utc)
    for n in unread:
        n.read_at = now
    db.flush()
    return len(unread)
