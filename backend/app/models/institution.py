import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    institution_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    institution_type: Mapped[str] = mapped_column(String(50), nullable=False)  # engineering/medical/arts/pharmacy/management
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active/inactive/suspended
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    programs: Mapped[List["Program"]] = relationship("Program", back_populates="institution", cascade="all, delete-orphan")
    user_roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="institution")
    student_records: Mapped[List["StudentRecord"]] = relationship("StudentRecord", back_populates="institution")
    upload_batches: Mapped[List["UploadBatch"]] = relationship("UploadBatch", back_populates="institution")


class Program(Base):
    __tablename__ = "programs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    institution_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    program_code: Mapped[str] = mapped_column(String(50), nullable=False)
    program_name: Mapped[str] = mapped_column(String(255), nullable=False)
    academic_level: Mapped[str] = mapped_column(String(50), nullable=False)  # ug/pg/diploma/phd
    branch: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_years: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active/inactive
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution: Mapped["Institution"] = relationship("Institution", back_populates="programs")
    intake_limits: Mapped[List["IntakeLimit"]] = relationship("IntakeLimit", back_populates="program", cascade="all, delete-orphan")
    student_records: Mapped[List["StudentRecord"]] = relationship("StudentRecord", back_populates="program")


class IntakeLimit(Base):
    __tablename__ = "intake_limits"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    program_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False, index=True)
    admission_cycle: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # e.g. '2026-27'
    approved_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="total", nullable=False)  # general/obc/sc/st/ews/nri/supernumerary/total
    source_type: Mapped[str] = mapped_column(String(50), default="official", nullable=False)  # official/demonstration/provisional
    source_reference: Mapped[str] = mapped_column(String(100), nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="verified", nullable=False)  # verified/unverified/provisional
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    program: Mapped["Program"] = relationship("Program", back_populates="intake_limits")
