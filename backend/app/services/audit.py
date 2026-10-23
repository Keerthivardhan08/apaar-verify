"""
Audit service — records tamper-evident audit events.

The event hash chain uses SHA-256: each event hashes its own data
plus the previous event's hash. This detects single-event tampering
but does NOT provide production-grade non-repudiation or immutability.
See docs/known-limitations.md for details.
"""
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.audit import AuditEvent


def _compute_event_hash(event_data: Dict[str, Any], previous_hash: Optional[str]) -> str:
    """Compute SHA-256 hash over event data + previous hash."""
    payload = {
        "event_data": event_data,
        "previous_event_hash": previous_hash or "GENESIS",
    }
    serialized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode()).hexdigest()


def _get_last_event_hash(db: Session) -> Optional[str]:
    """Retrieve the most recent event's hash for chaining."""
    last = db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).first()
    return last.event_hash if last else None


def log_event(
    db: Session,
    action: str,
    target_type: str,
    outcome: str,
    actor_id: Optional[uuid.UUID] = None,
    target_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> AuditEvent:
    """
    Record an auditable event with a hash-chained integrity marker.

    Important: metadata must NOT contain passwords, tokens, or full
    sensitive identifiers. Callers are responsible for sanitizing values.
    """
    previous_hash = _get_last_event_hash(db)

    event_data = {
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "actor_id": str(actor_id) if actor_id else None,
        "outcome": outcome,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    event_hash = _compute_event_hash(event_data, previous_hash)

    event = AuditEvent(
        id=uuid.uuid4(),
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        outcome=outcome,
        event_metadata=metadata,
        previous_event_hash=previous_hash,
        event_hash=event_hash,
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.flush()  # Flush so the event is available within the same transaction
    return event


def verify_event_chain(db: Session, limit: int = 100) -> Dict[str, Any]:
    """
    Verify integrity of the most recent `limit` audit events.
    Returns a summary of the check result.
    """
    events = (
        db.query(AuditEvent)
        .order_by(AuditEvent.created_at.asc())
        .limit(limit)
        .all()
    )

    if not events:
        return {"status": "ok", "checked": 0, "tampered": []}

    tampered = []
    for i, event in enumerate(events):
        previous_hash = events[i - 1].event_hash if i > 0 else None
        event_data = {
            "action": event.action,
            "target_type": event.target_type,
            "target_id": event.target_id,
            "actor_id": str(event.actor_id) if event.actor_id else None,
            "outcome": event.outcome,
            "timestamp": event.created_at.isoformat(),
        }
        expected_hash = _compute_event_hash(event_data, previous_hash)
        if expected_hash != event.event_hash:
            tampered.append(str(event.id))

    return {
        "status": "tampered" if tampered else "ok",
        "checked": len(events),
        "tampered": tampered,
    }
