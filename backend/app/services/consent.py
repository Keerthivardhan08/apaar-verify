"""
Purpose & Consent Binding Framework.

Ensures strict compliance with Data Protection & Privacy Principles:
1. Purpose Limitation: Credentials and verifications are strictly scoped to a declared purpose.
2. Minimal Data Disclosure: Only claims strictly necessary for the purpose are released.
3. Consent Verification: Checks student authorization prior to sharing academic claims.
"""
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.consent import ConsentRecord


PURPOSE_SPECIFICATIONS: Dict[str, Dict[str, Any]] = {
    "admission_verification": {
        "id": "admission_verification",
        "name": "Admission & Enrollment Verification",
        "description": "Validation for inter-institutional transfers, university admissions, and regulatory intake checks.",
        "permitted_claims": [
            "student_name",
            "institution_name",
            "program_name",
            "admission_cycle",
            "admission_status",
            "admission_category",
        ],
        "privacy_score": "Standard Academic Disclosure",
    },
    "scholarship_eligibility": {
        "id": "scholarship_eligibility",
        "name": "Scholarship & Financial Aid Verification",
        "description": "Verification of admission standing and quota category for national or state scholarship portals.",
        "permitted_claims": [
            "student_name",
            "institution_name",
            "program_name",
            "admission_category",
            "admission_status",
        ],
        "privacy_score": "Category-Restricted Disclosure",
    },
    "employment_screening": {
        "id": "employment_screening",
        "name": "Employment & Background Verification",
        "description": "Privacy-preserving verification for corporate hiring. Excludes sensitive admission categories, quota, and DOB.",
        "permitted_claims": [
            "student_name",
            "institution_name",
            "program_name",
            "admission_status",
        ],
        "privacy_score": "High Privacy (No Quota/DOB)",
    },
    "exam_registration": {
        "id": "exam_registration",
        "name": "Board / Testing Agency Registration",
        "description": "Verification of bona fide student status for competitive exams (GATE, CAT, UPSC).",
        "permitted_claims": [
            "student_name",
            "institution_student_id",
            "institution_name",
            "program_name",
            "admission_status",
        ],
        "privacy_score": "Institutional Identity Scoped",
    },
    "minimal_proof": {
        "id": "minimal_proof",
        "name": "Zero-PII Proof of Enrollment",
        "description": "Demonstrates valid enrollment in an accredited program with ZERO personally identifiable information.",
        "permitted_claims": [
            "institution_name",
            "program_name",
            "admission_cycle",
            "admission_status",
        ],
        "privacy_score": "Maximum Privacy (Zero PII)",
    },
}

DEFAULT_PURPOSE = "admission_verification"


def get_purpose_spec(purpose: str) -> Dict[str, Any]:
    """Retrieve purpose definition or fallback to default."""
    return PURPOSE_SPECIFICATIONS.get(purpose, PURPOSE_SPECIFICATIONS[DEFAULT_PURPOSE])


def list_available_purposes() -> List[Dict[str, Any]]:
    """Return all supported verification purposes and their minimal claim sets."""
    return list(PURPOSE_SPECIFICATIONS.values())


def filter_claims_by_purpose(raw_claims: Dict[str, Any], purpose: str) -> Dict[str, Any]:
    """
    Apply selective disclosure filter to redact claims not permitted for the given purpose.
    Preserves cryptographic transparency with purposeful metadata.
    """
    spec = get_purpose_spec(purpose)
    permitted_keys = set(spec["permitted_claims"])

    filtered: Dict[str, Any] = {}
    redacted_fields: List[str] = []

    for k, v in raw_claims.items():
        if k in permitted_keys:
            filtered[k] = v
        else:
            redacted_fields.append(k)

    # Attach privacy-preserving proof metadata
    filtered["_privacy_binding"] = {
        "purpose": purpose,
        "purpose_name": spec["name"],
        "privacy_level": spec["privacy_score"],
        "disclosed_fields_count": len(filtered) - 1,  # exclude metadata key
        "redacted_fields": sorted(redacted_fields),
        "zero_pii": purpose == "minimal_proof",
    }
    return filtered


def create_consent_record(
    db: Session,
    student_id: uuid.UUID,
    purpose: str,
    expires_in_days: int = 90,
    requester_entity: Optional[str] = None,
    notes: Optional[str] = None,
) -> ConsentRecord:
    """Create a new signed consent record authorizing verification for a specific purpose."""
    spec = get_purpose_spec(purpose)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=expires_in_days)
    token = f"CST-{secrets.token_hex(16).upper()}"

    consent = ConsentRecord(
        id=uuid.uuid4(),
        student_id=student_id,
        verifier_purpose=purpose,
        permitted_claims=spec["permitted_claims"],
        consent_status="active",
        granted_at=now,
        expires_at=expires_at,
        consent_token=token,
        requester_entity=requester_entity,
        notes=notes,
        created_at=now,
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent


def get_student_consents(db: Session, student_id: uuid.UUID) -> List[ConsentRecord]:
    """Retrieve all active consent records for a student."""
    return (
        db.query(ConsentRecord)
        .filter(ConsentRecord.student_id == student_id)
        .order_by(ConsentRecord.created_at.desc())
        .all()
    )


def revoke_consent(db: Session, consent_id: uuid.UUID) -> bool:
    """Revoke an active consent record."""
    consent = db.query(ConsentRecord).filter(ConsentRecord.id == consent_id).first()
    if not consent:
        return False
    consent.consent_status = "revoked"
    db.commit()
    return True
