"""
Source Freshness & Regulatory SLA Monitoring API Router.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user, require_institution_access
from app.models.user import User
from app.models.institution import Institution
from app.services.freshness import (
    get_freshness_overview,
    get_institution_freshness_profile,
)

router = APIRouter(prefix="/freshness", tags=["Source Freshness & SLA Monitoring"])


@router.get("/overview", summary="National Data Freshness & SLA Overview")
def get_national_freshness_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns nationwide data freshness metrics, staleness distribution,
    and SLA breach monitoring across all participating institutions.
    """
    return get_freshness_overview(db)


@router.get("/institution/{institution_id}", summary="Institution Freshness Profile")
def get_institution_freshness(
    institution_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns detailed freshness telemetry and submission cadence for a specific institution."""
    require_institution_access(institution_id, current_user)
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return get_institution_freshness_profile(inst, db)
