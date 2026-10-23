"""
Approved Institutional APIs & Direct SIS ERP Integration Router.
Provides API key issuance, webhook registration, and direct SIS ERP batch ingestion.
"""
import hashlib
import secrets
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user, require_institution_access
from app.models.user import User
from app.models.student import StudentRecord
from app.models.validation import ValidationIssue
from app.models.integration_api import InstitutionalApiKey, InstitutionalWebhook
from app.services.validation import run_all_validations

router = APIRouter(prefix="/institution-api", tags=["Institutional ERP & SIS Integration"])


class CreateApiKeyRequest(BaseModel):
    institution_id: uuid.UUID
    key_name: str
    permissions: List[str] = ["student:read", "student:write", "batch:upload"]


class RegisterWebhookRequest(BaseModel):
    institution_id: uuid.UUID
    target_url: str
    event_types: List[str] = ["issue.flagged", "review.decided", "intake.warning"]


class SisDirectStudentRecord(BaseModel):
    institution_student_id: str
    student_name: str
    program_id: uuid.UUID
    admission_cycle: str
    admission_category: str = "general"
    admission_status: str = "admitted"
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    identity_reference: Optional[str] = None


class SisPushBatchRequest(BaseModel):
    admission_cycle: str
    records: List[SisDirectStudentRecord]


@router.post("/keys", status_code=status.HTTP_201_CREATED, summary="Generate Institutional API Key")
def generate_api_key(
    body: CreateApiKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate an API key for the institution's Campus ERP or Student Information System (SIS).
    The raw key is returned once upon generation; only its cryptographic hash is stored.
    """
    require_institution_access(body.institution_id, current_user)

    raw_token = f"inst_live_{secrets.token_urlsafe(32)}"
    key_prefix = raw_token[:14]
    key_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    key_record = InstitutionalApiKey(
        id=uuid.uuid4(),
        institution_id=body.institution_id,
        key_name=body.key_name,
        api_key_hash=key_hash,
        api_key_prefix=key_prefix,
        permissions=body.permissions,
        is_active=True,
    )
    db.add(key_record)
    db.commit()

    return {
        "id": str(key_record.id),
        "institution_id": str(key_record.institution_id),
        "key_name": key_record.key_name,
        "api_key_prefix": key_prefix,
        "api_key_secret": raw_token,  # Visible only on generation
        "permissions": key_record.permissions,
        "created_at": key_record.created_at.isoformat(),
        "warning": "Store this key securely. It will not be displayed again.",
    }


@router.get("/keys", summary="List Institutional API Keys")
def list_api_keys(
    institution_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List active API keys configured for the institution."""
    query = db.query(InstitutionalApiKey).filter(InstitutionalApiKey.is_active == True)
    if institution_id:
        require_institution_access(institution_id, current_user)
        query = query.filter(InstitutionalApiKey.institution_id == institution_id)
    else:
        # Default to user's institution unless AICTE admin
        is_aicte = any(r.role in ("aicte_admin", "reviewer") for r in current_user.roles)
        if not is_aicte:
            user_inst_id = next((r.institution_id for r in current_user.roles if r.institution_id), None)
            if not user_inst_id:
                raise HTTPException(status_code=403, detail="User not affiliated with any institution")
            query = query.filter(InstitutionalApiKey.institution_id == user_inst_id)

    keys = query.all()
    return [
        {
            "id": str(k.id),
            "institution_id": str(k.institution_id),
            "key_name": k.key_name,
            "api_key_prefix": k.api_key_prefix,
            "permissions": k.permissions,
            "is_active": k.is_active,
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
            "created_at": k.created_at.isoformat(),
        }
        for k in keys
    ]


@router.delete("/keys/{key_id}", summary="Revoke Institutional API Key")
def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke an institutional API key immediately."""
    key = db.query(InstitutionalApiKey).filter(InstitutionalApiKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    require_institution_access(key.institution_id, current_user)
    key.is_active = False
    db.commit()
    return {"message": "API key revoked successfully", "key_id": str(key_id)}


@router.post("/webhooks", status_code=status.HTTP_201_CREATED, summary="Register Webhook")
def register_webhook(
    body: RegisterWebhookRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Register an institutional webhook URL for real-time SIS notifications."""
    require_institution_access(body.institution_id, current_user)

    hook = InstitutionalWebhook(
        id=uuid.uuid4(),
        institution_id=body.institution_id,
        target_url=body.target_url,
        secret_token=secrets.token_hex(20),
        event_types=body.event_types,
        is_active=True,
    )
    db.add(hook)
    db.commit()
    return {
        "id": str(hook.id),
        "target_url": hook.target_url,
        "event_types": hook.event_types,
        "secret_token": hook.secret_token,
        "is_active": hook.is_active,
    }


@router.get("/webhooks", summary="List Registered Webhooks")
def list_webhooks(
    institution_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List webhooks configured for an institution."""
    query = db.query(InstitutionalWebhook).filter(InstitutionalWebhook.is_active == True)
    if institution_id:
        require_institution_access(institution_id, current_user)
        query = query.filter(InstitutionalWebhook.institution_id == institution_id)
    return [
        {
            "id": str(w.id),
            "target_url": w.target_url,
            "event_types": w.event_types,
            "is_active": w.is_active,
            "created_at": w.created_at.isoformat(),
        }
        for w in query.all()
    ]


@router.post("/v1/sis/push-records", summary="Direct SIS ERP Ingestion Endpoint")
def direct_sis_push(
    body: SisPushBatchRequest,
    x_institution_api_key: Optional[str] = Header(None, alias="X-Institution-API-Key"),
    db: Session = Depends(get_db),
):
    """
    Direct Machine-to-Machine REST endpoint for institutional ERP / SIS software.
    Authenticates via the X-Institution-API-Key header.
    Validates, ingests, and reports validation issues directly.
    """
    if not x_institution_api_key:
        raise HTTPException(status_code=401, detail="Missing X-Institution-API-Key header")

    key_hash = hashlib.sha256(x_institution_api_key.encode()).hexdigest()
    api_key = db.query(InstitutionalApiKey).filter(
        InstitutionalApiKey.api_key_hash == key_hash,
        InstitutionalApiKey.is_active == True,
    ).first()

    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid or inactive institutional API key")

    # Ingest records
    imported = 0
    issues_flagged = 0

    for rec in body.records:
        new_record = StudentRecord(
            id=uuid.uuid4(),
            institution_id=api_key.institution_id,
            program_id=rec.program_id,
            admission_cycle=body.admission_cycle,
            institution_student_id=rec.institution_student_id,
            student_name=rec.student_name,
            admission_category=rec.admission_category,
            admission_status=rec.admission_status,
            identity_reference=rec.identity_reference,
            created_by=api_key.institution_id,  # Linked to institution
            record_status="submitted",
        )
        db.add(new_record)
        imported += 1

        # Run integrity validation
        issues = run_all_validations(new_record, db)
        if issues:
            issues_flagged += len(issues)
            for iss in issues:
                val_issue = ValidationIssue(
                    id=uuid.uuid4(),
                    record_id=new_record.id,
                    rule_code=iss.get("rule_code", "UNKNOWN"),
                    severity=iss.get("severity", "warning"),
                    description=iss.get("description", "Discrepancy detected"),
                    affected_field=iss.get("affected_field"),
                    expected_condition=iss.get("expected_condition"),
                    observed_condition=iss.get("observed_condition"),
                    status="open",
                )
                db.add(val_issue)

    db.commit()

    return {
        "status": "success",
        "ingestion_method": "direct_sis_erp_api",
        "institution_id": str(api_key.institution_id),
        "records_imported": imported,
        "discrepancies_detected": issues_flagged,
        "admission_cycle": body.admission_cycle,
    }
