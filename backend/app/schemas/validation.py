import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict


class ValidationIssueOut(BaseModel):
    id: uuid.UUID
    record_id: Optional[uuid.UUID] = None
    batch_id: Optional[uuid.UUID] = None
    rule_code: str
    severity: str
    description: str
    affected_field: Optional[str] = None
    expected_condition: Optional[str] = None
    observed_condition: Optional[str] = None
    evidence_reference: Optional[Dict[str, Any]] = None
    status: str
    assigned_to: Optional[uuid.UUID] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_reason: Optional[str] = None
    resolved_by: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewDecisionCreate(BaseModel):
    decision: str  # confirmed_discrepancy/corrected/legitimate_exception/duplicate_confirmed/false_positive/unresolved
    reason: str
    evidence_reference: Optional[Dict[str, Any]] = None


class ReviewDecisionOut(BaseModel):
    id: uuid.UUID
    issue_id: uuid.UUID
    reviewer_id: uuid.UUID
    decision: str
    reason: str
    evidence_reference: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssignIssueRequest(BaseModel):
    assigned_to: uuid.UUID


class RunValidationRequest(BaseModel):
    record_id: uuid.UUID
