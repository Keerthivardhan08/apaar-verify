"""Dashboard API — aggregated metrics from database queries (never hardcoded)."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.database import get_db
from app.core.permissions import get_current_user, require_institution_access, get_user_roles, get_user_institution_ids
from app.models.user import User
from app.models.student import StudentRecord
from app.models.institution import Institution, Program, IntakeLimit
from app.models.validation import ValidationIssue
from app.models.upload import UploadBatch

router = APIRouter()


def _resolve_institution_scope(current_user: User, institution_id: Optional[str]) -> Optional[uuid.UUID]:
    """Resolve the effective institution scope for the current user."""
    user_roles = get_user_roles(current_user)
    if "aicte_admin" in user_roles or "reviewer" in user_roles:
        return uuid.UUID(institution_id) if institution_id else None
    # Institution-scoped users can only see their own data
    ids = get_user_institution_ids(current_user)
    return ids[0] if ids else None


@router.get("/dashboard/summary")
def get_dashboard_summary(
    institution_id: Optional[str] = Query(None),
    cycle: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Aggregated dashboard metrics. ALL figures come from database queries.
    No hardcoded or demonstration numbers are returned as live operational data.
    """
    scope_institution_id = _resolve_institution_scope(current_user, institution_id)

    # Base query filters
    record_q = db.query(StudentRecord)
    if scope_institution_id:
        record_q = record_q.filter(StudentRecord.institution_id == scope_institution_id)
    if cycle:
        record_q = record_q.filter(StudentRecord.admission_cycle == cycle)

    total_records = record_q.count()

    # Count by record_status
    status_counts = {}
    for status_val in ["submitted", "accepted", "flagged", "under_review", "correction_requested", "corrected", "rejected", "draft"]:
        status_counts[status_val] = record_q.filter(StudentRecord.record_status == status_val).count()

    valid_records = status_counts.get("accepted", 0) + status_counts.get("submitted", 0)
    flagged_records = status_counts.get("flagged", 0) + status_counts.get("under_review", 0)

    # Issues
    issue_q = db.query(ValidationIssue)
    if scope_institution_id:
        issue_q = issue_q.join(StudentRecord, ValidationIssue.record_id == StudentRecord.id)\
            .filter(StudentRecord.institution_id == scope_institution_id)
    if cycle:
        issue_q = issue_q.join(StudentRecord, ValidationIssue.record_id == StudentRecord.id)\
            .filter(StudentRecord.admission_cycle == cycle)

    pending_review = issue_q.filter(ValidationIssue.status.in_(["open", "under_review", "reopened"])).count()
    unresolved_high = issue_q.filter(
        ValidationIssue.status.in_(["open", "under_review", "reopened"]),
        ValidationIssue.severity.in_(["high", "critical"]),
    ).count()

    # Institutions (for aicte_admin)
    inst_q = db.query(Institution)
    total_institutions = inst_q.count() if not scope_institution_id else 1

    # Submission completion
    institutions_with_submissions = db.query(UploadBatch.institution_id).filter(
        UploadBatch.status.in_(["completed", "completed_with_errors"])
    ).distinct().count()

    submission_completion_pct = (
        round((institutions_with_submissions / total_institutions * 100), 1)
        if total_institutions > 0 else 0.0
    )

    # Identity verification distribution
    id_verif_dist = {}
    for verif_status in ["unverified", "pending", "mock_verified", "verified", "failed", "unavailable"]:
        id_verif_dist[verif_status] = record_q.filter(
            StudentRecord.identity_verification_status == verif_status
        ).count()

    return {
        "total_institutions": total_institutions,
        "institutions_with_submissions": institutions_with_submissions,
        "total_records": total_records,
        "valid_records": valid_records,
        "flagged_records": flagged_records,
        "pending_review": pending_review,
        "unresolved_high_severity": unresolved_high,
        "submission_completion_pct": submission_completion_pct,
        "identity_verification_distribution": id_verif_dist,
        "record_status_distribution": status_counts,
        "scope": {
            "institution_id": str(scope_institution_id) if scope_institution_id else None,
            "cycle": cycle,
        },
        "disclaimer": "All metrics derived from database queries over synthetic demonstration data.",
    }


@router.get("/dashboard/intake")
def get_intake_dashboard(
    institution_id: Optional[str] = Query(None),
    cycle: Optional[str] = Query(None, description="e.g. 2026-27"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Intake monitoring — enrolled vs approved capacity per program."""
    scope_institution_id = _resolve_institution_scope(current_user, institution_id)

    program_q = db.query(Program)
    if scope_institution_id:
        program_q = program_q.filter(Program.institution_id == scope_institution_id)

    programs = program_q.filter(Program.status == "active").all()
    results = []

    for prog in programs:
        intake_q = db.query(IntakeLimit).filter(
            IntakeLimit.program_id == prog.id,
            IntakeLimit.category == "total",
        )
        if cycle:
            intake_q = intake_q.filter(IntakeLimit.admission_cycle == cycle)
        intake = intake_q.first()

        enrolled_q = db.query(StudentRecord).filter(
            StudentRecord.program_id == prog.id,
            StudentRecord.record_status.in_(["submitted", "accepted", "flagged", "under_review", "corrected"]),
        )
        if cycle:
            enrolled_q = enrolled_q.filter(StudentRecord.admission_cycle == cycle)
        enrolled_count = enrolled_q.count()

        institution = db.query(Institution).filter(Institution.id == prog.institution_id).first()

        if intake:
            utilization_pct = (
                round((enrolled_count / intake.approved_capacity * 100), 1)
                if intake.approved_capacity > 0 else 0.0
            )
            status = (
                "exceeded" if enrolled_count > intake.approved_capacity
                else "at_risk" if utilization_pct >= 80
                else "normal"
            )
        else:
            utilization_pct = None
            status = "data_unavailable"

        results.append({
            "program_id": str(prog.id),
            "program_code": prog.program_code,
            "program_name": prog.program_name,
            "institution_id": str(prog.institution_id),
            "institution_name": institution.name if institution else "Unknown",
            "admission_cycle": cycle or "all",
            "approved_capacity": intake.approved_capacity if intake else None,
            "source_type": intake.source_type if intake else None,
            "source_reference": intake.source_reference if intake else None,
            "enrolled_count": enrolled_count,
            "utilization_pct": utilization_pct,
            "status": status,
        })

    return {
        "programs": results,
        "total_programs": len(results),
        "programs_exceeded": sum(1 for r in results if r["status"] == "exceeded"),
        "programs_data_unavailable": sum(1 for r in results if r["status"] == "data_unavailable"),
    }


@router.get("/dashboard/data-quality")
def get_data_quality(
    institution_id: Optional[str] = Query(None),
    cycle: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Data quality metrics — issue rates and trends."""
    scope_institution_id = _resolve_institution_scope(current_user, institution_id)

    issue_q = db.query(ValidationIssue)
    if scope_institution_id:
        issue_q = issue_q.join(StudentRecord, ValidationIssue.record_id == StudentRecord.id)\
            .filter(StudentRecord.institution_id == scope_institution_id)

    # Issue counts by rule_code
    rule_counts = {}
    for rule in [
        "REQUIRED_FIELD_MISSING", "APAAR_FORMAT_INVALID", "APAAR_NOT_VERIFIED",
        "DUPLICATE_LOCAL_RECORD", "POTENTIAL_CROSS_INSTITUTION_DUPLICATE",
        "INTAKE_EXCEEDED", "CATEGORY_INCONSISTENCY", "APPROVAL_DATA_MISSING",
        "UNUSUAL_UPDATE_PATTERN"
    ]:
        rule_counts[rule] = issue_q.filter(ValidationIssue.rule_code == rule).count()

    # Severity distribution
    severity_dist = {}
    for sev in ["info", "warning", "high", "critical"]:
        severity_dist[sev] = issue_q.filter(ValidationIssue.severity == sev).count()

    total_issues = issue_q.count()
    open_issues = issue_q.filter(ValidationIssue.status.in_(["open", "under_review", "reopened"])).count()
    resolved_issues = issue_q.filter(ValidationIssue.status.in_(["resolved", "false_positive"])).count()

    # Upload batch stats
    batch_q = db.query(UploadBatch)
    if scope_institution_id:
        batch_q = batch_q.filter(UploadBatch.institution_id == scope_institution_id)
    failed_batches = batch_q.filter(UploadBatch.status.in_(["validation_failed", "failed"])).count()
    total_batches = batch_q.count()

    return {
        "total_issues": total_issues,
        "open_issues": open_issues,
        "resolved_issues": resolved_issues,
        "issues_by_rule": rule_counts,
        "issues_by_severity": severity_dist,
        "failed_uploads": failed_batches,
        "total_uploads": total_batches,
        "resolution_rate_pct": (
            round((resolved_issues / total_issues * 100), 1) if total_issues > 0 else 0.0
        ),
    }


@router.get("/dashboard/institutions")
def get_institutions_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AICTE-only: per-institution overview metrics."""
    user_roles = get_user_roles(current_user)
    if "aicte_admin" not in user_roles and "reviewer" not in user_roles:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="AICTE role required.")

    institutions = db.query(Institution).filter(Institution.status == "active").all()
    results = []
    for inst in institutions:
        total_records = db.query(StudentRecord).filter(StudentRecord.institution_id == inst.id).count()
        open_issues = (
            db.query(ValidationIssue)
            .join(StudentRecord, ValidationIssue.record_id == StudentRecord.id)
            .filter(
                StudentRecord.institution_id == inst.id,
                ValidationIssue.status.in_(["open", "under_review", "reopened"]),
            )
            .count()
        )
        results.append({
            "institution_id": str(inst.id),
            "institution_code": inst.institution_code,
            "name": inst.name,
            "institution_type": inst.institution_type,
            "state": inst.state,
            "status": inst.status,
            "total_records": total_records,
            "open_issues": open_issues,
        })

    return {"institutions": results, "total": len(results)}
