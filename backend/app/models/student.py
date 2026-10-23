import uuid
from datetime import datetime, date
from typing import List, Optional, Any, Dict
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class StudentIdentity(Base):
    __tablename__ = "student_identities"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    identifier_type: Mapped[str] = mapped_column(String(50), default="demo", nullable=False)  # apaar/abc_id/demo
    identifier_fingerprint: Mapped[Optional[str]] = mapped_column(String(128), index=True, nullable=True)  # keyed HMAC
    verification_status: Mapped[str] = mapped_column(String(50), default="unverified", nullable=False)  # unverified/pending/mock_verified/verified/failed/unavailable/revoked
    provider_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student_records: Mapped[List["StudentRecord"]] = relationship("StudentRecord", back_populates="identity")


class StudentRecord(Base):
    __tablename__ = "student_records"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    institution_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("programs.id", ondelete="RESTRICT"), nullable=False, index=True)
    student_identity_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("student_identities.id", ondelete="SET NULL"), nullable=True, index=True)
    identity_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    admission_cycle: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    institution_student_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    student_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    admission_category: Mapped[str] = mapped_column(String(50), nullable=False)  # general/obc/sc/st/ews/nri/oci/foreign_national/management_quota
    admission_status: Mapped[str] = mapped_column(String(50), default="admitted", nullable=False)  # admitted/provisional/cancelled/migrated
    nri_category: Mapped[str] = mapped_column(String(20), default="not_applicable", nullable=False)  # applicable/not_applicable
    oci_status: Mapped[str] = mapped_column(String(20), default="not_applicable", nullable=False)  # applicable/not_applicable
    foreign_national_status: Mapped[str] = mapped_column(String(20), default="not_applicable", nullable=False)  # applicable/not_applicable
    supernumerary_category: Mapped[str] = mapped_column(String(50), default="none", nullable=False)  # none/nri/foreign_national/kashmiri_migrant/other
    source_batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("upload_batches.id", ondelete="SET NULL"), nullable=True, index=True)
    record_status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)  # draft/submitted/accepted/flagged/under_review/correction_requested/corrected/rejected
    identity_verification_status: Mapped[str] = mapped_column(String(50), default="unverified", nullable=False)  # unverified/pending/mock_verified/verified/failed/unavailable
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    institution: Mapped["Institution"] = relationship("Institution", back_populates="student_records")
    program: Mapped["Program"] = relationship("Program", back_populates="student_records")
    identity: Mapped[Optional["StudentIdentity"]] = relationship("StudentIdentity", back_populates="student_records")
    source_batch: Mapped[Optional["UploadBatch"]] = relationship("UploadBatch", back_populates="student_records")
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    updater: Mapped[Optional["User"]] = relationship("User", foreign_keys=[updated_by])
    validation_issues: Mapped[List["ValidationIssue"]] = relationship("ValidationIssue", back_populates="record", cascade="all, delete-orphan")
    versions: Mapped[List["StudentRecordVersion"]] = relationship("StudentRecordVersion", back_populates="record", cascade="all, delete-orphan", order_by="desc(StudentRecordVersion.version_number)")
    credentials: Mapped[List["VerificationCredential"]] = relationship("VerificationCredential", back_populates="record", cascade="all, delete-orphan")
    consents: Mapped[List["ConsentRecord"]] = relationship("ConsentRecord", back_populates="student", cascade="all, delete-orphan")


class StudentRecordVersion(Base):
    __tablename__ = "student_record_versions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("student_records.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    changed_by: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    change_reason: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    record: Mapped["StudentRecord"] = relationship("StudentRecord", back_populates="versions")
    user: Mapped["User"] = relationship("User")
