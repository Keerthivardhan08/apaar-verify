"""
Consent Management & Purpose Scoping API Router.
"""
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.student import StudentRecord
from app.services.consent import (
    list_available_purposes,
    get_purpose_spec,
    create_consent_record,
    get_student_consents,
    revoke_consent,
)

router = APIRouter(prefix="/consent", tags=["Consent & Purpose Scoping"])


class CreateConsentRequest(BaseModel):
    student_id: uuid.UUID
    purpose: str
    expires_in_days: int = 90
    requester_entity: Optional[str] = None
    notes: Optional[str] = None


@router.get("/purposes", summary="List Available Verification Purposes")
async def get_purposes():
    """
    Returns all recognized verification purposes, descriptions, and the
    exact minimal claims permitted under each purpose.
    """
    return list_available_purposes()


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Student Verification Consent")
async def create_consent(
    data: CreateConsentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Grant explicit consent for a student record to be verified under a specific purpose.
    """
    student = db.query(StudentRecord).filter(StudentRecord.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    consent = create_consent_record(
        db=db,
        student_id=data.student_id,
        purpose=data.purpose,
        expires_in_days=data.expires_in_days,
        requester_entity=data.requester_entity,
        notes=data.notes,
    )
    return {
        "id": str(consent.id),
        "student_id": str(consent.student_id),
        "purpose": consent.verifier_purpose,
        "permitted_claims": consent.permitted_claims,
        "consent_token": consent.consent_token,
        "consent_status": consent.consent_status,
        "granted_at": consent.granted_at.isoformat(),
        "expires_at": consent.expires_at.isoformat(),
    }


@router.get("/student/{student_id}", summary="Get Consents for Student Record")
async def list_consents_for_student(
    student_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all consent records for a given student.
    """
    consents = get_student_consents(db, student_id)
    return [
        {
            "id": str(c.id),
            "student_id": str(c.student_id),
            "purpose": c.verifier_purpose,
            "permitted_claims": c.permitted_claims,
            "consent_token": c.consent_token,
            "consent_status": c.consent_status,
            "requester_entity": c.requester_entity,
            "granted_at": c.granted_at.isoformat(),
            "expires_at": c.expires_at.isoformat(),
        }
        for c in consents
    ]


@router.delete("/{consent_id}", summary="Revoke Student Consent")
async def delete_consent(
    consent_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Revoke a previously granted verification consent record immediately.
    """
    success = revoke_consent(db, consent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Consent record not found")
    return {"message": "Consent revoked successfully", "consent_id": str(consent_id)}
