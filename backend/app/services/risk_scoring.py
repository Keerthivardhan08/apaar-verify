"""
Anomaly Prioritization & Institutional Composite Risk Scoring Engine.
Calculates quantitative risk indices (0-100) and risk tiers.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.models.institution import Institution, Program, IntakeLimit
from app.models.student import StudentRecord
from app.models.validation import ValidationIssue


def calculate_institution_risk(institution_id: str | uuid.UUID, db: Session) -> Optional[Dict[str, Any]]:
    """Calculates quantitative institutional composite risk score."""
    inst_uuid = uuid.UUID(str(institution_id)) if isinstance(institution_id, str) else institution_id
    institution = db.query(Institution).filter(Institution.id == inst_uuid).first()
    if not institution:
        return None

    total_records = db.query(StudentRecord).filter(StudentRecord.institution_id == inst_uuid).count()

    # Query issues for records belonging to this institution
    issues_query = (
        db.query(ValidationIssue)
        .join(StudentRecord, ValidationIssue.record_id == StudentRecord.id)
        .filter(StudentRecord.institution_id == inst_uuid)
    )
    all_issues = issues_query.all()
    open_issues = [i for i in all_issues if i.status in ("open", "under_review", "reopened")]

    critical_count = sum(1 for i in open_issues if i.severity == "critical")
    high_count = sum(1 for i in open_issues if i.severity == "high")
    warning_count = sum(1 for i in open_issues if i.severity == "warning")
    info_count = sum(1 for i in open_issues if i.severity == "info")

    cross_dup_count = sum(1 for i in open_issues if i.rule_code == "POTENTIAL_CROSS_INSTITUTION_DUPLICATE")
    intake_exceeded_count = sum(1 for i in open_issues if i.rule_code == "INTAKE_EXCEEDED")
    category_inconsistency_count = sum(1 for i in open_issues if i.rule_code == "CATEGORY_INCONSISTENCY")

    flagged_records_count = (
        db.query(func.count(func.distinct(ValidationIssue.record_id)))
        .join(StudentRecord, ValidationIssue.record_id == StudentRecord.id)
        .filter(StudentRecord.institution_id == inst_uuid, ValidationIssue.status.in_(["open", "under_review", "reopened"]))
        .scalar() or 0
    )

    # Check program capacity breaches
    programs = db.query(Program).filter(Program.institution_id == inst_uuid).all()
    capacity_breach_points = 0.0
    for prog in programs:
        enrolled = db.query(StudentRecord).filter(StudentRecord.program_id == prog.id).count()
        limit = db.query(IntakeLimit).filter(IntakeLimit.program_id == prog.id).first()
        if limit and limit.approved_capacity > 0:
            if enrolled > limit.approved_capacity:
                excess_ratio = (enrolled - limit.approved_capacity) / limit.approved_capacity
                capacity_breach_points += excess_ratio * 15.0

    # Composite Risk Calculation
    if total_records == 0:
        composite_score = 0.0
        risk_tier = "LOW_RISK"
    else:
        anomaly_density = (flagged_records_count / total_records) * 30.0
        severity_points = min(35.0, (critical_count * 12.0) + (high_count * 5.0) + (warning_count * 1.5))
        duplicate_points = min(20.0, cross_dup_count * 10.0)
        intake_points = min(15.0, (intake_exceeded_count * 5.0) + capacity_breach_points)

        composite_score = min(100.0, round(anomaly_density + severity_points + duplicate_points + intake_points, 1))

        if composite_score >= 70.0:
            risk_tier = "CRITICAL_RISK"
        elif composite_score >= 45.0:
            risk_tier = "HIGH_RISK"
        elif composite_score >= 20.0:
            risk_tier = "MODERATE_RISK"
        else:
            risk_tier = "LOW_RISK"

    # Trend calculation (comparing recent 7 days to older)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_issues = [i for i in open_issues if i.created_at and (i.created_at.replace(tzinfo=timezone.utc) if i.created_at.tzinfo is None else i.created_at) >= seven_days_ago]
    trend_ratio = len(recent_issues) / max(len(open_issues), 1)
    if trend_ratio > 0.4:
        trend = "increasing"
    elif trend_ratio < 0.1 and len(open_issues) > 0:
        trend = "improving"
    else:
        trend = "stable"

    return {
        "institution_id": str(institution.id),
        "institution_code": institution.institution_code,
        "institution_name": institution.name,
        "composite_risk_score": composite_score,
        "risk_tier": risk_tier,
        "trend": trend,
        "metrics": {
            "total_records": total_records,
            "flagged_records": flagged_records_count,
            "anomaly_rate_pct": round((flagged_records_count / max(total_records, 1)) * 100, 1),
            "open_issues_total": len(open_issues),
            "critical_issues": critical_count,
            "high_issues": high_count,
            "warning_issues": warning_count,
            "info_issues": info_count,
            "cross_institution_duplicates": cross_dup_count,
            "intake_exceeded_flags": intake_exceeded_count,
            "category_inconsistencies": category_inconsistency_count,
        },
        "factor_breakdown": {
            "anomaly_density_score": round((flagged_records_count / max(total_records, 1)) * 30.0, 1) if total_records > 0 else 0.0,
            "severity_index": min(35.0, round((critical_count * 12.0) + (high_count * 5.0) + (warning_count * 1.5), 1)),
            "duplicate_cluster_risk": min(20.0, round(cross_dup_count * 10.0, 1)),
            "intake_breach_risk": min(15.0, round((intake_exceeded_count * 5.0) + capacity_breach_points, 1)),
        },
        "regulatory_recommendation": (
            "Immediate AICTE audit required. Potential syndicate duplicates and intake violations detected."
            if risk_tier == "CRITICAL_RISK"
            else "Targeted compliance review recommended for flagged admission categories."
            if risk_tier == "HIGH_RISK"
            else "Monitor regular batch uploads and pending correction requests."
            if risk_tier == "MODERATE_RISK"
            else "Institution compliant with academic integrity benchmarks."
        ),
    }


def get_all_institutions_risk_scores(db: Session) -> List[Dict[str, Any]]:
    """Calculates risk scores for all registered institutions, ranked descending by risk."""
    institutions = db.query(Institution).all()
    results = []
    for inst in institutions:
        risk = calculate_institution_risk(inst.id, db)
        if risk:
            results.append(risk)
    
    results.sort(key=lambda x: x["composite_risk_score"], reverse=True)
    return results


def calculate_student_risk(student_id: str | uuid.UUID, db: Session) -> Optional[Dict[str, Any]]:
    """Calculates risk score for an individual student record."""
    stud_uuid = uuid.UUID(str(student_id)) if isinstance(student_id, str) else student_id
    student = db.query(StudentRecord).filter(StudentRecord.id == stud_uuid).first()
    if not student:
        return None

    issues = db.query(ValidationIssue).filter(ValidationIssue.record_id == stud_uuid).all()
    open_issues = [i for i in issues if i.status in ("open", "under_review", "reopened")]

    score = 0.0
    risk_factors = []

    for issue in open_issues:
        if issue.severity == "critical":
            score += 40.0
            risk_factors.append(f"Critical issue: {issue.rule_code}")
        elif issue.severity == "high":
            score += 25.0
            risk_factors.append(f"High-severity issue: {issue.rule_code}")
        elif issue.severity == "warning":
            score += 10.0
            risk_factors.append(f"Warning: {issue.rule_code}")
        else:
            score += 3.0

    if student.identity_verification_status in ("failed", "unverified"):
        score += 15.0
        risk_factors.append(f"Identity status: {student.identity_verification_status}")

    final_score = min(100.0, round(score, 1))

    if final_score >= 70.0:
        tier = "CRITICAL_RISK"
    elif final_score >= 40.0:
        tier = "HIGH_RISK"
    elif final_score >= 15.0:
        tier = "MODERATE_RISK"
    else:
        tier = "LOW_RISK"

    return {
        "student_id": str(student.id),
        "student_name": student.student_name,
        "institution_student_id": student.institution_student_id,
        "risk_score": final_score,
        "risk_tier": tier,
        "open_issues_count": len(open_issues),
        "risk_factors": risk_factors,
    }
