"""
Phase 4 Comprehensive Test Suite.

Verifies:
1. Anomaly Prioritization & Institutional Composite Risk Scoring Engine.
2. Individual Student-Level Risk Scoring.
3. Advanced Integrity Analytics & Risk Scoring APIs.
4. Trend Analytics, Ingestion Velocity & 30-Day Forward Forecasting.
5. Model Performance Evaluation across all 9 validation rule engines.
6. OCR-Assisted Document Reconciliation (Exact Match Verification & Mismatch Anomaly Flagging).
"""
import uuid
import datetime
import pytest

from app.models.institution import Institution, Program
from app.models.student import StudentRecord
from app.models.validation import ValidationIssue
from app.services.risk_scoring import (
    calculate_institution_risk,
    get_all_institutions_risk_scores,
    calculate_student_risk,
)
from app.services.trend_analytics import (
    get_anomaly_and_velocity_trends,
    get_model_performance_evaluation,
)
from app.services.ocr_reconciliation import (
    reconcile_document_with_student,
    get_student_reconciliations,
)


def test_risk_scoring_computation(db_session, test_student):
    """Test institutional and student-level composite risk scoring calculation."""
    inst = db_session.query(Institution).first()
    assert inst is not None

    # Calculate institution risk
    inst_risk = calculate_institution_risk(inst.id, db_session)
    assert inst_risk is not None
    assert "composite_risk_score" in inst_risk
    assert 0.0 <= inst_risk["composite_risk_score"] <= 100.0
    assert inst_risk["risk_tier"] in ("LOW_RISK", "MODERATE_RISK", "HIGH_RISK", "CRITICAL_RISK")
    assert "factor_breakdown" in inst_risk
    assert "regulatory_recommendation" in inst_risk

    # Calculate student risk
    stud_risk = calculate_student_risk(test_student.id, db_session)
    assert stud_risk is not None
    assert "risk_score" in stud_risk
    assert 0.0 <= stud_risk["risk_score"] <= 100.0
    assert stud_risk["risk_tier"] in ("LOW_RISK", "MODERATE_RISK", "HIGH_RISK", "CRITICAL_RISK")


def test_analytics_risk_scores_api(client, admin_token, db_session, test_student):
    """Test the Analytics Risk Scores API endpoints."""
    inst = db_session.query(Institution).first()
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. GET /api/v1/analytics/risk-scores (all institutions)
    resp = client.get("/api/v1/analytics/risk-scores", headers=headers)
    assert resp.status_code == 200
    scores = resp.json()
    assert isinstance(scores, list)
    assert len(scores) >= 1
    assert any(s["institution_id"] == str(inst.id) for s in scores)

    # 2. GET /api/v1/analytics/risk-scores/{institution_id}
    inst_resp = client.get(f"/api/v1/analytics/risk-scores/{inst.id}", headers=headers)
    assert inst_resp.status_code == 200
    data = inst_resp.json()
    assert data["institution_id"] == str(inst.id)
    assert "composite_risk_score" in data

    # 3. GET /api/v1/analytics/risk-scores/students/{student_id}
    stud_resp = client.get(f"/api/v1/analytics/risk-scores/students/{test_student.id}", headers=headers)
    assert stud_resp.status_code == 200
    stud_data = stud_resp.json()
    assert stud_data["student_id"] == str(test_student.id)
    assert "risk_score" in stud_data


def test_trend_analytics_and_forecasting(client, admin_token, db_session):
    """Test historical ingestion velocity and 30-day forward forecasting."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/v1/analytics/trends", headers=headers)
    assert resp.status_code == 200
    trends = resp.json()
    assert "summary" in trends
    assert "time_series" in trends
    assert len(trends["time_series"]) == 6  # 6-month historical windows
    assert "forecast" in trends
    assert "projected_next_30d_anomalies" in trends["forecast"]


def test_model_performance_evaluation(client, admin_token, db_session):
    """Test model evaluation and precision across all 9 validation rule engines."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/v1/analytics/model-performance", headers=headers)
    assert resp.status_code == 200
    perf = resp.json()
    assert "evaluation_summary" in perf
    assert perf["evaluation_summary"]["total_rules_evaluated"] == 9
    assert "rule_performance" in perf
    assert len(perf["rule_performance"]) == 9
    for rule in perf["rule_performance"]:
        assert "rule_code" in rule
        assert "precision_pct" in rule
        assert "recommendation" in rule


def test_ocr_document_reconciliation_exact(client, admin_token, db_session, test_student):
    """Test OCR document reconciliation with high-confidence exact match."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "student_id": str(test_student.id),
        "document_type": "marksheet",
        "file_name": "Class_XII_Marksheet_Scanned.pdf",
        "extracted_data": {
            "candidate_name": test_student.student_name,
            "roll_number": test_student.institution_student_id,
            "date_of_birth": "2004-01-01",
            "institution_name": "Test Institute of Technology",
            "total_marks": "485/500",
            "percentage": "97.0%",
            "passing_year": "2024",
        },
    }

    resp = client.post("/api/v1/ocr/reconcile-document", headers=headers, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["student_id"] == str(test_student.id)
    assert data["match_status"] == "VERIFIED"
    assert data["confidence_score"] >= 0.88
    assert len(data["discrepancies"]) == 0
    assert len(data["field_comparisons"]) >= 4


def test_ocr_document_reconciliation_mismatch_and_flagging(client, admin_token, db_session, test_student):
    """Test OCR document reconciliation with severe mismatch triggering automatic validation issue."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    mismatch_payload = {
        "student_id": str(test_student.id),
        "document_type": "diploma",
        "file_name": "Forged_Or_Conflicting_Diploma.jpg",
        "extracted_data": {
            "candidate_name": "Siddharth Malhotra",  # Different from Test Student
            "roll_number": "FAKE-ROLL-999",
            "date_of_birth": "1999-12-31",
            "institution_name": "Unknown Foreign Academy",
        },
    }

    resp = client.post("/api/v1/ocr/reconcile-document", headers=headers, json=mismatch_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["match_status"] == "MISMATCH_FLAGGED"
    assert data["confidence_score"] < 0.65
    assert len(data["discrepancies"]) > 0

    # Verify that a ValidationIssue was automatically created in the database
    issue = (
        db_session.query(ValidationIssue)
        .filter(ValidationIssue.record_id == test_student.id, ValidationIssue.rule_code == "DOCUMENT_DATA_MISMATCH")
        .first()
    )
    assert issue is not None
    assert issue.severity == "high"

    # Test history retrieval
    hist_resp = client.get(f"/api/v1/ocr/reconciliations/{test_student.id}", headers=headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) >= 1

