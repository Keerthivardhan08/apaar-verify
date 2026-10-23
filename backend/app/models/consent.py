import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from sqlalchemy import String, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("student_records.id", ondelete="CASCADE"), nullable=False, index=True)
    verifier_purpose: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # Purpose e.g. admission_verification, scholarship_eligibility, employment_screening, exam_registration, minimal_proof
    permitted_claims: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    consent_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # active, revoked, expired
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consent_token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    requester_entity: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    student: Mapped["StudentRecord"] = relationship("StudentRecord", back_populates="consents")
