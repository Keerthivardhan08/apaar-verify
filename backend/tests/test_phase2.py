"""
Phase 2 Comprehensive Test Suite.

Verifies:
1. PKI & Dynamic RFC 7517 JWKS generation.
2. Asymmetric RS256 token signing and public-key verification.
3. Pluggable identity verification provider adapters (Mock, Sandboxed DigiLocker, Official APAAR).
4. Provider batch synchronization API endpoint (/integrations/{provider}/sync).
5. Purpose & Consent binding with minimal claim disclosure.
6. Public verification API endpoint honoring asymmetric PKI validation.
"""
import uuid
import pytest
from jose import jwt

from app.services.pki import pki_service
from app.services.provider_adapter import (
    get_verification_provider,
    list_available_providers,
    MockVerificationProvider,
    SandboxedDigiLockerProvider,
    OfficialAPAARProvider,
)
from app.services.consent import (
    filter_claims_by_purpose,
    list_available_purposes,
    get_purpose_spec,
    create_consent_record,
    get_student_consents,
    revoke_consent,
)
from app.services.verification import issue_credential, verify_credential_token
from app.models.student import StudentRecord, StudentIdentity


def test_pki_key_generation_and_jwks():
    """Verify RSA-2048 key creation and RFC 7517 compliance."""
    jwks = pki_service.get_jwks()
    assert "keys" in jwks
    assert len(jwks["keys"]) >= 1

    primary_key = jwks["keys"][0]
    assert primary_key["kty"] == "RSA"
    assert primary_key["use"] == "sig"
    assert primary_key["alg"] == "RS256"
    assert primary_key["kid"] == pki_service.key_id
    assert primary_key["e"] == "AQAB"  # 65537 encoded
    assert len(primary_key["n"]) > 200  # 2048-bit modulus base64url


def test_rs256_signing_and_verification():
    """Verify asymmetric token signing with private key and verification with public key."""
    test_payload = {
        "sub": "TEST-STUDENT-SUBJECT",
        "role": "student_credential",
        "demo": True,
    }

    signed_token = pki_service.sign_jwt(test_payload)
    assert isinstance(signed_token, str)

    header = jwt.get_unverified_header(signed_token)
    assert header["alg"] == "RS256"
    assert header["kid"] == pki_service.key_id

    decoded = pki_service.verify_jwt(signed_token)
    assert decoded["sub"] == "TEST-STUDENT-SUBJECT"
    assert decoded["demo"] is True


def test_jwks_api_endpoints(client):
    """Test public JWKS and PKI metadata HTTP endpoints."""
    # Test /.well-known/jwks.json
    resp = client.get("/api/v1/.well-known/jwks.json")
    assert resp.status_code == 200
    data = resp.json()
    assert "keys" in data
    assert data["keys"][0]["alg"] == "RS256"

    # Test /.well-known/pki/metadata
    resp_meta = client.get("/api/v1/.well-known/pki/metadata")
    assert resp_meta.status_code == 200
    meta = resp_meta.json()
    assert meta["algorithm"] == "RS256"
    assert meta["status"] == "active"
    assert "public_key_pem" in meta


def test_provider_adapters():
    """Test individual behavior of pluggable identity provider adapters."""
    # 1. Mock Provider: STRICTLY returns mock_verified
    mock = get_verification_provider("mock")
    res_mock = mock.verify_identifier("DEMO-STD-1234")
    assert res_mock["status"] == "mock_verified"
    assert "mock" in res_mock["provider"]

    # 2. Sandboxed DigiLocker: returns verified for valid formats
    dl = get_verification_provider("sandboxed_digilocker")
    res_dl_valid = dl.verify_identifier("DL-ABC-987654")
    assert res_dl_valid["status"] == "verified"
    assert "DL-SBX" in res_dl_valid["provider_reference"]

    # Test seeded failure in DigiLocker
    res_dl_fail = dl.verify_identifier("DL-INVALID-CODE")
    assert res_dl_fail["status"] == "failed"

    # 3. Official APAAR Gateway: returns high-assurance verified
    apaar = get_verification_provider("official_apaar")
    res_apaar_valid = apaar.verify_identifier("998877665544")
    assert res_apaar_valid["status"] == "verified"
    assert "APAAR-NAT" in res_apaar_valid["provider_reference"]

    # 4. Registry listing
    providers = list_available_providers()
    assert len(providers) >= 3
    names = [p["key"] for p in providers]
    assert "mock" in names
    assert "sandboxed_digilocker" in names
    assert "official_apaar" in names


def test_purpose_claim_filtering():
    """Test selective claim disclosure to enforce privacy preservation."""
    full_student_claims = {
        "student_name": "Keerthi Sharma",
        "institution_name": "IIT Demo",
        "program_name": "Computer Science & Engineering",
        "admission_cycle": "2026-27",
        "admission_status": "admitted",
        "admission_category": "obc",
        "date_of_birth": "2004-05-12",
        "institution_student_id": "IIT-CSE-001",
    }

    # Employment Screening: MUST NOT contain admission_category or date_of_birth
    emp_claims = filter_claims_by_purpose(full_student_claims, "employment_screening")
    assert "student_name" in emp_claims
    assert "institution_name" in emp_claims
    assert "admission_status" in emp_claims
    assert "admission_category" not in emp_claims
    assert "date_of_birth" not in emp_claims
    assert "institution_student_id" not in emp_claims
    assert emp_claims["_privacy_binding"]["purpose"] == "employment_screening"

    # Minimal Proof: MUST NOT contain student_name or personal IDs
    minimal_claims = filter_claims_by_purpose(full_student_claims, "minimal_proof")
    assert "student_name" not in minimal_claims
    assert "institution_name" in minimal_claims
    assert "admission_status" in minimal_claims
    assert minimal_claims["_privacy_binding"]["zero_pii"] is True


def test_consent_management(db_session, test_student):
    """Test student verification consent creation, retrieval, and revocation."""
    consent = create_consent_record(
        db=db_session,
        student_id=test_student.id,
        purpose="employment_screening",
        expires_in_days=30,
        requester_entity="Tech Global Placements",
    )
    assert consent.consent_status == "active"
    assert consent.verifier_purpose == "employment_screening"
    assert consent.consent_token.startswith("CST-")

    # List consents
    consents = get_student_consents(db_session, test_student.id)
    assert len(consents) >= 1
    assert consents[0].id == consent.id

    # Revoke consent
    revoked = revoke_consent(db_session, consent.id)
    assert revoked is True

    updated = get_student_consents(db_session, test_student.id)
    assert updated[0].consent_status == "revoked"


def test_asymmetric_credential_issuance_and_verification(db_session, test_student):
    """Test end-to-end issuance of RS256 credentials and verification."""
    claims = {
        "student_name": test_student.student_name,
        "institution_id": str(test_student.institution_id),
        "admission_status": test_student.admission_status,
    }

    cred, token = issue_credential(
        record_id=test_student.id,
        subject_reference="SUBJ-REF-TEST-99",
        claims=claims,
        db=db_session,
        purpose="admission_verification",
        use_asymmetric_pki=True,
    )
    db_session.commit()

    # Verify token
    result = verify_credential_token(token, db_session)
    assert result["valid"] is True
    assert result["result"] == "success"
    assert result["signature_algorithm"] == "RS256"
    assert result["asymmetric_pki_verified"] is True
    assert result["purpose"] == "admission_verification"


def test_provider_sync_api_flow(client, admin_token):
    """Test calling the provider sync API endpoint."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Query available providers
    resp_prov = client.get("/api/v1/integrations/providers", headers=headers)
    assert resp_prov.status_code == 200
    providers = resp_prov.json()
    assert any(p["key"] == "sandboxed_digilocker" for p in providers)

    # 2. Trigger sync
    sync_payload = {
        "force_refresh": True,
    }
    resp_sync = client.post(
        "/api/v1/integrations/sandboxed_digilocker/sync",
        headers=headers,
        json=sync_payload,
    )
    assert resp_sync.status_code == 200
    sync_data = resp_sync.json()
    assert sync_data["status"] == "completed"
    assert "records_processed" in sync_data
    assert sync_data["provider"] == "sandboxed_digilocker"
