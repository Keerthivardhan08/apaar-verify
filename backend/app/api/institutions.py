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
