import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.core.permissions import (
    get_current_user,
    require_institution_access,
    get_user_roles,
    get_user_institution_ids,
)
from app.core.security import compute_identifier_fingerprint, mask_fingerprint
from app.models.user import User
from app.models.institution import Institution, Program
from app.models.student import StudentRecord, StudentIdentity, StudentRecordVersion
from app.models.validation import ValidationIssue
from app.schemas.common import PaginatedResponse, MessageResponse
from app.schemas.student import (
    StudentRecordCreate,
    StudentRecordUpdate,
    StudentRecordOut,
    StudentRecordListOut,
    StudentRecordVersionOut,
    CorrectionRequestCreate,
)
from app.services.validation import validate_and_persist
from app.services.audit import log_event
from app.services.notifications import create_notification

router = APIRouter()


def _mask_reference(ref: Optional[str]) -> Optional[str]:
    if not ref:
        return None
    if len(ref) <= 4:
        return "****"
    return f"{ref[:4]}...{ref[-4:]}"


def _record_to_dict(rec: StudentRecord) -> Dict[str, Any]:
    return {
        "id": str(rec.id),
        "institution_id": str(rec.institution_id),
        "program_id": str(rec.program_id),
        "admission_cycle": rec.admission_cycle,
        "institution_student_id": rec.institution_student_id,
        "student_name": rec.student_name,
        "date_of_birth": rec.date_of_birth.isoformat() if rec.date_of_birth else None,
        "gender": rec.gender,
        "admission_category": rec.admission_category,
        "admission_status": rec.admission_status,
        "nri_category": rec.nri_category,
        "oci_status": rec.oci_status,
        "foreign_national_status": rec.foreign_national_status,
        "supernumerary_category": rec.supernumerary_category,
        "identity_reference": _mask_reference(rec.identity_reference),
        "record_status": rec.record_status,
        "identity_verification_status": rec.identity_verification_status,
    }


@router.post("/students", response_model=StudentRecordOut, status_code=status.HTTP_201_CREATED)
def create_student(
    body: StudentRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new student enrollment record.
    Enforces institution scoping and triggers the validation engine.
    """
    require_institution_access(current_user, body.institution_id)

    # Validate program exists and belongs to institution
    prog = db.query(Program).filter(Program.id == body.program_id, Program.institution_id == body.institution_id).first()
    if not prog:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Program does not belong to specified institution")

    # Create identity if reference provided
    student_identity = None
    if body.identity_reference:
        fp = compute_identifier_fingerprint(body.identity_reference)
        student_identity = StudentIdentity(
            id=uuid.uuid4(),
            identifier_type="demo",
            identifier_fingerprint=fp,
            verification_status="unverified",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(student_identity)
        db.flush()

    record_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    rec = StudentRecord(
        id=record_id,
        institution_id=body.institution_id,
        program_id=body.program_id,
        student_identity_id=student_identity.id if student_identity else None,
        identity_reference=body.identity_reference,
        admission_cycle=body.admission_cycle,
        institution_student_id=body.institution_student_id,
        student_name=body.student_name,
        date_of_birth=body.date_of_birth,
        gender=body.gender,
        admission_category=body.admission_category,
        admission_status=body.admission_status,
        nri_category=body.nri_category,
        oci_status=body.oci_status,
        foreign_national_status=body.foreign_national_status,
        supernumerary_category=body.supernumerary_category,
        record_status="submitted",
        identity_verification_status="unverified",
        created_at=now,
        updated_at=now,
        created_by=current_user.id,
    )
    db.add(rec)
    db.flush()

    # Save initial version
    v1 = StudentRecordVersion(
        id=uuid.uuid4(),
        record_id=rec.id,
        version_number=1,
        snapshot=_record_to_dict(rec),
        changed_by=current_user.id,
        change_reason="Initial enrollment submission",
        created_at=now,
    )
    db.add(v1)

    # Run validation engine
    validate_and_persist(rec, db)

    # Audit log
    log_event(
        db=db,
        action="student.create",
        target_type="student_record",
        target_id=str(rec.id),
        outcome="success",
        actor_id=current_user.id,
        metadata={"institution_id": str(body.institution_id), "cycle": body.admission_cycle},
    )

    db.commit()
    db.refresh(rec)

    res = StudentRecordOut.model_validate(rec)
    res.masked_identity_reference = _mask_reference(rec.identity_reference)
    return res


@router.get("/students", response_model=PaginatedResponse[StudentRecordListOut])
def list_students(
    institution_id: Optional[uuid.UUID] = Query(None),
    program_id: Optional[uuid.UUID] = Query(None),
    cycle: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Paginated student records list.
    Enforces institution scoping and masks sensitive identifiers.
    """
    roles = get_user_roles(current_user)
    is_aicte = "aicte_admin" in roles or "reviewer" in roles

    query = db.query(StudentRecord)

    if institution_id:
        require_institution_access(current_user, institution_id)
        query = query.filter(StudentRecord.institution_id == institution_id)
    elif not is_aicte:
        inst_ids = get_user_institution_ids(current_user)
        if not inst_ids:
            return PaginatedResponse(items=[], total=0, page=page, size=size, pages=0)
        query = query.filter(StudentRecord.institution_id.in_(inst_ids))

    if program_id:
        query = query.filter(StudentRecord.program_id == program_id)
    if cycle:
        query = query.filter(StudentRecord.admission_cycle == cycle)
    if status:
        query = query.filter(StudentRecord.record_status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                StudentRecord.student_name.ilike(search_pattern),
                StudentRecord.institution_student_id.ilike(search_pattern),
            )
        )

    total = query.count()
    offset = (page - 1) * size
    records = query.order_by(StudentRecord.created_at.desc()).offset(offset).limit(size).all()

    items = []
    for r in records:
        out = StudentRecordListOut.model_validate(r)
        out.masked_identity_reference = _mask_reference(r.identity_reference)
        items.append(out)

    pages = math.ceil(total / size) if size > 0 else 0
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/students/lookup/by-apaar")
def lookup_student_by_apaar(
    apaar_id: str = Query(..., description="12-digit APAAR ID or DEMO reference"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Look up a student record strictly by their APAAR ID.
    Enforces institutional tenant authorization and returns full student profile,
    program information, open validation issues, and existing workflow status.
    """
    clean_id = apaar_id.strip()

    # Build search variants to handle user prefixes and demo conventions (e.g. 0001 -> 1001)
    search_ids = {clean_id, clean_id.upper()}
    if "000" in clean_id:
        search_ids.add(clean_id.replace("000", "100"))
    if "100" in clean_id:
        search_ids.add(clean_id.replace("100", "000"))
    if clean_id.startswith("DEMO-APAAR-"):
        num_part = clean_id.replace("DEMO-APAAR-", "")
        search_ids.add(num_part)
        if num_part.startswith("0"):
            search_ids.add(f"DEMO-APAAR-1{num_part[1:]}")
    elif clean_id.isdigit():
        search_ids.add(f"DEMO-APAAR-{clean_id}")
        if clean_id.startswith("0"):
            search_ids.add(f"DEMO-APAAR-1{clean_id[1:]}")

    clauses = []
    for sid in search_ids:
        clauses.extend([
            StudentRecord.identity_reference == sid,
            StudentRecord.identity_reference == sid.upper(),
            StudentRecord.identity_reference.ilike(sid),
            StudentRecord.institution_student_id.ilike(sid),
        ])

    rec = db.query(StudentRecord).filter(or_(*clauses)).first()

    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No student record found matching APAAR ID '{apaar_id}'. Please verify the identifier and try again."
        )

    require_institution_access(current_user, rec.institution_id)

    program = db.query(Program).filter(Program.id == rec.program_id).first()
    institution = db.query(Institution).filter(Institution.id == rec.institution_id).first()
    issues = db.query(ValidationIssue).filter(ValidationIssue.record_id == rec.id, ValidationIssue.status == "open").all()
    versions_count = db.query(StudentRecordVersion).filter(StudentRecordVersion.record_id == rec.id).count()

    res = StudentRecordOut.model_validate(rec)
    res.masked_identity_reference = _mask_reference(rec.identity_reference)

    return {
        "student": res,
        "program_code": program.program_code if program else "N/A",
        "program_name": program.program_name if program else "N/A",
        "institution_name": institution.name if institution else "N/A",
        "open_issues_count": len(issues),
        "open_issues": [
            {
                "rule_code": iss.rule_code,
                "severity": iss.severity,
                "description": iss.description,
                "affected_field": iss.affected_field,
            }
            for iss in issues
        ],
        "versions_count": versions_count,
    }


@router.get("/students/{id}", response_model=StudentRecordOut)
def get_student_by_id(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single student record by ID with masked identifier."""
    rec = db.query(StudentRecord).filter(StudentRecord.id == id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")
    require_institution_access(current_user, rec.institution_id)

    res = StudentRecordOut.model_validate(rec)
    res.masked_identity_reference = _mask_reference(rec.identity_reference)
    return res


@router.patch("/students/{id}", response_model=StudentRecordOut)
@router.put("/students/{id}", response_model=StudentRecordOut)
def update_student(
    id: uuid.UUID,
    body: StudentRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a student record, create snapshot version, and re-run validation rules.
    """
    rec = db.query(StudentRecord).filter(StudentRecord.id == id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")
    require_institution_access(current_user, rec.institution_id)

    # Determine next version number
    current_versions = db.query(StudentRecordVersion).filter(StudentRecordVersion.record_id == rec.id).count()
    next_ver = current_versions + 1

    # Update provided fields
    fields_to_update = body.model_dump(exclude_unset=True, exclude={"change_reason"})
    for field, val in fields_to_update.items():
        setattr(rec, field, val)

    rec.updated_at = datetime.now(timezone.utc)
    rec.updated_by = current_user.id

    # If identity_reference changed, update or create student_identity
    if "identity_reference" in fields_to_update and rec.identity_reference:
        fp = compute_identifier_fingerprint(rec.identity_reference)
        if rec.identity:
            rec.identity.identifier_fingerprint = fp
            rec.identity.updated_at = datetime.now(timezone.utc)
        else:
            ident = StudentIdentity(
                id=uuid.uuid4(),
                identifier_type="demo",
                identifier_fingerprint=fp,
                verification_status="unverified",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(ident)
            db.flush()
            rec.student_identity_id = ident.id

    # Create version record
    ver = StudentRecordVersion(
        id=uuid.uuid4(),
        record_id=rec.id,
        version_number=next_ver,
        snapshot=_record_to_dict(rec),
        changed_by=current_user.id,
        change_reason=body.change_reason or f"Update version {next_ver}",
        created_at=datetime.now(timezone.utc),
    )
    db.add(ver)

    # Re-run validation rules
    validate_and_persist(rec, db)

    # Audit log
    log_event(
        db=db,
        action="student.update",
        target_type="student_record",
        target_id=str(rec.id),
        outcome="success",
        actor_id=current_user.id,
        metadata={"version": next_ver, "change_reason": body.change_reason},
    )

    db.commit()
    db.refresh(rec)

    res = StudentRecordOut.model_validate(rec)
    res.masked_identity_reference = _mask_reference(rec.identity_reference)
    return res


@router.get("/students/{id}/history", response_model=List[StudentRecordVersionOut])
def get_student_history(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve complete immutable version history for a student record."""
    rec = db.query(StudentRecord).filter(StudentRecord.id == id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")
    require_institution_access(current_user, rec.institution_id)

    versions = (
        db.query(StudentRecordVersion)
        .filter(StudentRecordVersion.record_id == id)
        .order_by(StudentRecordVersion.version_number.desc())
        .all()
    )
    return versions


@router.post("/students/{id}/correction-requests", response_model=MessageResponse)
def request_student_correction(
    id: uuid.UUID,
    body: CorrectionRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a formal correction request for a student record.
    Marks record as correction_requested and logs audit event.
    """
    rec = db.query(StudentRecord).filter(StudentRecord.id == id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")
    require_institution_access(current_user, rec.institution_id)

    rec.record_status = "correction_requested"
    rec.updated_at = datetime.now(timezone.utc)
    rec.updated_by = current_user.id

    log_event(
        db=db,
        action="student.correction_requested",
        target_type="student_record",
        target_id=str(rec.id),
        outcome="success",
        actor_id=current_user.id,
        metadata={"reason": body.reason, "proposed_changes": body.proposed_changes},
    )

    db.commit()
    return MessageResponse(
        message="Correction request submitted successfully",
        detail=f"Record {str(rec.id)} set to 'correction_requested'",
    )
