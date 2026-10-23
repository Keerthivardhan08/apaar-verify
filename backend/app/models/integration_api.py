"""
Models for Approved Institutional APIs & SIS ERP Integration.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class InstitutionalApiKey(Base):
    __tablename__ = "institutional_api_keys"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    institution_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    key_name: Mapped[str] = mapped_column(String(100), nullable=False)
    api_key_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    api_key_prefix: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    permissions: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, nullable=False)

    institution: Mapped["Institution"] = relationship("Institution")


class InstitutionalWebhook(Base):
    __tablename__ = "institutional_webhooks"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    institution_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    target_url: Mapped[str] = mapped_column(String(500), nullable=False)
    secret_token: Mapped[str] = mapped_column(String(128), nullable=False)
    event_types: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_delivery_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, nullable=False)

    institution: Mapped["Institution"] = relationship("Institution")
