"""
Multi-Stage Expanded Correction Reconciliation API Router.

Workflow Lifecycle:
1. Operator submits correction proposal (stage: operator_draft).
2. Institution Administrator reviews and signs off (stage: inst_admin_approved).
3. AICTE Reviewer performs final regulatory adjudication (stage: aicte_verified),
   atomically updating the student record and recording a version diff snapshot.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user, require_institution_access
from app.models.user import User
from app.models.student import StudentRecord, StudentRecordVersion
from app.models.correction_workflow import ExpandedCorrectionWorkflow
from app.services.audit import log_event

router = APIRouter(prefix="/corrections-workflow", tags=["Expanded Correction Reconciliation"])


def now_utc():
    return datetime.now(timezone.utc)


class SubmitCorrectionProposalRequest(BaseModel):
    record_id: uuid.UUID
    field_name: str
    proposed_value: str
    operator_notes: str


class InstitutionAdminDecisionRequest(BaseModel):
    decision: str  # approve / reject
    notes: str


class RegulatoryDecisionRequest(BaseModel):
    decision: str  # approve / reject
    notes: str


@router.post("/submit", status_code=status.HTTP_201_CREATED, summary="Operator Submits Correction Proposal")
def submit_correction_proposal(
    body: SubmitCorrectionProposalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initiates an expanded multi-stage correction workflow for a student record."""
    student = db.query(StudentRecord).filter(StudentRecord.id == body.record_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    require_institution_access(student.institution_id, current_user)

    orig_val = str(getattr(student, body.field_name, ""))

    workflow = ExpandedCorrectionWorkflow(
        id=uuid.uuid4(),
        record_id=student.id,
        institution_id=student.institution_id,
        stage="operator_draft",
        workflow_status="pending_institution_admin",
        field_name=body.field_name,
        original_value=orig_val,
        proposed_value=body.proposed_value,
        operator_notes=body.operator_notes,
    )
    db.add(workflow)

    # Mark student record status
    student.record_status = "correction_requested"
    db.commit()

    return {
        "workflow_id": str(workflow.id),
        "stage": workflow.stage,
        "workflow_status": workflow.workflow_status,
        "field_name": workflow.field_name,
        "original_value": workflow.original_value,
        "proposed_value": workflow.proposed_value,
        "created_at": workflow.created_at.isoformat(),
    }


@router.post("/{workflow_id}/institution-action", summary="Institution Admin Review")
def institution_admin_action(
    workflow_id: uuid.UUID,
    body: InstitutionAdminDecisionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Institutional Administrator approves or rejects the proposed correction before escalating to AICTE."""
    wf = db.query(ExpandedCorrectionWorkflow).filter(ExpandedCorrectionWorkflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Correction workflow not found")

    require_institution_access(wf.institution_id, current_user)

    wf.inst_admin_id = current_user.id
    wf.inst_admin_notes = body.notes
    wf.inst_admin_decided_at = now_utc()

    if body.decision.lower() == "approve":
        wf.stage = "inst_admin_approved"
        wf.workflow_status = "pending_aicte_review"
    else:
        wf.stage = "rejected"
        wf.workflow_status = "rejected"

    db.commit()

    return {
        "workflow_id": str(wf.id),
        "stage": wf.stage,
        "workflow_status": wf.workflow_status,
        "inst_admin_notes": wf.inst_admin_notes,
    }


@router.post("/{workflow_id}/aicte-action", summary="AICTE Regulatory Adjudication")
def aicte_reviewer_action(
    workflow_id: uuid.UUID,
    body: RegulatoryDecisionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AICTE Reviewer gives final regulatory determination.
    If approved, automatically mutates student record and preserves immutable version diff.
    """
    is_reviewer = any(r.role in ("aicte_admin", "reviewer") for r in current_user.roles)
    if not is_reviewer:
        raise HTTPException(status_code=403, detail="Only AICTE Admins or Reviewers can perform this action")

    wf = db.query(ExpandedCorrectionWorkflow).filter(ExpandedCorrectionWorkflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Correction workflow not found")

    wf.aicte_reviewer_id = current_user.id
    wf.aicte_reviewer_notes = body.notes
    wf.aicte_decided_at = now_utc()

    if body.decision.lower() == "approve":
        wf.stage = "aicte_verified"
        wf.workflow_status = "approved_applied"

        # Apply change to student record
        student = db.query(StudentRecord).filter(StudentRecord.id == wf.record_id).first()
        if student and hasattr(student, wf.field_name):
            setattr(student, wf.field_name, wf.proposed_value)
            student.record_status = "corrected"
            student.updated_at = now_utc()
            student.updated_by = current_user.id

            # Create immutable version snapshot
            v_count = db.query(StudentRecordVersion).filter(StudentRecordVersion.record_id == student.id).count()
            version = StudentRecordVersion(
                id=uuid.uuid4(),
                record_id=student.id,
                version_number=v_count + 1,
                snapshot={
                    "field_modified": wf.field_name,
                    "old_value": wf.original_value,
                    "new_value": wf.proposed_value,
                    "adjudicated_by": current_user.email,
                },
                changed_by=current_user.id,
                change_reason=f"Approved under Multi-Stage Workflow {str(wf.id)[:8]}: {body.notes}",
                created_at=now_utc(),
            )
            db.add(version)

            log_event(
                actor_id=current_user.id,
                action="EXPANDED_CORRECTION_APPLIED",
                target_type="student_record",
                target_id=str(student.id),
                outcome="success",
                metadata={"field": wf.field_name, "old": wf.original_value, "new": wf.proposed_value},
                db=db,
            )
    else:
        wf.stage = "rejected"
        wf.workflow_status = "rejected"

    db.commit()

    return {
        "workflow_id": str(wf.id),
        "stage": wf.stage,
        "workflow_status": wf.workflow_status,
        "aicte_reviewer_notes": wf.aicte_reviewer_notes,
    }


@router.get("", summary="List Multi-Stage Correction Workflows")
def list_correction_workflows(
    institution_id: Optional[uuid.UUID] = None,
    stage: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists correction reconciliation workflows with filters."""
    query = db.query(ExpandedCorrectionWorkflow)
    if institution_id:
        require_institution_access(institution_id, current_user)
        query = query.filter(ExpandedCorrectionWorkflow.institution_id == institution_id)
    if stage:
        query = query.filter(ExpandedCorrectionWorkflow.stage == stage)

    workflows = query.order_by(ExpandedCorrectionWorkflow.created_at.desc()).limit(100).all()

    return [
        {
            "id": str(w.id),
            "record_id": str(w.record_id),
            "institution_id": str(w.institution_id),
            "institution_name": w.institution.name if w.institution else "Unknown",
            "stage": w.stage,
            "workflow_status": w.workflow_status,
            "field_name": w.field_name,
            "original_value": w.original_value,
            "proposed_value": w.proposed_value,
            "operator_notes": w.operator_notes,
            "inst_admin_notes": w.inst_admin_notes,
            "aicte_reviewer_notes": w.aicte_reviewer_notes,
            "created_at": w.created_at.isoformat(),
        }
        for w in workflows
    ]
