import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.core.permissions import get_current_user, require_institution_access, get_user_roles, get_user_institution_ids
from app.models.user import User
from app.models.student import StudentRecord
from app.models.validation import ValidationIssue
from app.services.validation import validate_and_persist

router = APIRouter()


class RunValidationRequest(BaseModel):
    institution_id: Optional[str] = None
    admission_cycle: Optional[str] = None
    record_id: Optional[str] = None


@router.get("/issues")
@router.get("/validation/issues")
def list_issues(
    institution_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    rule_code: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = get_user_roles(current_user)
    q = db.query(ValidationIssue).join(StudentRecord, ValidationIssue.record_id == StudentRecord.id)

    if "aicte_admin" in roles or "reviewer" in roles:
        if institution_id:
            q = q.filter(StudentRecord.institution_id == uuid.UUID(institution_id))
    else:
        inst_ids = get_user_institution_ids(current_user)
        q = q.filter(StudentRecord.institution_id.in_(inst_ids))

    if severity:
        q = q.filter(ValidationIssue.severity == severity)
    if status:
        q = q.filter(ValidationIssue.status == status)
    if rule_code:
        q = q.filter(ValidationIssue.rule_code == rule_code)

    total = q.count()
    issues = q.order_by(ValidationIssue.created_at.desc()).offset((page - 1) * size).limit(size).all()

    return {
        "items": [
            {
                "id": str(i.id),
                "record_id": str(i.record_id) if i.record_id else None,
                "batch_id": str(i.batch_id) if i.batch_id else None,
                "rule_code": i.rule_code,
                "severity": i.severity,
                "description": i.description,
                "affected_field": i.affected_field,
                "expected_condition": i.expected_condition,
                "observed_condition": i.observed_condition,
                "status": i.status,
                "assigned_to": str(i.assigned_to) if i.assigned_to else None,
                "created_at": i.created_at.isoformat(),
                "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
                "resolution_reason": i.resolution_reason,
            }
            for i in issues
        ],
        "total": total,
        "page": page,
        "size": size,
    }


@router.get("/issues/{issue_id}")
def get_issue(
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    issue = db.query(ValidationIssue).filter(ValidationIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")

    if issue.record_id:
        record = db.query(StudentRecord).filter(StudentRecord.id == issue.record_id).first()
        if record:
            require_institution_access(record.institution_id, current_user)

    return {
        "id": str(issue.id),
        "record_id": str(issue.record_id) if issue.record_id else None,
        "batch_id": str(issue.batch_id) if issue.batch_id else None,
        "rule_code": issue.rule_code,
        "severity": issue.severity,
        "description": issue.description,
        "affected_field": issue.affected_field,
        "expected_condition": issue.expected_condition,
        "observed_condition": issue.observed_condition,
        "evidence_reference": issue.evidence_reference,
        "status": issue.status,
        "assigned_to": str(issue.assigned_to) if issue.assigned_to else None,
        "created_at": issue.created_at.isoformat(),
        "resolved_at": issue.resolved_at.isoformat() if issue.resolved_at else None,
        "resolution_reason": issue.resolution_reason,
    }


@router.post("/validation/run")
def trigger_validation(
    body: RunValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.record_id:
        record = db.query(StudentRecord).filter(StudentRecord.id == uuid.UUID(body.record_id)).first()
        if not record:
            raise HTTPException(status_code=404, detail="Record not found.")
        require_institution_access(record.institution_id, current_user)
        issues = validate_and_persist(record, db)
        db.commit()
        return {"processed_records": 1, "issues_found": len(issues)}

    # Batch validation for institution
    roles = get_user_roles(current_user)
    q = db.query(StudentRecord)
    if "aicte_admin" in roles or "reviewer" in roles:
        if body.institution_id:
            q = q.filter(StudentRecord.institution_id == uuid.UUID(body.institution_id))
    else:
        inst_ids = get_user_institution_ids(current_user)
        q = q.filter(StudentRecord.institution_id.in_(inst_ids))

    if body.admission_cycle:
        q = q.filter(StudentRecord.admission_cycle == body.admission_cycle)

    records = q.all()
    total_issues = 0
    for r in records:
        issues = validate_and_persist(r, db)
        total_issues += len(issues)

    db.commit()
    return {"processed_records": len(records), "issues_found": total_issues}
