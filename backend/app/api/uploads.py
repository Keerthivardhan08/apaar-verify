import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import (
    get_current_user,
    require_institution_access,
    get_user_roles,
    get_user_institution_ids,
)
from app.core.security import compute_identifier_fingerprint
from app.models.user import User
from app.models.upload import UploadBatch
from app.models.student import StudentRecord, StudentIdentity, StudentRecordVersion
from app.models.validation import ValidationIssue
from app.schemas.upload import UploadBatchOut, UploadCommitResponse
from app.schemas.validation import ValidationIssueOut
from app.services.csv_processor import parse_and_validate_csv, export_csv_sanitized
from app.services.validation import validate_and_persist
from app.services.audit import log_event

router = APIRouter()

# In-memory storage for raw parsed rows awaiting commit per batch
_PENDING_BATCH_ROWS: dict[uuid.UUID, list] = {}


@router.post("/uploads", response_model=UploadBatchOut, status_code=status.HTTP_202_ACCEPTED)
async def upload_csv(
    file: UploadFile = File(...),
    institution_id: uuid.UUID = Form(...),
    admission_cycle: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload and stage an enrollment CSV file for batch validation.
    Enforces file size limit, schema validation, and intra-batch integrity.
    """
    require_institution_access(current_user, institution_id)

    file_bytes = await file.read()
    file_checksum = hashlib.sha256(file_bytes).hexdigest()

    # Parse and validate via CSV processor
    parse_result = parse_and_validate_csv(
        file_bytes=file_bytes,
        institution_id=institution_id,
        admission_cycle=admission_cycle,
        db=db,
    )

    if not parse_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=parse_result["error"],
        )

    total_rows = parse_result["total_rows"]
    valid_rows = parse_result["valid_rows"]
    invalid_rows = parse_result["invalid_rows"]

    batch_status = "ready_to_commit" if len(valid_rows) > 0 else "validation_failed"

    batch_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    batch = UploadBatch(
        id=batch_id,
        institution_id=institution_id,
        submitted_by=current_user.id,
        file_name=file.filename or "unknown.csv",
        file_checksum=file_checksum,
        status=batch_status,
        total_rows=total_rows,
        valid_rows=len(valid_rows),
        invalid_rows=len(invalid_rows),
        admission_cycle=admission_cycle,
        created_at=now,
    )
    db.add(batch)
    db.flush()

    # Record validation issues for invalid rows
    for inv in invalid_rows:
        for err in inv.get("errors", []):
            issue = ValidationIssue(
                id=uuid.uuid4(),
                batch_id=batch.id,
                rule_code=err.get("rule_code", "CSV_ROW_ERROR"),
                severity="critical" if "MISSING" in err.get("rule_code", "") else "high",
                description=err.get("message", "Error in row"),
                affected_field=err.get("field"),
                observed_condition=f"Row {inv.get('row_number')}",
                status="open",
                created_at=now,
            )
            db.add(issue)

    # Cache valid rows in-memory for the commit step
    _PENDING_BATCH_ROWS[batch_id] = valid_rows

    log_event(
        db=db,
        action="upload.submit",
        target_type="upload_batch",
        target_id=str(batch.id),
        outcome="success",
        actor_id=current_user.id,
        metadata={
            "file_name": file.filename,
            "total_rows": total_rows,
            "valid_rows": len(valid_rows),
            "invalid_rows": len(invalid_rows),
        },
    )

    db.commit()
    db.refresh(batch)
    return batch


@router.get("/uploads", response_model=List[UploadBatchOut])
def list_uploads(
    institution_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List upload batches with institution scoping."""
    roles = get_user_roles(current_user)
    is_aicte = "aicte_admin" in roles or "reviewer" in roles

    query = db.query(UploadBatch)

    if institution_id:
        require_institution_access(current_user, institution_id)
        query = query.filter(UploadBatch.institution_id == institution_id)
    elif not is_aicte:
        inst_ids = get_user_institution_ids(current_user)
        if not inst_ids:
            return []
        query = query.filter(UploadBatch.institution_id.in_(inst_ids))

    if status:
        query = query.filter(UploadBatch.status == status)

    return query.order_by(UploadBatch.created_at.desc()).all()


@router.get("/uploads/{id}", response_model=UploadBatchOut)
def get_upload_by_id(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of an upload batch."""
    batch = db.query(UploadBatch).filter(UploadBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload batch not found")
    require_institution_access(current_user, batch.institution_id)
    return batch


@router.get("/uploads/{id}/issues", response_model=List[ValidationIssueOut])
def get_upload_issues(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get validation issues detected in an upload batch."""
    batch = db.query(UploadBatch).filter(UploadBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload batch not found")
    require_institution_access(current_user, batch.institution_id)

    issues = db.query(ValidationIssue).filter(ValidationIssue.batch_id == id).all()
    return issues


@router.post("/uploads/{id}/commit", response_model=UploadCommitResponse)
def commit_upload_batch(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Commit valid rows from a staged batch into active student records.
    Uses atomic transaction management.
    """
    batch = db.query(UploadBatch).filter(UploadBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload batch not found")
    require_institution_access(current_user, batch.institution_id)

    if batch.status not in ("ready_to_commit", "validation_failed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch cannot be committed in '{batch.status}' status",
        )

    valid_rows = _PENDING_BATCH_ROWS.pop(id, [])
    now = datetime.now(timezone.utc)
    committed_count = 0

    try:
        for row in valid_rows:
            # Create identity if reference present
            ident = None
            ref = row.get("identity_reference")
            if ref:
                fp = compute_identifier_fingerprint(ref)
                ident = StudentIdentity(
                    id=uuid.uuid4(),
                    identifier_type="demo",
                    identifier_fingerprint=fp,
                    verification_status="unverified",
                    created_at=now,
                    updated_at=now,
                )
                db.add(ident)
                db.flush()

            rec = StudentRecord(
                id=uuid.uuid4(),
                institution_id=batch.institution_id,
                program_id=row["program_id"],
                student_identity_id=ident.id if ident else None,
                identity_reference=ref,
                admission_cycle=batch.admission_cycle,
                institution_student_id=row["institution_student_id"],
                student_name=row["student_name"],
                date_of_birth=row.get("date_of_birth"),
                gender=row.get("gender"),
                admission_category=row["admission_category"],
                admission_status=row.get("admission_status", "admitted"),
                nri_category=row.get("nri_category", "not_applicable"),
                oci_status=row.get("oci_status", "not_applicable"),
                foreign_national_status=row.get("foreign_national_status", "not_applicable"),
                supernumerary_category=row.get("supernumerary_category", "none"),
                source_batch_id=batch.id,
                record_status="submitted",
                identity_verification_status="unverified",
                created_at=now,
                updated_at=now,
                created_by=current_user.id,
            )
            db.add(rec)
            db.flush()

            v1 = StudentRecordVersion(
                id=uuid.uuid4(),
                record_id=rec.id,
                version_number=1,
                snapshot={
                    "id": str(rec.id),
                    "institution_student_id": rec.institution_student_id,
                    "student_name": rec.student_name,
                    "admission_category": rec.admission_category,
                    "admission_cycle": rec.admission_cycle,
                },
                changed_by=current_user.id,
                change_reason=f"Batch upload {batch.file_name}",
                created_at=now,
            )
            db.add(v1)

            # Validate the new record
            validate_and_persist(rec, db)
            committed_count += 1

        batch.status = "completed" if batch.invalid_rows == 0 else "completed_with_errors"
        batch.completed_at = now

        log_event(
            db=db,
            action="upload.commit",
            target_type="upload_batch",
            target_id=str(batch.id),
            outcome="success",
            actor_id=current_user.id,
            metadata={"committed_rows": committed_count, "final_status": batch.status},
        )

        db.commit()

        return UploadCommitResponse(
            batch_id=batch.id,
            status=batch.status,
            total_rows=batch.total_rows,
            committed_rows=committed_count,
            message="Batch committed successfully",
        )
    except Exception as exc:
        db.rollback()
        batch.status = "failed"
        db.commit()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to commit batch: {str(exc)}")


@router.get("/uploads/{id}/errors.csv")
def download_errors_csv(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download a CSV of all row-level validation errors in a batch.
    Applies formula injection sanitization.
    """
    batch = db.query(UploadBatch).filter(UploadBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload batch not found")
    require_institution_access(current_user, batch.institution_id)

    issues = db.query(ValidationIssue).filter(ValidationIssue.batch_id == id).all()

    rows = []
    for issue in issues:
        rows.append({
            "batch_id": str(batch.id),
            "file_name": batch.file_name,
            "rule_code": issue.rule_code,
            "severity": issue.severity,
            "description": issue.description,
            "affected_field": issue.affected_field or "",
            "observed_condition": issue.observed_condition or "",
            "created_at": issue.created_at.isoformat(),
        })

    fields = ["batch_id", "file_name", "rule_code", "severity", "description", "affected_field", "observed_condition", "created_at"]
    csv_data = export_csv_sanitized(rows, fields)

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=errors_{str(id)[:8]}.csv"},
    )
