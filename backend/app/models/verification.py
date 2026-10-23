import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from sqlalchemy import String, Text, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class VerificationCredential(Base):
    __tablename__ = "verification_credentials"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    issuer_id: Mapped[str] = mapped_column(String(100), default="apaar-verify-demo", nullable=False)
    subject_reference: Mapped[str] = mapped_column(String(100), index=True, nullable=False)  # opaque reference, not raw ID
    record_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("student_records.id", ondelete="CASCADE"), nullable=False, index=True)
    claims: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    credential_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # active/expired/revoked
    token: Mapped[str] = mapped_column(Text, nullable=False)  # the signed JWT
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    record: Mapped["StudentRecord"] = relationship("StudentRecord", back_populates="credentials")
    events: Mapped[List["VerificationEvent"]] = relationship("VerificationEvent", back_populates="credential", cascade="all, delete-orphan")


class VerificationEvent(Base):
    __tablename__ = "verification_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    requester_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    credential_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("verification_credentials.id", ondelete="SET NULL"), nullable=True, index=True)
    purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    claims_requested: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    result: Mapped[str] = mapped_column(String(50), nullable=False)  # success/failed/expired/revoked/unauthorized
    verification_method: Mapped[str] = mapped_column(String(50), default="api", nullable=False)  # qr/api/manual
    provider_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    requester: Mapped[Optional["User"]] = relationship("User")
    credential: Mapped[Optional["VerificationCredential"]] = relationship("VerificationCredential", back_populates="events")
