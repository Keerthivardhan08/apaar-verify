import uuid
from datetime import datetime, timezone
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
from app.services.audit import log_event

router = APIRouter()


class RunValidationRequest(BaseModel):
    institution_id: Optional[str] = None
    admission_cycle: Optional[str] = None
    record_id: Optional[str] = None


class ResolveIssueRequest(BaseModel):
    resolution_reason: str
    action: Optional[str] = "resolved"  # "resolved", "false_positive", "exception_approved"


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


@router.post("/issues/{issue_id}/resolve")
def resolve_issue(
    issue_id: uuid.UUID,
    body: ResolveIssueRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    issue = db.query(ValidationIssue).filter(ValidationIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Validation issue not found.")

    if issue.record_id:
        record = db.query(StudentRecord).filter(StudentRecord.id == issue.record_id).first()
        if record:
            require_institution_access(record.institution_id, current_user)

    now = datetime.now(timezone.utc)
    target_status = "false_positive" if body.action == "false_positive" else "resolved"
    issue.status = target_status
    issue.resolved_at = now
    issue.resolved_by = current_user.id
    issue.resolution_reason = body.resolution_reason

    # Check remaining open high/critical issues on the student record
    if issue.record_id:
        record = db.query(StudentRecord).filter(StudentRecord.id == issue.record_id).first()
        if record and record.record_status == "flagged":
            open_critical_count = (
                db.query(ValidationIssue)
                .filter(
                    ValidationIssue.record_id == record.id,
                    ValidationIssue.severity.in_(["high", "critical"]),
                    ValidationIssue.status.in_(["open", "under_review", "reopened"]),
                )
                .count()
            )
            if open_critical_count == 0:
                record.record_status = "submitted"
                record.updated_at = now

    log_event(
        db=db,
        action="issue.resolve",
        target_type="validation_issue",
        target_id=str(issue.id),
        outcome="success",
        actor_id=current_user.id,
        metadata={
            "rule_code": issue.rule_code,
            "resolution_reason": body.resolution_reason,
            "status": target_status,
            "record_id": str(issue.record_id) if issue.record_id else None,
        },
    )

    db.commit()
    db.refresh(issue)

    return {
        "id": str(issue.id),
        "status": issue.status,
        "resolved_at": issue.resolved_at.isoformat() if issue.resolved_at else None,
        "resolution_reason": issue.resolution_reason,
        "record_id": str(issue.record_id) if issue.record_id else None,
        "message": f"Issue {issue.rule_code} marked as {issue.status} successfully."
    }


@router.post("/issues/{issue_id}/reopen")
def reopen_issue(
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    issue = db.query(ValidationIssue).filter(ValidationIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Validation issue not found.")

    if issue.record_id:
        record = db.query(StudentRecord).filter(StudentRecord.id == issue.record_id).first()
        if record:
            require_institution_access(record.institution_id, current_user)

    issue.status = "open"
    issue.resolved_at = None
    issue.resolved_by = None
    issue.resolution_reason = None

    if issue.record_id:
        record = db.query(StudentRecord).filter(StudentRecord.id == issue.record_id).first()
        if record and issue.severity in ("high", "critical"):
            record.record_status = "flagged"

    db.commit()
    return {"id": str(issue.id), "status": "open", "message": "Issue reopened successfully."}


@router.get("/validation/record/{record_id}/status")
def get_record_compliance_status(
    record_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Real-time compliance status and active vs resolved flags for a student record."""
    record = db.query(StudentRecord).filter(StudentRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    require_institution_access(record.institution_id, current_user)

    all_issues = db.query(ValidationIssue).filter(ValidationIssue.record_id == record_id).order_by(ValidationIssue.created_at.desc()).all()
    active_issues = [i for i in all_issues if i.status in ("open", "under_review", "reopened")]
    resolved_issues = [i for i in all_issues if i.status in ("resolved", "false_positive")]

    return {
        "record_id": str(record.id),
        "student_name": record.student_name,
        "record_status": record.record_status,
        "identity_verification_status": record.identity_verification_status,
        "total_issues": len(all_issues),
        "active_issues_count": len(active_issues),
        "resolved_issues_count": len(resolved_issues),
        "active_issues": [
            {
                "id": str(i.id),
                "rule_code": i.rule_code,
                "severity": i.severity,
                "description": i.description,
                "affected_field": i.affected_field,
                "expected_condition": i.expected_condition,
                "observed_condition": i.observed_condition,
                "status": i.status,
                "created_at": i.created_at.isoformat(),
            }
            for i in active_issues
        ],
        "resolved_issues": [
            {
                "id": str(i.id),
                "rule_code": i.rule_code,
                "severity": i.severity,
                "description": i.description,
                "affected_field": i.affected_field,
                "status": i.status,
                "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
                "resolution_reason": i.resolution_reason,
            }
            for i in resolved_issues
        ],
        "synced_at": datetime.now(timezone.utc).isoformat(),
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
        db.refresh(record)

        active_count = len([i for i in issues if i.status in ("open", "under_review", "reopened")])
        return {
            "processed_records": 1,
            "issues_found": active_count,
            "record_status": record.record_status,
            "message": f"Real-time validation completed: {active_count} active issue(s) detected.",
            "synced_at": datetime.now(timezone.utc).isoformat(),
        }

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
        total_issues += len([i for i in issues if i.status in ("open", "under_review", "reopened")])

    db.commit()
    return {
        "processed_records": len(records),
        "issues_found": total_issues,
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/validation/nine-rules", summary="List All 9 Rules with Severity Tagging & Assigned Departments")
def get_nine_rules_with_department_assignment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the 9 core deterministic validation rules of the APAAR Integrity Engine,
    annotated with their regulatory Severity Tag (critical, high, medium, low),
    and their Automatic Regulatory Assigned Department in case of any conflicts (e.g. intake problems).
    """
    from app.services.trend_analytics import get_model_performance_evaluation
    perf = get_model_performance_evaluation(db)
    return perf.get("rule_performance", [])

