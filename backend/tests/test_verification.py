import uuid
from app.services.verification import (
    issue_credential,
    verify_credential_token,
    generate_qr_bytes,
    mock_provider,
)


def test_mock_provider():
    res = mock_provider.verify_identifier("DEMO-APAAR-0001")
    assert res["status"] == "mock_verified"
    assert res["status"] != "verified"
    assert "reference" in res


def test_credential_issue_and_verify(db_session, test_student):
    claims = {"student_name": "Test Student", "program": "CS"}
    cred, token = issue_credential(
        record_id=test_student.id,
        subject_reference="DEMO-REF-001",
        claims=claims,
        db=db_session,
        expire_hours=24,
    )
    db_session.commit()

    # Verify valid token
    result = verify_credential_token(token, db_session)
    assert result["valid"] is True
    assert result["result"] == "success"
    assert result["claims"]["student_name"] == "Test Student"

    # Tampered token
    tampered = token[:-4] + "fake"
    bad_result = verify_credential_token(tampered, db_session)
    assert bad_result["valid"] is False


def test_qr_generation():
    png_bytes = generate_qr_bytes("DEMO-APAAR-QR-DATA")
    assert png_bytes[:8] == b"\x89PNG\r\n\x1a\n"
