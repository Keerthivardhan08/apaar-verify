"""
Models for Authoritative Reference Master Synchronization.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy import String, DateTime, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class AuthoritativeReferenceMaster(Base):
    __tablename__ = "authoritative_reference_masters"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reference_type: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    # e.g. aicte_approved_intake, national_program_registry, state_reservation_matrix
    source_system: Mapped[str] = mapped_column(String(150), nullable=False)
    dataset_version: Mapped[str] = mapped_column(String(50), nullable=False)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    checksum: Mapped[str] = mapped_column(String(128), nullable=False)
    sync_status: Mapped[str] = mapped_column(String(50), default="synced", nullable=False)
    last_synchronized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, nullable=False)
