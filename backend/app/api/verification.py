import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.student import StudentRecord
from app.models.verification import VerificationCredential
from app.services.verification import (
    issue_credential,
    verify_credential_token,
    generate_qr_bytes,
    revoke_credential,
    record_verification_event,
)

router = APIRouter()


class VerificationRequest(BaseModel):
    record_id: uuid.UUID
    purpose: str
    claims: Optional[Dict[str, Any]] = None


class VerifyTokenRequest(BaseModel):
    token: str


@router.post("/verification-requests")
def request_verification(
    body: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(StudentRecord).filter(StudentRecord.id == body.record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Student record not found.")

    subject_reference = f"APAAR-REF-{str(uuid.uuid4())[:8].upper()}"

    claims = body.claims or {
        "student_name": record.student_name,
        "program_id": str(record.program_id),
        "admission_cycle": record.admission_cycle,
        "admission_status": record.admission_status,
        "institution_id": str(record.institution_id),
    }

    credential, token = issue_credential(
        record_id=record.id,
        subject_reference=subject_reference,
        claims=claims,
        db=db,
        purpose=body.purpose or "admission_verification",
    )

    record_verification_event(
        db=db,
        result="success",
        purpose=body.purpose or "admission_verification",
        claims_requested=list(claims.keys()),
        verification_method="api",
        requester_id=current_user.id,
        credential_id=credential.id,
    )

    db.commit()

    return {
        "credential_id": str(credential.id),
        "subject_reference": subject_reference,
        "token": token,
        "purpose": body.purpose or "admission_verification",
        "signature_algorithm": "RS256",
        "expires_at": credential.expires_at.isoformat(),
        "credential_status": credential.credential_status,
        "note": "DEMONSTRATION ONLY — Asymmetrically signed with RSA-2048 (RS256)",
    }


@router.get("/verification/{credential_id}/status")
def get_credential_status(
    credential_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    cred = db.query(VerificationCredential).filter(VerificationCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found.")

    return {
        "credential_id": str(cred.id),
        "subject_reference": cred.subject_reference,
        "status": cred.credential_status,
        "issued_at": cred.issued_at.isoformat(),
        "expires_at": cred.expires_at.isoformat(),
        "revoked_at": cred.revoked_at.isoformat() if cred.revoked_at else None,
    }


@router.get("/verification/{credential_id}/qr")
def get_credential_qr(
    credential_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    cred = db.query(VerificationCredential).filter(VerificationCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found.")

    qr_bytes = generate_qr_bytes(cred.token)
    return Response(content=qr_bytes, media_type="image/png")


@router.post("/credentials/{credential_id}/revoke")
def revoke_credential_endpoint(
    credential_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = revoke_credential(credential_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Credential not found.")
    db.commit()
    return {"message": "Credential revoked successfully."}


@router.post("/verification/verify-token")
def verify_token_endpoint(
    body: VerifyTokenRequest,
    db: Session = Depends(get_db),
):
    result = verify_credential_token(body.token, db)
    return result


@router.get("/verification/{credential_id}/receipt")
def get_verification_receipt(
    credential_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Generate an authoritative verifiable credential receipt containing
    cryptographic proof metadata, issuer signature reference, and demonstration status.
    """
    cred = db.query(VerificationCredential).filter(VerificationCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found.")

    record = db.query(StudentRecord).filter(StudentRecord.id == cred.record_id).first()

    return {
        "receipt_id": f"VR-{str(cred.id)[:8].upper()}",
        "credential_id": str(cred.id),
        "subject_reference": cred.subject_reference,
        "issuer": cred.issuer_id,
        "issued_at": cred.issued_at.isoformat(),
        "expires_at": cred.expires_at.isoformat(),
        "revoked_at": cred.revoked_at.isoformat() if cred.revoked_at else None,
        "status": cred.credential_status,
        "verification_method": "RS256 Asymmetric RSA-2048 Digital Signature (RFC 7517 JWKS)",
        "jwks_uri": "/api/v1/.well-known/jwks.json",
        "provenance": {
            "environment": "APAAR Verify Asymmetric PKI Sandbox",
            "assurance_level": "Level 2 - Asymmetrically Signed Verifiable Claims",
            "regulatory_standing": "Simulated prototype - not an official AICTE or APAAR credential",
        },
    }
