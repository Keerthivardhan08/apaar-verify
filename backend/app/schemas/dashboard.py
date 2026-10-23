from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class DashboardSummaryOut(BaseModel):
    total_institutions: int
    institutions_with_submissions: int
    total_records: int
    valid_records: int
    flagged_records: int
    pending_review: int
    unresolved_high_severity: int
    submission_completion_pct: float
    identity_verification_distribution: Dict[str, int]
    record_status_distribution: Dict[str, int]
    scope: Dict[str, Any]
    disclaimer: str


class IntakeDashboardItem(BaseModel):
    program_id: str
    program_code: str
    program_name: str
    institution_id: str
    institution_name: str
    admission_cycle: str
    approved_capacity: Optional[int] = None
    source_type: Optional[str] = None
    source_reference: Optional[str] = None
    enrolled_count: int
    utilization_pct: Optional[float] = None
    status: str


class IntakeDashboardOut(BaseModel):
    programs: List[IntakeDashboardItem]
    total_programs: int
    programs_exceeded: int
    programs_data_unavailable: int
