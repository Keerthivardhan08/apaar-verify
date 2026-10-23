import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import require_roles
from app.models.user import User
from app.models.audit import AuditEvent
from app.services.audit import verify_event_chain

router = APIRouter()


@router.get("/audit")
def list_audit_events(
    target_type: Optional[str] = Query(None),
    actor_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles("aicte_admin", "reviewer")),
    db: Session = Depends(get_db),
):
    q = db.query(AuditEvent)
    if target_type:
        q = q.filter(AuditEvent.target_type == target_type)
    if actor_id:
        q = q.filter(AuditEvent.actor_id == uuid.UUID(actor_id))
    if action:
        q = q.filter(AuditEvent.action == action)

    total = q.count()
    events = q.order_by(AuditEvent.created_at.desc()).offset((page - 1) * size).limit(size).all()

    return {
        "items": [
            {
                "id": str(e.id),
                "actor_id": str(e.actor_id) if e.actor_id else None,
                "action": e.action,
                "target_type": e.target_type,
                "target_id": e.target_id,
                "outcome": e.outcome,
                "metadata": e.event_metadata,
                "event_hash": e.event_hash,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
        "total": total,
        "page": page,
        "size": size,
    }


@router.get("/audit/verify-chain")
def verify_audit_chain(
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles("aicte_admin")),
    db: Session = Depends(get_db),
):
    result = verify_event_chain(db, limit)
    return result
