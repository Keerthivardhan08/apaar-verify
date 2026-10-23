"""
Models for Multi-Stage Expanded Correction Reconciliation Workflows.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy import String, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class ExpandedCorrectionWorkflow(Base):
    __tablename__ = "expanded_correction_workflows"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("student_records.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    stage: Mapped[str] = mapped_column(String(50), default="operator_draft", nullable=False)
    # operator_draft -> inst_admin_approved -> aicte_verified / rejected
    workflow_status: Mapped[str] = mapped_column(String(50), default="pending_institution_admin", nullable=False)
    # pending_institution_admin, pending_aicte_review, approved_applied, rejected

    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    original_value: Mapped[str] = mapped_column(String(500), nullable=False)
    proposed_value: Mapped[str] = mapped_column(String(500), nullable=False)
    operator_notes: Mapped[str] = mapped_column(String(1000), nullable=False)

    inst_admin_notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    inst_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    inst_admin_decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    aicte_reviewer_notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    aicte_reviewer_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    aicte_decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, nullable=False)

    record: Mapped["StudentRecord"] = relationship("StudentRecord")
    institution: Mapped["Institution"] = relationship("Institution")
    inst_admin: Mapped[Optional["User"]] = relationship("User", foreign_keys=[inst_admin_id])
    aicte_reviewer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[aicte_reviewer_id])
