import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from sqlalchemy import String, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ValidationIssue(Base):
    __tablename__ = "validation_issues"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    record_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("student_records.id", ondelete="CASCADE"), nullable=True, index=True)
    batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("upload_batches.id", ondelete="CASCADE"), nullable=True, index=True)
    rule_code: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # info/warning/high/critical
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    affected_field: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expected_condition: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    observed_condition: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    evidence_reference: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False, index=True)  # open/under_review/resolved/false_positive/reopened
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    resolved_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    record: Mapped[Optional["StudentRecord"]] = relationship("StudentRecord", back_populates="validation_issues")
    batch: Mapped[Optional["UploadBatch"]] = relationship("UploadBatch", back_populates="validation_issues")
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to])
    resolver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[resolved_by])
    reviews: Mapped[List["ReviewDecision"]] = relationship("ReviewDecision", back_populates="issue", cascade="all, delete-orphan", order_by="desc(ReviewDecision.created_at)")


class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    issue_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("validation_issues.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    decision: Mapped[str] = mapped_column(String(50), nullable=False)  # confirmed_discrepancy/corrected/legitimate_exception/duplicate_confirmed/false_positive/unresolved
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    evidence_reference: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    issue: Mapped["ValidationIssue"] = relationship("ValidationIssue", back_populates="reviews")
    reviewer: Mapped["User"] = relationship("User")
