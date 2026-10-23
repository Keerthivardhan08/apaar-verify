"""
Advanced Integrity Analytics & Risk Scoring API (Phase 4).
Provides institutional risk scores, trend forecasting, and model performance metrics.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user, require_role
from app.models.user import User
from app.services.risk_scoring import (
    calculate_institution_risk,
    get_all_institutions_risk_scores,
    calculate_student_risk,
)
from app.services.trend_analytics import (
    get_anomaly_and_velocity_trends,
    get_model_performance_evaluation,
)

router = APIRouter()


@router.get("/analytics/risk-scores", response_model=List[Dict[str, Any]])
def get_risk_scores(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns ranking of institutions by composite risk score (0-100).
    AICTE administrators and reviewers can view all institutions.
    """
    return get_all_institutions_risk_scores(db)


@router.get("/analytics/risk-scores/{institution_id}")
def get_single_institution_risk(
    institution_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns detailed risk breakdown for a single institution."""
    risk = calculate_institution_risk(institution_id, db)
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution {institution_id} not found",
        )
    return risk


@router.get("/analytics/risk-scores/students/{student_id}")
def get_single_student_risk(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns risk profile and contributor factors for an individual student."""
    risk = calculate_student_risk(student_id, db)
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student record {student_id} not found",
        )
    return risk


@router.get("/analytics/trends")
def get_trends(
    institution_id: Optional[str] = Query(None),
    cycle: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns historical ingestion velocity, anomaly discovery rates,
    and 30-day forward projections.
    """
    return get_anomaly_and_velocity_trends(
        institution_id=institution_id,
        cycle=cycle,
        db=db,
    )


@router.get("/analytics/model-performance")
def get_model_performance(
    current_user: User = Depends(require_role("aicte_admin", "reviewer")),
    db: Session = Depends(get_db),
):
    """
    Returns evaluation metrics (precision, false-positive rate, decision concordance)
    across all 9 validation rule engines.
    """
    return get_model_performance_evaluation(db)
