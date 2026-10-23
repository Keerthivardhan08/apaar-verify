import uuid
from datetime import date
from app.models.student import StudentRecord
from app.services.validation import (
    check_required_fields,
    check_identifier_format,
    check_category_inconsistency,
)


def test_required_fields_rule():
    # Record with missing required fields
    rec = StudentRecord(
        id=uuid.uuid4(),
        institution_id=uuid.uuid4(),
        program_id=uuid.uuid4(),
        admission_cycle="2026-27",
        institution_student_id="",  # Missing
        student_name="",            # Missing
        admission_category="general",
        admission_status="admitted",
        nri_category="not_applicable",
        oci_status="not_applicable",
        foreign_national_status="not_applicable",
        supernumerary_category="none",
    )
    issues = check_required_fields(rec)
    codes = [i["rule_code"] for i in issues]
    fields = [i["affected_field"] for i in issues]
    assert "REQUIRED_FIELD_MISSING" in codes
    assert "student_name" in fields
    assert "institution_student_id" in fields


def test_identifier_format_rule():
    # Invalid format identifier
    rec = StudentRecord(
        id=uuid.uuid4(),
        institution_id=uuid.uuid4(),
        program_id=uuid.uuid4(),
        admission_cycle="2026-27",
        institution_student_id="STU-1",
        student_name="Test Student",
        identity_reference="INVALID_FORMAT_TEST",
        admission_category="general",
        admission_status="admitted",
        nri_category="not_applicable",
        oci_status="not_applicable",
        foreign_national_status="not_applicable",
        supernumerary_category="none",
    )
    issues = check_identifier_format(rec)
    assert len(issues) == 1
    assert issues[0]["rule_code"] == "APAAR_FORMAT_INVALID"
    assert issues[0]["severity"] == "high"


def test_category_inconsistency_rule():
    # NRI applicable but admission_category=general
    rec = StudentRecord(
        id=uuid.uuid4(),
        institution_id=uuid.uuid4(),
        program_id=uuid.uuid4(),
        admission_cycle="2026-27",
        institution_student_id="STU-2",
        student_name="NRI Student",
        identity_reference="DEMO-APAAR-0001",
        admission_category="general", # inconsistent
        admission_status="admitted",
        nri_category="applicable",
        oci_status="not_applicable",
        foreign_national_status="not_applicable",
        supernumerary_category="none",
    )
    issues = check_category_inconsistency(rec)
    assert any(i["rule_code"] == "CATEGORY_INCONSISTENCY" for i in issues)
