import uuid
from datetime import datetime
from typing import Optional, Any, Dict
from sqlalchemy import String, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    outcome: Mapped[str] = mapped_column(String(50), nullable=False)  # success/failure/denied
    # "metadata" is reserved by DeclarativeBase, so we use event_metadata mapped to column name "metadata"
    event_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column("metadata", JSON, nullable=True)
    previous_event_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    event_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    actor: Mapped[Optional["User"]] = relationship("User", back_populates="audit_events")
