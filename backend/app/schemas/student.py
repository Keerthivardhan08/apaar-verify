import uuid
from datetime import datetime, date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class StudentRecordBase(BaseModel):
    institution_id: uuid.UUID
    program_id: uuid.UUID
    admission_cycle: str
    institution_student_id: str
    student_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    admission_category: str
    admission_status: str = "admitted"
    nri_category: str = "not_applicable"
    oci_status: str = "not_applicable"
    foreign_national_status: str = "not_applicable"
    supernumerary_category: str = "none"
    identity_reference: Optional[str] = None


class StudentRecordCreate(StudentRecordBase):
    pass


class StudentRecordUpdate(BaseModel):
    student_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    admission_category: Optional[str] = None
    admission_status: Optional[str] = None
    nri_category: Optional[str] = None
    oci_status: Optional[str] = None
    foreign_national_status: Optional[str] = None
    supernumerary_category: Optional[str] = None
    identity_reference: Optional[str] = None
    record_status: Optional[str] = None
    change_reason: Optional[str] = "Administrative update"


class CorrectionRequestCreate(BaseModel):
    reason: str
    proposed_changes: Dict[str, Any]


class StudentRecordVersionOut(BaseModel):
    id: uuid.UUID
    record_id: uuid.UUID
    version_number: int
    snapshot: Dict[str, Any]
    changed_by: uuid.UUID
    change_reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentRecordOut(BaseModel):
    id: uuid.UUID
    institution_id: uuid.UUID
    program_id: uuid.UUID
    program_name: Optional[str] = None
    program_code: Optional[str] = None
    institution_name: Optional[str] = None
    institution_code: Optional[str] = None
    student_identity_id: Optional[uuid.UUID] = None
    identity_reference: Optional[str] = None
    apaar_id: Optional[str] = None
    masked_identity_reference: Optional[str] = None
    admission_cycle: str
    institution_student_id: str
    student_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    admission_category: str
    admission_status: str
    nri_category: str
    oci_status: str
    foreign_national_status: str
    supernumerary_category: str
    source_batch_id: Optional[uuid.UUID] = None
    record_status: str
    identity_verification_status: str
    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID
    updated_by: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class StudentRecordListOut(BaseModel):
    id: uuid.UUID
    institution_id: uuid.UUID
    program_id: uuid.UUID
    masked_identity_reference: Optional[str] = None
    admission_cycle: str
    institution_student_id: str
    student_name: str
    admission_category: str
    admission_status: str
    record_status: str
    identity_verification_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
