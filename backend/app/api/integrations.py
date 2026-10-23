"""
Provider Integrations & Sync API Router.

Endpoints:
- GET /api/v1/integrations/providers : List registered identity verification providers and live telemetry.
- POST /api/v1/integrations/{provider}/sync : Batch sync student records against an external identity provider.
"""
import time
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user, require_institution_access
from app.models.user import User
from app.models.student import StudentRecord, StudentIdentity
from app.services.provider_adapter import (
    get_verification_provider,
    list_available_providers,
)
from app.services.audit import log_event

router = APIRouter(prefix="/integrations", tags=["External Identity Integrations"])


class ProviderSyncRequest(BaseModel):
    institution_id: Optional[uuid.UUID] = None
    admission_cycle: Optional[str] = None
    student_ids: Optional[List[uuid.UUID]] = None
    force_refresh: bool = False


@router.get("/providers", summary="List Available Verification Providers")
async def get_providers(
    current_user: User = Depends(get_current_user),
):
    """
    Returns registered identity verification provider adapters with live health checks,
    latency telemetry, and security mechanisms.
    """
    return list_available_providers()


@router.post("/{provider_key}/sync", summary="Synchronize Student Records with Verification Provider")
async def sync_records_with_provider(
    provider_key: str,
    body: ProviderSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Initiates a batch synchronization job to verify student identifiers with the specified provider.
    - AICTE Admins can sync across all institutions.
    - Institution Operators are strictly scoped to their own institution.
    """
    start_time = time.perf_counter()

    # Scope validation
    is_aicte = any(r.role in ("aicte_admin", "reviewer") for r in current_user.roles)
    if not is_aicte:
        user_inst_id = next((r.institution_id for r in current_user.roles if r.institution_id), None)
        if not user_inst_id:
            raise HTTPException(status_code=403, detail="User is not affiliated with any institution")
        if body.institution_id and body.institution_id != user_inst_id:
            raise HTTPException(status_code=403, detail="Access denied: Cannot sync other institution data")
        target_inst_id = user_inst_id
    else:
        target_inst_id = body.institution_id

    # Retrieve provider adapter
    provider = get_verification_provider(provider_key)

    # Build query for student records
    query = db.query(StudentRecord)
    if target_inst_id:
        query = query.filter(StudentRecord.institution_id == target_inst_id)
    if body.admission_cycle:
        query = query.filter(StudentRecord.admission_cycle == body.admission_cycle)
    if body.student_ids:
        query = query.filter(StudentRecord.id.in_(body.student_ids))
    elif not body.force_refresh:
        # Default: only sync records not yet verified by an authorized provider
        query = query.filter(StudentRecord.identity_verification_status.in_(["unverified", "pending", "mock_verified"]))

    students = query.limit(500).all()

    processed = 0
    updated = 0
    failed = 0
    results_detail = []

    for student in students:
        processed += 1
        identifier_ref = student.identity_reference or student.institution_student_id
        res = provider.verify_identifier(
            identifier_reference=identifier_ref,
            student_metadata={
                "name": student.student_name,
                "admission_cycle": student.admission_cycle,
                "institution_id": str(student.institution_id),
            },
        )

        new_status = res.get("status", "unverified")

        # Update or create student identity link
        if student.identity:
            student.identity.verification_status = new_status
            student.identity.provider_reference = res.get("provider_reference")
            student.identity.identifier_type = provider_key
        else:
            identity = StudentIdentity(
                id=uuid.uuid4(),
                identifier_type=provider_key,
                verification_status=new_status,
                provider_reference=res.get("provider_reference"),
            )
            db.add(identity)
            student.identity = identity

        # Update student record status
        student.identity_verification_status = new_status
        if new_status in ("verified", "mock_verified"):
            updated += 1
        else:
            failed += 1

        results_detail.append({
            "student_id": str(student.id),
            "student_name": student.student_name,
            "identifier_ref": identifier_ref,
            "status": new_status,
            "provider_reference": res.get("provider_reference"),
        })

    db.commit()

    duration_ms = int((time.perf_counter() - start_time) * 1000)

    # Audit logging
    log_event(
        actor_id=current_user.id,
        action="PROVIDER_SYNC_EXECUTED",
        target_type="provider",
        target_id=provider_key,
        outcome="success",
        metadata={
            "provider": provider_key,
            "records_processed": processed,
            "records_updated": updated,
            "records_failed": failed,
            "duration_ms": duration_ms,
            "institution_id": str(target_inst_id) if target_inst_id else "all",
        },
        db=db,
    )

    return {
        "sync_id": str(uuid.uuid4()),
        "provider": provider_key,
        "provider_display": provider.display_name,
        "status": "completed",
        "records_processed": processed,
        "records_updated": updated,
        "records_failed": failed,
        "duration_ms": duration_ms,
        "details_sample": results_detail[:10],
        "message": f"Successfully processed {processed} records with {provider.display_name}.",
    }
