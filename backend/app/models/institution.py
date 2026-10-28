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
    portfolio: Mapped[Optional["InstitutionPortfolio"]] = relationship("InstitutionPortfolio", back_populates="institution", uselist=False, cascade="all, delete-orphan")


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


class InstitutionPortfolio(Base):
    __tablename__ = "institution_portfolios"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    institution_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), unique=True, index=True)

    # NBA Accreditation
    nba_tier: Mapped[str] = mapped_column(String(50), default="Tier-1")
    nba_status: Mapped[str] = mapped_column(String(50), default="Accredited")
    nba_accredited_branches: Mapped[str] = mapped_column(String(500), default="CSE, ECE, EEE, ME, Civil")
    nba_valid_until: Mapped[str] = mapped_column(String(50), default="2028-06-30")
    nba_file_ref: Mapped[str] = mapped_column(String(100), default="NBA/ACCR/2024/AICTE")

    # NAAC Accreditation
    naac_grade: Mapped[str] = mapped_column(String(20), default="A++")
    naac_cgpa: Mapped[str] = mapped_column(String(20), default="3.78")
    naac_cycle: Mapped[str] = mapped_column(String(50), default="Cycle 3")
    naac_valid_until: Mapped[str] = mapped_column(String(50), default="2028-11-30")

    # Complaints & Grievances Desk
    complaints_total: Mapped[int] = mapped_column(Integer, default=5)
    complaints_resolved: Mapped[int] = mapped_column(Integer, default=4)
    complaints_pending: Mapped[int] = mapped_column(Integer, default=1)
    complaints_summary: Mapped[str] = mapped_column(String(500), default="Hostel maintenance grievance resolved; academic and anti-ragging compliance 100% satisfactory.")

    # Intake Approval Details
    eoa_reference: Mapped[str] = mapped_column(String(100), default="AICTE/EOA/2026-27/F.No-1-9328471")
    new_intake_applied: Mapped[int] = mapped_column(Integer, default=60)
    new_intake_branch: Mapped[str] = mapped_column(String(100), default="B.Tech Artificial Intelligence & Data Science")
    new_intake_status: Mapped[str] = mapped_column(String(50), default="Approved")  # Approved / Under Inspection / Pending State NOC
    new_intake_remarks: Mapped[str] = mapped_column(String(500), default="Approved by AICTE Scrutiny Committee for AY 2026-27 intake expansion.")

    # Division of seats among categories (Percentages)
    seat_division_json: Mapped[str] = mapped_column(String(1000), default='{"general": 40.5, "obc": 27.0, "sc": 15.0, "st": 7.5, "ews": 10.0, "supernumerary": 5.0}')

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institution: Mapped["Institution"] = relationship("Institution", back_populates="portfolio")
