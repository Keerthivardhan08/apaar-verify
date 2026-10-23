"""
OCR Document Reconciliation API (Phase 4).
Performs simulated OCR extraction & fuzzy matching against authoritative student records.
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.services.ocr_reconciliation import (
    reconcile_document_with_student,
    get_student_reconciliations,
)

router = APIRouter()


class ReconcileDocumentRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    student_id: str
    document_type: str  # marksheet, diploma, caste_certificate, migration_certificate, identity_card
    file_name: str
    extracted_data: Dict[str, Any]


@router.post("/ocr/reconcile-document")
def reconcile_document(
    payload: ReconcileDocumentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Reconciles uploaded certificate/marksheet OCR fields against the student's database record.
    Returns field similarity breakdown, confidence score, and match status.
    """
    try:
        result = reconcile_document_with_student(
            student_id=payload.student_id,
            document_type=payload.document_type,
            file_name=payload.file_name,
            extracted_data=payload.extracted_data,
            reconciled_by_user_id=str(current_user.id),
            db=db,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reconciliation failed: {str(e)}",
        )


@router.get("/ocr/reconciliations/{student_id}", response_model=List[Dict[str, Any]])
def get_reconciliations(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all past OCR document reconciliations for a given student record."""
    return get_student_reconciliations(student_id=student_id, db=db)
