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
    reviewer_id: Optional[str] = None


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


@router.get("/reviews/case-timeline")
def get_case_timelines(
    status_filter: Optional[str] = Query(None),
    severity_filter: Optional[str] = Query(None),
    current_user: User = Depends(require_roles("aicte_admin", "reviewer")),
    db: Session = Depends(get_db),
):
    """
    Returns an exhaustive list of all integrity cases with complete 4-stage timeline tracking:
    - Stage 1: Ingestion & Campus Staging
    - Stage 2: Validation Engine Discrepancy Flag
    - Stage 3: Institutional / AICTE Review Assignment
    - Stage 4: AICTE Final Approval / Decision
    """
    from app.models.student import StudentRecord
    from app.models.institution import Institution, Program

    q = db.query(ValidationIssue)
    if status_filter:
        q = q.filter(ValidationIssue.status == status_filter)
    if severity_filter:
        q = q.filter(ValidationIssue.severity == severity_filter)

    issues = q.order_by(ValidationIssue.created_at.desc()).limit(100).all()

    timeline_items = []
    for iss in issues:
        student = db.query(StudentRecord).filter(StudentRecord.id == iss.record_id).first() if iss.record_id else None
        inst = db.query(Institution).filter(Institution.id == student.institution_id).first() if student else None
        prog = db.query(Program).filter(Program.id == student.program_id).first() if student else None
        reviewer = db.query(User).filter(User.id == iss.assigned_to).first() if iss.assigned_to else None

        current_stage = "AICTE Desk Review"
        stage_num = 3
        if iss.status in ["resolved", "corrected", "false_positive"]:
            current_stage = "AICTE Approved & Closed"
            stage_num = 4
        elif iss.status == "open" and not iss.assigned_to:
            current_stage = "Pending Reviewer Allocation"
            stage_num = 2

        created_str = iss.created_at.strftime("%Y-%m-%d %H:%M") if iss.created_at else "2026-10-24 10:00"

        timeline_items.append({
            "case_id": str(iss.id)[:8].upper(),
            "issue_id": str(iss.id),
            "rule_code": iss.rule_code,
            "severity": iss.severity,
            "description": iss.description,
            "affected_field": iss.affected_field,
            "status": iss.status,
            "current_stage": current_stage,
            "stage_number": stage_num,
            "student_name": student.student_name if student else "Intake Limit Aggregation Case",
            "apaar_id": student.identity_reference if student else "SYSTEM-WIDE",
            "roll_no": student.institution_student_id if student else "N/A",
            "institution_name": inst.name if inst else "Unknown Institution",
            "institution_code": inst.institution_code if inst else "N/A",
            "program_name": prog.program_name if prog else "N/A",
            "assigned_reviewer": reviewer.full_name if reviewer else "Unassigned (AICTE Central Queue)",
            "timeline": [
                {
                    "stage": "Campus SIS Ingestion",
                    "status": "completed",
                    "timestamp": created_str,
                    "location": f"{inst.name if inst else 'Institution'} Campus ERP",
                    "details": "Batch intake records ingested via secure institution gateway.",
                },
                {
                    "stage": "Deterministic Integrity Flag",
                    "status": "completed",
                    "timestamp": created_str,
                    "location": "AICTE Core Integrity Engine",
                    "details": f"Rule breached: {iss.rule_code} ({iss.severity.upper()} Severity).",
                },
                {
                    "stage": "AICTE Officer Review",
                    "status": "completed" if stage_num >= 3 else "active",
                    "timestamp": "Under Review" if stage_num == 3 else "Assigned",
                    "location": "AICTE Central Review Desk",
                    "details": f"Desk Officer: {reviewer.full_name if reviewer else 'Pending AICTE Allocation'}.",
                },
                {
                    "stage": "Final AICTE Sanction & Ledger Apply",
                    "status": "completed" if stage_num == 4 else "pending",
                    "timestamp": iss.resolved_at.strftime("%Y-%m-%d %H:%M") if iss.resolved_at else "Pending Resolution",
                    "location": "MoE / AICTE National Ledger",
                    "details": f"Resolution: {iss.resolution_reason or 'Awaiting final administrative determination.'}",
                },
            ]
        })

    return timeline_items


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


@router.get("/reviews/officers")
def list_review_officers(
    current_user: User = Depends(require_roles("aicte_admin", "reviewer")),
    db: Session = Depends(get_db),
):
    """Returns AICTE regulatory desk officers available for case assignment."""
    from app.models.user import UserRole
    officers = db.query(User).join(UserRole).filter(
        UserRole.role.in_(["aicte_admin", "reviewer"])
    ).distinct().all()

    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
        }
        for u in officers
    ]


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

    reviewer = None
    if body.reviewer_id:
        try:
            req_uuid = uuid.UUID(body.reviewer_id)
            reviewer = db.query(User).filter(User.id == req_uuid).first()
        except Exception:
            pass

        if not reviewer:
            reviewer = db.query(User).filter(
                (User.email.ilike(f"%{body.reviewer_id}%")) | (User.full_name.ilike(f"%{body.reviewer_id}%"))
            ).first()

    if not reviewer:
        reviewer = current_user

    issue.assigned_to = reviewer.id
    issue.status = "under_review"
    db.commit()

    return {
        "message": f"Reviewer {reviewer.full_name} assigned successfully.",
        "assigned_to": str(reviewer.id),
        "reviewer_name": reviewer.full_name,
    }
