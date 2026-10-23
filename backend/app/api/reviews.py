import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.user import User
from app.models.student import StudentRecord
from app.models.validation import ValidationIssue, ReviewDecision
from app.services.audit import log_event

router = APIRouter()


class ReviewDecisionRequest(BaseModel):
    decision: str  # confirmed_discrepancy/corrected/legitimate_exception/duplicate_confirmed/false_positive/unresolved
    reason: str
    evidence_reference: Optional[dict] = None


class AssignReviewerRequest(BaseModel):
    reviewer_id: uuid.UUID


@router.get("/reviews")
def list_review_cases(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles("aicte_admin", "reviewer")),
    db: Session = Depends(get_db),
):
    q = db.query(ValidationIssue)
    if status:
        q = q.filter(ValidationIssue.status == status)
    else:
        q = q.filter(ValidationIssue.status.in_(["open", "under_review", "reopened"]))

    if severity:
        q = q.filter(ValidationIssue.severity == severity)

    total = q.count()
    issues = q.order_by(ValidationIssue.created_at.desc()).offset((page - 1) * size).limit(size).all()

    return {
        "items": [
            {
                "id": str(i.id),
                "record_id": str(i.record_id) if i.record_id else None,
                "rule_code": i.rule_code,
                "severity": i.severity,
                "description": i.description,
                "status": i.status,
                "assigned_to": str(i.assigned_to) if i.assigned_to else None,
                "created_at": i.created_at.isoformat(),
            }
            for i in issues
        ],
        "total": total,
        "page": page,
        "size": size,
    }


@router.post("/reviews/{issue_id}/decision")
def make_review_decision(
    issue_id: uuid.UUID,
    body: ReviewDecisionRequest,
    current_user: User = Depends(require_roles("aicte_admin", "reviewer")),
    db: Session = Depends(get_db),
):
    issue = db.query(ValidationIssue).filter(ValidationIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Validation issue not found.")

    decision_record = ReviewDecision(
        id=uuid.uuid4(),
        issue_id=issue.id,
        reviewer_id=current_user.id,
        decision=body.decision,
        reason=body.reason,
        evidence_reference=body.evidence_reference,
        created_at=datetime.now(timezone.utc),
    )
    db.add(decision_record)

    # Update issue status based on decision
    if body.decision in ["corrected", "legitimate_exception", "false_positive"]:
        issue.status = "resolved" if body.decision != "false_positive" else "false_positive"
        issue.resolved_at = datetime.now(timezone.utc)
        issue.resolution_reason = body.reason
        issue.resolved_by = current_user.id
    else:
        issue.status = "under_review"

    log_event(
        db=db,
        action="review.decision_made",
        target_type="validation_issue",
        target_id=str(issue.id),
        outcome="success",
        actor_id=current_user.id,
        metadata={"decision": body.decision, "reason": body.reason},
    )
    db.commit()

    return {
        "message": "Review decision recorded successfully.",
        "decision_id": str(decision_record.id),
        "issue_status": issue.status,
    }


@router.post("/reviews/{issue_id}/assign")
def assign_reviewer(
    issue_id: uuid.UUID,
    body: AssignReviewerRequest,
    current_user: User = Depends(require_roles("aicte_admin", "reviewer")),
    db: Session = Depends(get_db),
):
    issue = db.query(ValidationIssue).filter(ValidationIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")

    reviewer = db.query(User).filter(User.id == body.reviewer_id).first()
    if not reviewer:
        raise HTTPException(status_code=404, detail="Assignee user not found.")

    issue.assigned_to = reviewer.id
    issue.status = "under_review"
    db.commit()

    return {"message": "Reviewer assigned successfully.", "assigned_to": str(reviewer.id)}
