import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()


@router.get("/notifications")
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(n.id),
            "notification_type": n.notification_type,
            "title": n.title,
            "message": n.message,
            "target_type": n.target_type,
            "target_id": n.target_id,
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.recipient_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Notification marked as read."}


@router.patch("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unread = (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id, Notification.read_at.is_(None))
        .all()
    )
    now = datetime.now(timezone.utc)
    for n in unread:
        n.read_at = now
    db.commit()
    return {"message": f"{len(unread)} notifications marked as read."}
