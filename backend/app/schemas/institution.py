import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class InstitutionBase(BaseModel):
    institution_code: str
    name: str
    institution_type: str
    state: str
    city: str
    status: str = "active"


class InstitutionCreate(InstitutionBase):
    pass


class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    institution_type: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    status: Optional[str] = None


class InstitutionOut(InstitutionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    total_programs: Optional[int] = None
    total_approved_intake: Optional[int] = None
    total_enrolled: Optional[int] = None
    naac_grade: Optional[str] = None
    nba_status: Optional[str] = None
    pending_complaints: Optional[int] = None
    new_intake_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class InstitutionPortfolioOut(BaseModel):
    institution_id: uuid.UUID
    institution_name: str
    institution_code: str
    institution_type: str
    city: str
    state: str
    status: str

    # NBA Accreditation
    nba_tier: str
    nba_status: str
    nba_accredited_branches: str
    nba_valid_until: str
    nba_file_ref: str

    # NAAC Accreditation
    naac_grade: str
    naac_cgpa: str
    naac_cycle: str
    naac_valid_until: str

    # Complaints & Grievance Governance
    complaints_total: int
    complaints_resolved: int
    complaints_pending: int
    complaints_summary: str
    complaints_resolution_rate: float

    # Intake & Expansion Approvals
    eoa_reference: str
    total_approved_intake: int
    total_enrolled: int
    utilization_pct: float
    vacant_seats: int
    new_intake_applied: int
    new_intake_branch: str
    new_intake_status: str
    new_intake_remarks: str

    # Division of seats among categories
    category_quotas: dict
    category_distribution: dict

    # Branch-by-branch analytical comparison
    programs: List[dict]

    model_config = ConfigDict(from_attributes=True)


class InstitutionStatsOut(BaseModel):
    institution_id: uuid.UUID
    institution_name: str
    total_programs: int
    total_students: int
    active_students: int
    open_issues: int
    high_critical_issues: int
    batches_count: int


class ProgramBase(BaseModel):
    program_code: str
    program_name: str
    academic_level: str
    branch: str
    duration_years: int
    status: str = "active"


class ProgramCreate(ProgramBase):
    institution_id: uuid.UUID


class ProgramOut(ProgramBase):
    id: uuid.UUID
    institution_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IntakeLimitBase(BaseModel):
    program_id: uuid.UUID
    admission_cycle: str
    approved_capacity: int
    category: str = "total"
    source_type: str = "official"
    source_reference: str
    effective_from: date
    effective_to: Optional[date] = None
    verification_status: str = "verified"


class IntakeLimitCreate(IntakeLimitBase):
    pass


class IntakeLimitOut(IntakeLimitBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
