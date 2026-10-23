"""
Document Reconciliation Model for OCR-assisted credential verification.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict, List
from sqlalchemy import String, Float, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class DocumentReconciliation(Base):
    __tablename__ = "document_reconciliations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("student_records.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)  # marksheet, diploma, caste_certificate, migration_certificate, identity_card
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    extracted_data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    field_comparisons: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 - 1.0
    match_status: Mapped[str] = mapped_column(String(50), nullable=False)  # VERIFIED, REVIEW_REQUIRED, MISMATCH_FLAGGED
    discrepancies: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    reconciled_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, nullable=False)

    student: Mapped["StudentRecord"] = relationship("StudentRecord")
    institution: Mapped["Institution"] = relationship("Institution")
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reconciled_by])
