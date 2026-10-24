import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import (
    get_current_user,
    require_institution_access,
    get_user_roles,
    get_user_institution_ids,
)
from app.models.user import User
from app.models.institution import Institution, Program, IntakeLimit
from app.models.student import StudentRecord
from app.models.validation import ValidationIssue
from app.models.upload import UploadBatch
from app.schemas.institution import (
    InstitutionOut,
    InstitutionStatsOut,
    ProgramOut,
    IntakeLimitOut,
)

router = APIRouter()


@router.get("/institutions", response_model=List[InstitutionOut])
def get_institutions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List institutions accessible to the user.
    AICTE admins and reviewers can see all institutions.
    Institution users only see their own assigned institution.
    """
    roles = get_user_roles(current_user)
    if "aicte_admin" in roles or "reviewer" in roles:
        return db.query(Institution).filter(Institution.status == "active").all()

    inst_ids = get_user_institution_ids(current_user)
    if not inst_ids:
        return []
    return db.query(Institution).filter(Institution.id.in_(inst_ids)).all()


@router.get("/institutions/{id}", response_model=InstitutionOut)
def get_institution_by_id(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific institution."""
    require_institution_access(current_user, id)
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
    return inst


@router.get("/institutions/{id}/stats", response_model=InstitutionStatsOut)
def get_institution_stats(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Aggregated stats for an institution.
    Queries database directly — no hardcoded metrics.
    """
    require_institution_access(current_user, id)
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    total_programs = db.query(Program).filter(Program.institution_id == id, Program.status == "active").count()
    total_students = db.query(StudentRecord).filter(StudentRecord.institution_id == id).count()
    active_students = db.query(StudentRecord).filter(
        StudentRecord.institution_id == id,
        StudentRecord.admission_status == "admitted",
        StudentRecord.record_status.in_(["submitted", "accepted", "flagged", "under_review", "corrected"]),
    ).count()

    issue_query = (
        db.query(ValidationIssue)
        .join(StudentRecord, ValidationIssue.record_id == StudentRecord.id)
        .filter(StudentRecord.institution_id == id)
    )
    open_issues = issue_query.filter(ValidationIssue.status.in_(["open", "under_review", "reopened"])).count()
    high_critical_issues = issue_query.filter(
        ValidationIssue.status.in_(["open", "under_review", "reopened"]),
        ValidationIssue.severity.in_(["high", "critical"]),
    ).count()

    batches_count = db.query(UploadBatch).filter(UploadBatch.institution_id == id).count()

    return InstitutionStatsOut(
        institution_id=inst.id,
        institution_name=inst.name,
        total_programs=total_programs,
        total_students=total_students,
        active_students=active_students,
        open_issues=open_issues,
        high_critical_issues=high_critical_issues,
        batches_count=batches_count,
    )


@router.get("/programs", response_model=List[ProgramOut])
def get_programs(
    institution_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List programs, optionally filtered by institution_id."""
    roles = get_user_roles(current_user)
    is_aicte = "aicte_admin" in roles or "reviewer" in roles

    query = db.query(Program).filter(Program.status == "active")

    if institution_id:
        require_institution_access(current_user, institution_id)
        query = query.filter(Program.institution_id == institution_id)
    elif not is_aicte:
        inst_ids = get_user_institution_ids(current_user)
        if not inst_ids:
            return []
        query = query.filter(Program.institution_id.in_(inst_ids))

    return query.all()


@router.get("/programs/{id}", response_model=ProgramOut)
def get_program_by_id(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific program by ID."""
    prog = db.query(Program).filter(Program.id == id).first()
    if not prog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
    require_institution_access(current_user, prog.institution_id)
    return prog


@router.get("/intake-limits", response_model=List[IntakeLimitOut])
def get_intake_limits(
    program_id: Optional[uuid.UUID] = Query(None),
    cycle: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List approved intake limits."""
    query = db.query(IntakeLimit)

    if program_id:
        prog = db.query(Program).filter(Program.id == program_id).first()
        if not prog:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
        require_institution_access(current_user, prog.institution_id)
        query = query.filter(IntakeLimit.program_id == program_id)
    else:
        roles = get_user_roles(current_user)
        is_aicte = "aicte_admin" in roles or "reviewer" in roles
        if not is_aicte:
            inst_ids = get_user_institution_ids(current_user)
            if not inst_ids:
                return []
            query = query.join(Program, IntakeLimit.program_id == Program.id).filter(Program.institution_id.in_(inst_ids))

    if cycle:
        query = query.filter(IntakeLimit.admission_cycle == cycle)

    return query.all()



@router.get("/institutions/{id}/compliance-dashboard")
def get_institution_compliance_dashboard(
    id: uuid.UUID,
    cycle: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Comprehensive College Compliance & Quota Dashboard.
    Provides:
    - Approved Intake vs Actual Student Enrolment
    - Supernumerary Seats Breakdown (NRI, FN, Kashmiri Migrant, Other)
    - NRI Category Breakdown
    - OCI Status Breakdown
    - Foreign National (FN) Status Breakdown
    - Detailed Student Roster with relevant enrollment metadata
    """
    require_institution_access(current_user, id)
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    if not cycle:
        latest_intake = db.query(IntakeLimit.admission_cycle).order_by(IntakeLimit.admission_cycle.desc()).first()
        cycle = latest_intake[0] if latest_intake else "2026-27"

    programs = db.query(Program).filter(Program.institution_id == id, Program.status == "active").all()
    program_ids = [p.id for p in programs]

    intake_limits = (
        db.query(IntakeLimit)
        .filter(IntakeLimit.program_id.in_(program_ids), IntakeLimit.admission_cycle == cycle)
        .all()
    ) if program_ids else []

    intake_map = {il.program_id: il.approved_capacity for il in intake_limits}

    all_students = db.query(StudentRecord).filter(
        StudentRecord.institution_id == id,
        StudentRecord.admission_cycle == cycle,
    ).order_by(StudentRecord.created_at.desc()).all()

    admitted_students = [s for s in all_students if s.admission_status == "admitted"]
    total_enrolled = len(admitted_students)
    total_approved_intake = sum(intake_map.values()) if intake_map else sum([il.approved_capacity for il in intake_limits])

    supernumerary_students = [s for s in admitted_students if s.supernumerary_category and s.supernumerary_category != "none"]
    supernumerary_total = len(supernumerary_students)
    supernumerary_breakdown = {
        "nri": sum(1 for s in admitted_students if s.supernumerary_category == "nri"),
        "foreign_national": sum(1 for s in admitted_students if s.supernumerary_category == "foreign_national"),
        "kashmiri_migrant": sum(1 for s in admitted_students if s.supernumerary_category == "kashmiri_migrant"),
        "other": sum(1 for s in admitted_students if s.supernumerary_category == "other"),
        "none": sum(1 for s in admitted_students if s.supernumerary_category in (None, "", "none")),
    }

    nri_count = sum(1 for s in admitted_students if s.nri_category == "applicable")
    oci_count = sum(1 for s in admitted_students if s.oci_status == "applicable")
    fn_count = sum(1 for s in admitted_students if s.foreign_national_status == "applicable")

    from collections import Counter
    categories_counter = Counter(s.admission_category for s in admitted_students)

    prog_dict = {p.id: p for p in programs}
    program_summary = []
    for p in programs:
        p_enrolled = sum(1 for s in admitted_students if s.program_id == p.id)
        p_capacity = intake_map.get(p.id, 0)
        p_pct = round((p_enrolled / p_capacity * 100), 1) if p_capacity > 0 else 0.0
        program_summary.append({
            "program_id": str(p.id),
            "program_code": p.program_code,
            "program_name": p.program_name,
            "approved_capacity": p_capacity,
            "enrolled_count": p_enrolled,
            "utilization_pct": p_pct,
            "status": "BREACHED" if p_pct > 100 else ("OPTIMAL" if p_pct >= 80 else "AVAILABLE"),
        })

    student_roster = []
    for s in all_students:
        prog = prog_dict.get(s.program_id)
        issue_count = db.query(ValidationIssue).filter(ValidationIssue.record_id == s.id, ValidationIssue.status == "open").count()
        student_roster.append({
            "id": str(s.id),
            "student_name": s.student_name,
            "institution_student_id": s.institution_student_id,
            "identity_reference": s.identity_reference,
            "date_of_birth": s.date_of_birth.isoformat() if s.date_of_birth else None,
            "gender": s.gender,
            "program_code": prog.program_code if prog else "N/A",
            "program_name": prog.program_name if prog else "N/A",
            "admission_category": s.admission_category,
            "admission_status": s.admission_status,
            "nri_category": s.nri_category,
            "oci_status": s.oci_status,
            "foreign_national_status": s.foreign_national_status,
            "supernumerary_category": s.supernumerary_category,
            "record_status": s.record_status,
            "open_issues_count": issue_count,
        })

    overall_utilization = round((total_enrolled / total_approved_intake * 100), 1) if total_approved_intake > 0 else 0.0

    return {
        "institution": {
            "id": str(inst.id),
            "name": inst.name,
            "institution_code": inst.institution_code,
            "institution_type": inst.institution_type,
            "state": inst.state,
            "city": inst.city,
            "status": inst.status,
        },
        "admission_cycle": cycle,
        "metrics": {
            "approved_intake": total_approved_intake,
            "actual_enrolment": total_enrolled,
            "utilization_pct": overall_utilization,
            "supernumerary_seats": supernumerary_total,
            "nri_count": nri_count,
            "oci_count": oci_count,
            "foreign_national_count": fn_count,
        },
        "supernumerary_breakdown": supernumerary_breakdown,
        "category_distribution": dict(categories_counter),
        "programs": program_summary,
        "students": student_roster,
    }
