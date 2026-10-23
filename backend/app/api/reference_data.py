"""
Authoritative Reference Master Synchronization & Reconciliation API Router.
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user, require_role
from app.models.user import User
from app.models.reference_data import AuthoritativeReferenceMaster
from app.services.reference_data import (
    sync_authoritative_registry,
    reconcile_intake_against_master,
)

router = APIRouter(prefix="/reference-data", tags=["Authoritative Reference Data & Reconciliation"])


@router.get("/masters", summary="List Authoritative Master Registries")
def list_masters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists registered authoritative master data sources and synchronization status."""
    masters = db.query(AuthoritativeReferenceMaster).all()
    return [
        {
            "id": str(m.id),
            "reference_type": m.reference_type,
            "source_system": m.source_system,
            "dataset_version": m.dataset_version,
            "checksum": m.checksum,
            "sync_status": m.sync_status,
            "last_synchronized_at": m.last_synchronized_at.isoformat(),
        }
        for m in masters
    ]


@router.post("/sync/{source}", summary="Synchronize Authoritative Master Data")
def trigger_master_sync(
    source: str,
    current_user: User = Depends(require_role("aicte_admin")),
    db: Session = Depends(get_db),
):
    """
    Manually initiates synchronization with central regulatory registries (e.g. AICTE Portal).
    Restricted to AICTE Admins.
    """
    result = sync_authoritative_registry(source, db)
    return result


@router.get("/reconciliation", summary="Reconcile Admissions Against Authoritative Master")
def get_reconciliation_report(
    admission_cycle: str = "2026-27",
    institution_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Compares submitted institutional student enrollments against authoritative AICTE approved master limits.
    Identifies program-level capacity breaches and compliance ratings.
    """
    return reconcile_intake_against_master(institution_id, admission_cycle, db)
