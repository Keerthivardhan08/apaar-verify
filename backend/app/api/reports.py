import io
import csv
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user, get_user_roles, get_user_institution_ids
from app.models.user import User
from app.models.student import StudentRecord
from app.models.validation import ValidationIssue
from app.models.institution import Institution, Program, IntakeLimit
from app.services.csv_processor import sanitize_row_for_export

router = APIRouter()


@router.get("/reports/enrolment")
def download_enrolment_report(
    institution_id: Optional[str] = Query(None),
    cycle: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roles = get_user_roles(current_user)
    q = db.query(StudentRecord)

    if "aicte_admin" in roles or "reviewer" in roles:
        if institution_id:
            q = q.filter(StudentRecord.institution_id == uuid.UUID(institution_id))
    else:
        inst_ids = get_user_institution_ids(current_user)
        q = q.filter(StudentRecord.institution_id.in_(inst_ids))

    if cycle:
        q = q.filter(StudentRecord.admission_cycle == cycle)

    records = q.all()

    output = io.StringIO()
    fieldnames = [
        "student_id",
        "student_name",
        "admission_cycle",
        "admission_category",
        "admission_status",
        "nri_category",
        "oci_status",
        "foreign_national_status",
        "supernumerary_category",
        "record_status",
        "identity_verification_status",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
    writer.writeheader()

    for r in records:
        row = {
            "student_id": r.institution_student_id,
            "student_name": r.student_name,
            "admission_cycle": r.admission_cycle,
            "admission_category": r.admission_category,
            "admission_status": r.admission_status,
            "nri_category": r.nri_category,
            "oci_status": r.oci_status,
            "foreign_national_status": r.foreign_national_status,
            "supernumerary_category": r.supernumerary_category,
            "record_status": r.record_status,
            "identity_verification_status": r.identity_verification_status,
        }
        writer.writerow(sanitize_row_for_export(row))

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=enrolment_report.csv"},
    )


@router.get("/reports/integrity")
def download_integrity_report(
    institution_id: Optional[str] = Query(None),
    cycle: Optional[str] = Query(None),
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

    if cycle:
        q = q.filter(StudentRecord.admission_cycle == cycle)

    issues = q.all()

    output = io.StringIO()
    fieldnames = [
        "issue_id",
        "rule_code",
        "severity",
        "description",
        "affected_field",
        "status",
        "created_at",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
    writer.writeheader()

    for i in issues:
        row = {
            "issue_id": str(i.id),
            "rule_code": i.rule_code,
            "severity": i.severity,
            "description": i.description,
            "affected_field": i.affected_field or "",
            "status": i.status,
            "created_at": i.created_at.isoformat(),
        }
        writer.writerow(sanitize_row_for_export(row))

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=integrity_report.csv"},
    )


@router.get("/reports/submission-summary")
def get_submission_summary(
    cycle: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    institutions = db.query(Institution).filter(Institution.status == "active").all()
    results = []

    for inst in institutions:
        q = db.query(StudentRecord).filter(StudentRecord.institution_id == inst.id)
        if cycle:
            q = q.filter(StudentRecord.admission_cycle == cycle)

        total = q.count()
        valid = q.filter(StudentRecord.record_status.in_(["accepted", "submitted"])).count()
        flagged = q.filter(StudentRecord.record_status.in_(["flagged", "under_review"])).count()

        results.append({
            "institution_code": inst.institution_code,
            "institution_name": inst.name,
            "total_submitted": total,
            "valid_records": valid,
            "flagged_records": flagged,
            "submission_status": "Completed" if total > 0 else "Pending",
        })

    return {"summary": results, "total_institutions": len(results)}
