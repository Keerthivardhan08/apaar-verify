"""
Source Freshness & Regulatory SLA Monitoring Service.
Tracks institutional submission cadence, data staleness, and SLA breaches.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.institution import Institution
from app.models.student import StudentRecord
from app.models.upload import UploadBatch
from app.models.validation import ValidationIssue


def now_utc():
    return datetime.now(timezone.utc)


REGULATORY_SLA_DAYS = 30


def get_institution_freshness_profile(institution: Institution, db: Session) -> Dict[str, Any]:
    """Calculates freshness score, staleness age, and SLA status for an institution."""
    # Find most recent student record update or upload
    latest_student = (
        db.query(StudentRecord)
        .filter(StudentRecord.institution_id == institution.id)
        .order_by(StudentRecord.updated_at.desc())
        .first()
    )

    latest_upload = (
        db.query(UploadBatch)
        .filter(UploadBatch.institution_id == institution.id)
        .order_by(UploadBatch.created_at.desc())
        .first()
    )

    last_activity = None
    if latest_student and latest_upload:
        last_activity = max(latest_student.updated_at, latest_upload.created_at)
    elif latest_student:
        last_activity = latest_student.updated_at
    elif latest_upload:
        last_activity = latest_upload.created_at

    now = now_utc()
    if last_activity:
        if last_activity.tzinfo is None:
            last_activity = last_activity.replace(tzinfo=timezone.utc)
        days_stale = max(0, (now - last_activity).days)
        last_activity_iso = last_activity.isoformat()
    else:
        days_stale = 90  # Default for no submissions
        last_activity_iso = None

    if days_stale <= 7:
        status = "FRESH"
        sla_rating = "COMPLIANT"
    elif days_stale <= 30:
        status = "MODERATE"
        sla_rating = "WARNING_WINDOW"
    elif days_stale <= 60:
        status = "STALE"
        sla_rating = "SLA_BREACHED"
    else:
        status = "CRITICAL_SLA_BREACHED"
        sla_rating = "CRITICAL_NON_COMPLIANT"

    # Count pending open validation issues
    open_issues = (
        db.query(ValidationIssue)
        .join(StudentRecord, ValidationIssue.record_id == StudentRecord.id)
        .filter(StudentRecord.institution_id == institution.id, ValidationIssue.status == "open")
        .count()
    )

    total_records = db.query(StudentRecord).filter(StudentRecord.institution_id == institution.id).count()

    return {
        "institution_id": str(institution.id),
        "institution_code": institution.institution_code,
        "institution_name": institution.name,
        "state": institution.state,
        "city": institution.city,
        "total_records": total_records,
        "open_discrepancies": open_issues,
        "last_submission_at": last_activity_iso,
        "days_since_last_submission": days_stale,
        "freshness_status": status,
        "sla_rating": sla_rating,
        "sla_threshold_days": REGULATORY_SLA_DAYS,
        "next_reconciliation_due": (now + timedelta(days=max(0, REGULATORY_SLA_DAYS - days_stale))).isoformat(),
    }


def get_freshness_overview(db: Session) -> Dict[str, Any]:
    """Provides nationwide freshness overview across all participating institutions."""
    institutions = db.query(Institution).filter(Institution.status == "active").all()
    profiles = [get_institution_freshness_profile(inst, db) for inst in institutions]

    fresh_count = sum(1 for p in profiles if p["freshness_status"] == "FRESH")
    moderate_count = sum(1 for p in profiles if p["freshness_status"] == "MODERATE")
    stale_count = sum(1 for p in profiles if p["freshness_status"] == "STALE")
    critical_count = sum(1 for p in profiles if p["freshness_status"] == "CRITICAL_SLA_BREACHED")

    total = max(1, len(profiles))
    sla_compliance_pct = round(((fresh_count + moderate_count) / total) * 100, 1)

    return {
        "total_institutions": len(profiles),
        "sla_compliance_pct": sla_compliance_pct,
        "summary": {
            "fresh": fresh_count,
            "moderate": moderate_count,
            "stale": stale_count,
            "critical_sla_breached": critical_count,
        },
        "institutions": sorted(profiles, key=lambda x: x["days_since_last_submission"], reverse=True),
        "generated_at": now_utc().isoformat(),
    }
