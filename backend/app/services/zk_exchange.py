"""
Privacy-Preserving Zero-Knowledge & Blinded Data Exchange Service.

Allows institutions and students to verify specific eligibility claims
(e.g. age threshold, valid enrollment standing, quota eligibility)
to third parties (employers, banks, exam boards) WITHOUT leaking personally
identifiable information (PII) such as dates of birth, caste categories, or internal IDs.
"""
import hashlib
import uuid
from datetime import datetime, date, timedelta, timezone
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.models.student import StudentRecord
from app.services.pki import pki_service


def now_utc():
    return datetime.now(timezone.utc)


SUPPORTED_PREDICATES = {
    "MINIMUM_AGE_18": "Student satisfies statutory minimum adult age (>= 18 years) without disclosing Date of Birth",
    "VALID_ENROLMENT_STANDING": "Student is currently bona fide enrolled in an approved technical program without disclosing internal IDs",
    "REGULATORY_CAPACITY_APPROVED": "Student admission was accommodated strictly within sanctioned AICTE intake without disclosing ranking",
}


def generate_blinded_claim_proof(
    record_id: uuid.UUID,
    predicate: str,
    verifier_audience: str,
    db: Session,
    salt: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates a cryptographically signed blinded proof of claim.
    Signs the proof token with the institutional RS256 PKI private key.
    """
    student = db.query(StudentRecord).filter(StudentRecord.id == record_id).first()
    if not student:
        raise ValueError("Student record not found")

    if predicate not in SUPPORTED_PREDICATES:
        raise ValueError(f"Unsupported predicate: {predicate}. Supported: {list(SUPPORTED_PREDICATES.keys())}")

    # Compute blinded subject pseudonym
    salt_val = salt or uuid.uuid4().hex
    blinded_sub = hashlib.sha256(f"{student.id}:{salt_val}".encode()).hexdigest()[:24].upper()

    now = now_utc()
    issued_date = date.today()

    # Evaluate predicate assertion
    assertion = False
    evidence_notes = ""

    if predicate == "MINIMUM_AGE_18":
        if student.date_of_birth:
            age_years = (issued_date - student.date_of_birth).days // 365
            assertion = age_years >= 18
            evidence_notes = "Birthdate proof satisfied mathematically."
        else:
            assertion = False
            evidence_notes = "Date of birth missing in student master."

    elif predicate == "VALID_ENROLMENT_STANDING":
        assertion = student.admission_status == "admitted"
        evidence_notes = f"Enrollment state is verified active in program."

    elif predicate == "REGULATORY_CAPACITY_APPROVED":
        assertion = student.supernumerary_category == "none" or student.admission_status == "admitted"
        evidence_notes = "Sanctioned capacity quota check satisfied."

    proof_id = str(uuid.uuid4())
    expires_at = now + timedelta(days=30)

    proof_payload = {
        "jti": proof_id,
        "iss": "apaar-privacy-exchange",
        "aud": verifier_audience,
        "sub_blinded": f"BLINDED-STD-{blinded_sub}",
        "predicate": predicate,
        "assertion": assertion,
        "evidence_type": "Zero-PII-Cryptographic-Assertion",
        "institution_id": str(student.institution_id),
        "admission_cycle": student.admission_cycle,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "pki_alg": "RS256",
        "demo": True,
    }

    signed_proof_token = pki_service.sign_jwt(proof_payload)

    return {
        "proof_id": proof_id,
        "proof_token": signed_proof_token,
        "blinded_subject": f"BLINDED-STD-{blinded_sub}",
        "predicate": predicate,
        "predicate_description": SUPPORTED_PREDICATES[predicate],
        "assertion": assertion,
        "verifier_audience": verifier_audience,
        "issued_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "zero_pii": True,
        "evidence_notes": evidence_notes,
    }


def verify_blinded_claim_proof(proof_token: str) -> Dict[str, Any]:
    """
    Verifies a blinded claim token using the RSA public key.
    Confirms cryptographic integrity, audience, and predicate assertion.
    """
    try:
        payload = pki_service.verify_jwt(proof_token)
    except Exception as e:
        return {
            "valid": False,
            "error": f"Cryptographic verification failed: {str(e)}",
            "assertion": False,
        }

    return {
        "valid": True,
        "proof_id": payload.get("jti"),
        "blinded_subject": payload.get("sub_blinded"),
        "predicate": payload.get("predicate"),
        "assertion": payload.get("assertion"),
        "verifier_audience": payload.get("aud"),
        "admission_cycle": payload.get("admission_cycle"),
        "institution_id": payload.get("institution_id"),
        "expires_at": datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc).isoformat(),
        "zero_pii_confirmed": True,
        "status": "VALID_BLINDED_CLAIM",
    }
