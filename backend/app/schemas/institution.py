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
