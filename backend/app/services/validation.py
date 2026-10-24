"""
Validation Engine — 9 deterministic rules for the Admission Integrity Engine.

Each rule returns a list of issue dicts. All issues include:
- rule_code
- severity
- description
- affected_field
- expected_condition
- observed_condition (sensitive values masked)
- evidence_reference

Rules are testable, versioned, and linked to clear explanations.
No ML or opaque scoring is used at the rule level.
"""
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.student import StudentRecord, StudentRecordVersion
from app.models.institution import IntakeLimit
from app.models.validation import ValidationIssue


REQUIRED_FIELDS = [
    "student_name",
    "institution_student_id",
    "admission_cycle",
    "admission_category",
    "admission_status",
    "nri_category",
    "oci_status",
    "foreign_national_status",
    "supernumerary_category",
]

# Demo format: DEMO-XXXX (4-20 alphanumeric) or 12-digit number
# This is a FICTIONAL format — not the official APAAR format
DEMO_IDENTIFIER_PATTERN = re.compile(r"^DEMO-[A-Z0-9_-]{4,25}$|^[0-9]{12}$")

VALID_ADMISSION_CATEGORIES = {
    "general", "obc", "sc", "st", "ews", "nri", "oci",
    "foreign_national", "management_quota"
}


def _mask_value(value: str) -> str:
    """Mask most of a sensitive value, revealing only last 4 chars."""
    if not value or len(value) <= 4:
        return "****"
    return "*" * (len(value) - 4) + value[-4:]


def check_required_fields(record: StudentRecord) -> List[Dict[str, Any]]:
    """
    Rule 1: REQUIRED_FIELD_MISSING
    Detect missing or empty required fields.
    """
    issues = []
    for field in REQUIRED_FIELDS:
        value = getattr(record, field, None)
        if value is None or (isinstance(value, str) and not value.strip()):
            issues.append({
                "rule_code": "REQUIRED_FIELD_MISSING",
                "severity": "critical",
                "description": f"Required field '{field}' is missing or empty.",
                "affected_field": field,
                "expected_condition": f"Field '{field}' must have a non-empty value.",
                "observed_condition": "Field is absent or blank.",
                "evidence_reference": {"field": field, "record_id": str(record.id)},
            })
    return issues


def check_identifier_format(record: StudentRecord) -> List[Dict[str, Any]]:
    """
    Rule 2: APAAR_FORMAT_INVALID
    Validate identifier against approved DEMO format.
    NOTE: Uses a fictional demo format. Not the official APAAR format.
    """
    issues = []
    ref = record.identity_reference
    if not ref:
        return issues  # Covered by REQUIRED_FIELD_MISSING or APAAR_NOT_VERIFIED

    if not DEMO_IDENTIFIER_PATTERN.match(ref.strip()):
        issues.append({
            "rule_code": "APAAR_FORMAT_INVALID",
            "severity": "high",
            "description": (
                "The identity reference does not match the demonstration format. "
                "[DEMO validation only — not the official APAAR format specification]"
            ),
            "affected_field": "identity_reference",
            "expected_condition": "Format: DEMO-[A-Z0-9]{4-20} or 12-digit number [DEMO]",
            "observed_condition": f"Provided value has format: {_mask_value(ref)}",
            "evidence_reference": {"masked_value": _mask_value(ref)},
        })
    return issues


def check_identity_verification_status(record: StudentRecord) -> List[Dict[str, Any]]:
    """
    Rule 3: APAAR_NOT_VERIFIED
    Flag records where identity has not been confirmed by an authorized provider.
    This is a follow-up requirement, not proof of invalidity.
    """
    issues = []
    if record.identity_verification_status in ("unverified", "pending", "unavailable"):
        issues.append({
            "rule_code": "APAAR_NOT_VERIFIED",
            "severity": "warning",
            "description": (
                "The student's identity reference has not been verified through an authorized provider. "
                "This is a pending action, not a finding of invalidity."
            ),
            "affected_field": "identity_verification_status",
            "expected_condition": "identity_verification_status should be 'mock_verified' or 'verified'.",
            "observed_condition": f"Current status: {record.identity_verification_status}",
            "evidence_reference": {"status": record.identity_verification_status},
        })
    return issues


def check_local_duplicates(record: StudentRecord, db: Session) -> List[Dict[str, Any]]:
    """
    Rule 4: DUPLICATE_LOCAL_RECORD
    Detect repeated enrollment in the same program + admission cycle.
    Uses identity_reference for matching within the same institution.
    """
    issues = []
    if not record.identity_reference:
        return issues

    duplicate = (
        db.query(StudentRecord)
        .filter(
            StudentRecord.institution_id == record.institution_id,
            StudentRecord.program_id == record.program_id,
            StudentRecord.admission_cycle == record.admission_cycle,
            StudentRecord.identity_reference == record.identity_reference,
            StudentRecord.id != record.id,
            StudentRecord.record_status != "rejected",
        )
        .first()
    )
    if duplicate:
        issues.append({
            "rule_code": "DUPLICATE_LOCAL_RECORD",
            "severity": "critical",
            "description": (
                "A record with the same identity reference exists in this program and admission cycle. "
                "This may indicate a duplicate enrollment."
            ),
            "affected_field": "identity_reference",
            "expected_condition": "Each identity reference should appear once per program and cycle.",
            "observed_condition": f"Duplicate found: record {str(duplicate.id)[:8]}...",
            "evidence_reference": {
                "duplicate_record_id": str(duplicate.id),
                "program_id": str(record.program_id),
                "admission_cycle": record.admission_cycle,
            },
        })
    return issues


def check_cross_institution_matches(record: StudentRecord, db: Session) -> List[Dict[str, Any]]:
    """
    Rule 5: POTENTIAL_CROSS_INSTITUTION_DUPLICATE
    Flag possible matching identity references at multiple institutions.
    A match is an investigation lead — not proof of misconduct.
    Legitimate transfers, historical records, etc. may explain matches.
    """
    issues = []
    if not record.identity_reference:
        return issues

    cross_match = (
        db.query(StudentRecord)
        .filter(
            StudentRecord.identity_reference == record.identity_reference,
            StudentRecord.institution_id != record.institution_id,
            StudentRecord.admission_cycle == record.admission_cycle,
            StudentRecord.id != record.id,
            StudentRecord.record_status != "rejected",
        )
        .first()
    )
    if cross_match:
        issues.append({
            "rule_code": "POTENTIAL_CROSS_INSTITUTION_DUPLICATE",
            "severity": "high",
            "description": (
                "This identity reference appears to be associated with a record at a different institution "
                "in the same admission cycle. This requires human investigation. "
                "Legitimate explanations include transfers or administrative corrections."
            ),
            "affected_field": "identity_reference",
            "expected_condition": "Each identity reference should appear at one institution per cycle.",
            "observed_condition": f"Matching record found at another institution (record: {str(cross_match.id)[:8]}...)",
            "evidence_reference": {
                "other_institution_id": str(cross_match.institution_id),
                "other_record_id": str(cross_match.id),
                "admission_cycle": record.admission_cycle,
            },
        })
    return issues


def check_intake_limits(record: StudentRecord, db: Session) -> List[Dict[str, Any]]:
    """
    Rule 6: INTAKE_EXCEEDED
    Compare reported enrollment with applicable authoritative intake.
    Does not divide by zero; treats missing intake as unavailable.
    """
    issues = []

    intake = (
        db.query(IntakeLimit)
        .filter(
            IntakeLimit.program_id == record.program_id,
            IntakeLimit.admission_cycle == record.admission_cycle,
            IntakeLimit.category == "total",
        )
        .first()
    )

    if not intake:
        # Covered separately by APPROVAL_DATA_MISSING
        return issues

    enrolled_count = (
        db.query(StudentRecord)
        .filter(
            StudentRecord.program_id == record.program_id,
            StudentRecord.admission_cycle == record.admission_cycle,
            StudentRecord.record_status.in_(["submitted", "accepted", "flagged", "under_review", "corrected"]),
        )
        .count()
    )

    if intake.approved_capacity <= 0:
        return issues  # Avoid division by zero; capacity=0 is an invalid configuration

    if enrolled_count > intake.approved_capacity:
        issues.append({
            "rule_code": "INTAKE_EXCEEDED",
            "severity": "critical",
            "description": (
                f"The number of enrolled students ({enrolled_count}) exceeds the approved intake "
                f"capacity ({intake.approved_capacity}) for this program and admission cycle."
            ),
            "affected_field": "program_id",
            "expected_condition": f"Enrollment ≤ approved capacity ({intake.approved_capacity}).",
            "observed_condition": f"Enrollment = {enrolled_count}, Capacity = {intake.approved_capacity}.",
            "evidence_reference": {
                "enrolled_count": enrolled_count,
                "approved_capacity": intake.approved_capacity,
                "source_type": intake.source_type,
                "source_reference": intake.source_reference,
            },
        })
    return issues


def check_category_inconsistency(record: StudentRecord) -> List[Dict[str, Any]]:
    """
    Rule 7: CATEGORY_INCONSISTENCY
    Detect mutually inconsistent or incomplete admission category combinations.
    Rules reflect documented policy logic — not team assumptions.
    """
    issues = []

    nri = record.nri_category == "applicable"
    oci = record.oci_status == "applicable"
    fn = record.foreign_national_status == "applicable"
    cat = record.admission_category

    # All three cannot be applicable simultaneously
    if nri and oci and fn:
        issues.append({
            "rule_code": "CATEGORY_INCONSISTENCY",
            "severity": "critical",
            "description": "NRI category, OCI status, and Foreign National status cannot all be applicable simultaneously.",
            "affected_field": "nri_category,oci_status,foreign_national_status",
            "expected_condition": "At most one of NRI, OCI, Foreign National should be applicable.",
            "observed_condition": "All three are marked as applicable.",
            "evidence_reference": {"nri_category": record.nri_category, "oci_status": record.oci_status, "foreign_national_status": record.foreign_national_status},
        })

    # NRI applicable but admission_category is not nri
    if nri and cat and cat != "nri":
        issues.append({
            "rule_code": "CATEGORY_INCONSISTENCY",
            "severity": "high",
            "description": "NRI category is marked as applicable, but the admission category is not 'nri'.",
            "affected_field": "admission_category",
            "expected_condition": "If nri_category=applicable, admission_category must be 'nri'.",
            "observed_condition": f"admission_category is '{cat}'.",
            "evidence_reference": {"admission_category": cat, "nri_category": record.nri_category},
        })

    # Foreign national applicable but admission_category is not foreign_national
    if fn and cat and cat != "foreign_national":
        issues.append({
            "rule_code": "CATEGORY_INCONSISTENCY",
            "severity": "high",
            "description": "Foreign National status is applicable but admission category is not 'foreign_national'.",
            "affected_field": "admission_category",
            "expected_condition": "If foreign_national_status=applicable, admission_category must be 'foreign_national'.",
            "observed_condition": f"admission_category is '{cat}'.",
            "evidence_reference": {"admission_category": cat, "foreign_national_status": record.foreign_national_status},
        })

    # Supernumerary NRI but NRI not applicable
    if record.supernumerary_category == "nri" and not nri:
        issues.append({
            "rule_code": "CATEGORY_INCONSISTENCY",
            "severity": "warning",
            "description": "Supernumerary category is 'nri' but nri_category is 'not_applicable'.",
            "affected_field": "supernumerary_category",
            "expected_condition": "supernumerary_category='nri' requires nri_category='applicable'.",
            "observed_condition": f"nri_category='{record.nri_category}'.",
            "evidence_reference": {"supernumerary_category": record.supernumerary_category},
        })

    return issues


def check_approval_data_missing(record: StudentRecord, db: Session) -> List[Dict[str, Any]]:
    """
    Rule 8: APPROVAL_DATA_MISSING
    Flag records for which no authoritative intake reference is available.
    """
    issues = []
    intake = (
        db.query(IntakeLimit)
        .filter(
            IntakeLimit.program_id == record.program_id,
            IntakeLimit.admission_cycle == record.admission_cycle,
        )
        .first()
    )
    if not intake:
        issues.append({
            "rule_code": "APPROVAL_DATA_MISSING",
            "severity": "warning",
            "description": (
                "No authoritative intake or approval data is available for this program and admission cycle. "
                "Capacity checks cannot be performed until reference data is loaded."
            ),
            "affected_field": "program_id",
            "expected_condition": "Intake reference should exist for the program and cycle.",
            "observed_condition": "No intake record found.",
            "evidence_reference": {
                "program_id": str(record.program_id),
                "admission_cycle": record.admission_cycle,
            },
        })
    return issues


def check_unusual_update_pattern(record_id: uuid.UUID, db: Session) -> List[Dict[str, Any]]:
    """
    Rule 9: UNUSUAL_UPDATE_PATTERN
    Flag records with unusually high correction frequency in 24 hours.
    This is a prioritization signal — not a fraud determination.
    """
    issues = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    version_count = (
        db.query(StudentRecordVersion)
        .filter(
            StudentRecordVersion.record_id == record_id,
            StudentRecordVersion.created_at >= cutoff,
        )
        .count()
    )
    THRESHOLD = 5
    if version_count >= THRESHOLD:
        issues.append({
            "rule_code": "UNUSUAL_UPDATE_PATTERN",
            "severity": "warning",
            "description": (
                f"This record has been updated {version_count} times in the last 24 hours. "
                f"This is above the configured threshold ({THRESHOLD}) and is flagged for review. "
                "This is a prioritization signal — it does not independently indicate misconduct."
            ),
            "affected_field": None,
            "expected_condition": f"Fewer than {THRESHOLD} updates per 24-hour period.",
            "observed_condition": f"{version_count} updates in the last 24 hours.",
            "evidence_reference": {
                "version_count_24h": version_count,
                "threshold": THRESHOLD,
            },
        })
    return issues


def run_all_validations(record: StudentRecord, db: Session) -> List[Dict[str, Any]]:
    """
    Run all 9 validation rules against a student record.
    Returns a list of issue dicts (not yet persisted).
    """
    all_issues = []
    all_issues.extend(check_required_fields(record))
    all_issues.extend(check_identifier_format(record))
    all_issues.extend(check_identity_verification_status(record))
    all_issues.extend(check_local_duplicates(record, db))
    all_issues.extend(check_cross_institution_matches(record, db))
    all_issues.extend(check_intake_limits(record, db))
    all_issues.extend(check_category_inconsistency(record))
    all_issues.extend(check_approval_data_missing(record, db))
    all_issues.extend(check_unusual_update_pattern(record.id, db))
    return all_issues


def persist_issues(record: StudentRecord, issues: List[Dict[str, Any]], db: Session) -> List[ValidationIssue]:
    """
    Save validation issues to the database, avoiding duplicates.
    Existing open issues for the same rule/record are not duplicated.
    """
    saved = []
    for issue_data in issues:
        existing = (
            db.query(ValidationIssue)
            .filter(
                ValidationIssue.record_id == record.id,
                ValidationIssue.rule_code == issue_data["rule_code"],
                ValidationIssue.status.in_(["open", "under_review", "reopened"]),
            )
            .first()
        )
        if existing:
            saved.append(existing)
            continue

        issue = ValidationIssue(
            id=uuid.uuid4(),
            record_id=record.id,
            rule_code=issue_data["rule_code"],
            severity=issue_data["severity"],
            description=issue_data["description"],
            affected_field=issue_data.get("affected_field"),
            expected_condition=issue_data.get("expected_condition"),
            observed_condition=issue_data.get("observed_condition"),
            evidence_reference=issue_data.get("evidence_reference"),
            status="open",
            created_at=datetime.now(timezone.utc),
        )
        db.add(issue)
        saved.append(issue)

    return saved


def validate_and_persist(record: StudentRecord, db: Session) -> List[ValidationIssue]:
    """Run all rules and persist new issues. Updates record_status if issues found."""
    issues_data = run_all_validations(record, db)
    issues = persist_issues(record, issues_data, db)

    high_severity = any(i["severity"] in ("high", "critical") for i in issues_data)
    if high_severity and record.record_status not in ("rejected", "corrected"):
        record.record_status = "flagged"

    return issues
