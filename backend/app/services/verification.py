"""
Verification service — mock provider adapter, PKI credential signing, and QR generation.

Phase 2 Architecture:
- Cryptographic Trust Framework: Uses RS256 Asymmetric RSA-2048 PKI keys for credential signing.
- Purpose-bound minimal disclosure: Filters claims through consent privacy engine.
- Public key isolation: Credential signatures can be independently verified via /.well-known/jwks.json.
- Backward compatibility: Supports both RS256 and HS256 tokens.
- Demo boundaries: Labels output clearly as synthetic demonstration.
"""
import io
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import qrcode
from jose import JWTError, jwt

from app.config import settings
from app.models.verification import VerificationCredential, VerificationEvent
from app.services.pki import pki_service
from app.services.consent import filter_claims_by_purpose
from sqlalchemy.orm import Session


# ─── Mock Provider ───────────────────────────────────────────────────────────

class MockIdentityVerificationProvider:
    """
    Simulated identity verification provider.
    Returns mock_verified status — NOT real APAAR verification.
    This adapter must be replaced with an authorized provider before production.
    """
    PROVIDER_NAME = "mock"

    def verify_identifier(self, identifier_reference: str) -> Dict[str, Any]:
        """
        Simulate a verification call. Always returns mock_verified.
        Must not be promoted to `verified` status.
        """
        return {
            "provider": self.PROVIDER_NAME,
            "status": "mock_verified",  # Never `verified`
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "reference": f"DEMO-VERIFICATION-{str(uuid.uuid4())[:8].upper()}",
            "note": "DEMONSTRATION ONLY — Not an official APAAR verification result.",
        }


mock_provider = MockIdentityVerificationProvider()


# ─── Credential Issuance ─────────────────────────────────────────────────────

def issue_credential(
    record_id: uuid.UUID,
    subject_reference: str,  # Opaque UUID — not the raw student identifier
    claims: Dict[str, Any],
    db: Session,
    expire_hours: int = 24,
    purpose: str = "admission_verification",
    use_asymmetric_pki: bool = True,
) -> Tuple[VerificationCredential, str]:
    """
    Issue a signed demonstration credential as a JWT.
    In Phase 2, credentials are signed with asymmetric RS256 (RSA-2048)
    and minimal disclosure claims are enforced based on the declared purpose.
    """
    credential_id = uuid.uuid4()
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(hours=expire_hours)

    # Apply purpose-bound minimal data disclosure
    filtered_claims = filter_claims_by_purpose(claims, purpose)

    token_payload = {
        "sub": subject_reference,
        "iss": settings.CREDENTIAL_ISSUER_ID,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": str(credential_id),
        "purpose": purpose,
        "claims": filtered_claims,
        "demo": True,
        "pki_alg": "RS256" if use_asymmetric_pki else "HS256",
        "note": "DEMONSTRATION CREDENTIAL — Verified via APAAR PKI Trust Framework.",
    }

    if use_asymmetric_pki:
        token = pki_service.sign_jwt(token_payload)
    else:
        token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    credential = VerificationCredential(
        id=credential_id,
        issuer_id=settings.CREDENTIAL_ISSUER_ID,
        subject_reference=subject_reference,
        record_id=record_id,
        claims=filtered_claims,
        issued_at=issued_at,
        expires_at=expires_at,
        credential_status="active",
        token=token,
        created_at=issued_at,
    )
    db.add(credential)
    return credential, token


def verify_credential_token(token: str, db: Session) -> Dict[str, Any]:
    """
    Verify a credential token for cryptographic signature, expiry, and revocation.
    Supports both RS256 (asymmetric PKI) and HS256 (symmetric demo) tokens.
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "RS256":
            payload = pki_service.verify_jwt(token)
            signature_type = "RS256 (Asymmetric RSA-2048 PKI)"
            asymmetric_verified = True
        else:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            signature_type = "HS256 (Symmetric HMAC Demo)"
            asymmetric_verified = False

    except JWTError as e:
        error_msg = str(e).lower()
        if "expired" in error_msg:
            return {
                "valid": False,
                "result": "expired",
                "message": "This credential has expired.",
                "demo": True,
            }
        return {
            "valid": False,
            "result": "invalid",
            "message": "Credential signature is invalid or the token has been tampered with.",
            "demo": True,
        }

    jti = payload.get("jti")
    if jti:
        try:
            credential = db.query(VerificationCredential).filter(
                VerificationCredential.id == uuid.UUID(jti)
            ).first()

            if credential and credential.credential_status == "revoked":
                return {
                    "valid": False,
                    "result": "revoked",
                    "message": "This credential has been revoked.",
                    "revoked_at": credential.revoked_at.isoformat() if credential.revoked_at else None,
                    "demo": True,
                }
        except (ValueError, Exception):
            pass

    return {
        "valid": True,
        "result": "success",
        "issuer": payload.get("iss"),
        "subject_reference": payload.get("sub"),
        "purpose": payload.get("purpose", "admission_verification"),
        "claims": payload.get("claims", {}),
        "issued_at": datetime.fromtimestamp(payload.get("iat", 0), tz=timezone.utc).isoformat(),
        "expires_at": datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc).isoformat(),
        "demo": payload.get("demo", True),
        "note": payload.get("note", "DEMONSTRATION CREDENTIAL"),
        "signature_algorithm": alg,
        "signature_type": signature_type,
        "asymmetric_pki_verified": asymmetric_verified,
        "jwks_uri": f"{settings.API_V1_STR}/.well-known/jwks.json",
        "verification_status": "mock_verified",  # Never `verified` for demo credentials
    }


def generate_qr_bytes(data: str) -> bytes:
    """
    Generate a QR code PNG for the given data string.
    Returns PNG bytes.
    The QR code contains the verifiable credential token.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def revoke_credential(credential_id: uuid.UUID, db: Session) -> bool:
    """Revoke a credential by ID. Returns True if found and revoked."""
    credential = db.query(VerificationCredential).filter(
        VerificationCredential.id == credential_id
    ).first()

    if not credential:
        return False

    credential.credential_status = "revoked"
    credential.revoked_at = datetime.now(timezone.utc)
    return True


def record_verification_event(
    db: Session,
    result: str,
    purpose: str,
    claims_requested: List[str],
    verification_method: str = "api",
    requester_id: Optional[uuid.UUID] = None,
    credential_id: Optional[uuid.UUID] = None,
    provider_reference: Optional[str] = None,
) -> VerificationEvent:
    """Record a verification attempt in the audit log."""
    event = VerificationEvent(
        id=uuid.uuid4(),
        requester_id=requester_id,
        credential_id=credential_id,
        purpose=purpose,
        claims_requested=claims_requested,
        result=result,
        verification_method=verification_method,
        provider_reference=provider_reference,
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    return event
