"""
OCR-Assisted Document Reconciliation Engine.
Reconciles uploaded certificates/marksheets against student database records using fuzzy matching.
"""
import uuid
import re
import difflib
from datetime import datetime, timezone, date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.student import StudentRecord
from app.models.institution import Institution
from app.models.validation import ValidationIssue
from app.models.ocr import DocumentReconciliation
from app.services.audit import log_event


def normalize_text(text: Optional[str]) -> str:
    """Normalizes whitespace and removes punctuation for comparison."""
    if not text:
        return ""
    text = re.sub(r"[^\w\s]", "", text)
    return " ".join(text.lower().split())


def compute_string_similarity(s1: str, s2: str) -> float:
    """Computes token-aware fuzzy string similarity (0.0 - 1.0)."""
    norm1 = normalize_text(s1)
    norm2 = normalize_text(s2)
    if not norm1 or not norm2:
        return 0.0
    if norm1 == norm2:
        return 1.0

    # Token set match (e.g. 'Rahul Sharma' vs 'Sharma Rahul')
    tokens1 = set(norm1.split())
    tokens2 = set(norm2.split())
    if tokens1 and tokens2 and tokens1 == tokens2:
        return 0.98

    # Levenshtein ratio
    ratio = difflib.SequenceMatcher(None, norm1, norm2).ratio()
    return round(ratio, 3)


def normalize_dob(dob_input: Any) -> Optional[str]:
    """Normalizes date of birth to YYYY-MM-DD string."""
    if not dob_input:
        return None
    if isinstance(dob_input, date):
        return dob_input.isoformat()
    if isinstance(dob_input, str):
        dob_str = dob_input.strip()
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
            try:
                dt = datetime.strptime(dob_str, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
    return str(dob_input)


def reconcile_document_with_student(
    student_id: str | uuid.UUID,
    document_type: str,
    file_name: str,
    extracted_data: Dict[str, Any],
    reconciled_by_user_id: Optional[str | uuid.UUID],
    db: Session,
) -> Dict[str, Any]:
    """
    Reconciles extracted document OCR fields against authoritative student database record.
    """
    stud_uuid = uuid.UUID(str(student_id)) if isinstance(student_id, str) else student_id
    student = db.query(StudentRecord).filter(StudentRecord.id == stud_uuid).first()
    if not student:
        raise ValueError(f"Student record {student_id} not found")

    institution = db.query(Institution).filter(Institution.id == student.institution_id).first()

    field_comparisons = []
    discrepancies = []

    # 1. Student Name Check
    extracted_name = extracted_data.get("candidate_name") or extracted_data.get("student_name") or ""
    name_similarity = compute_string_similarity(extracted_name, student.student_name)
    name_status = "EXACT" if name_similarity == 1.0 else "FUZZY" if name_similarity >= 0.85 else "MISMATCH"
    if name_status == "MISMATCH":
        discrepancies.append(f"Name mismatch: Document states '{extracted_name}', database record has '{student.student_name}'")

    field_comparisons.append({
        "field": "student_name",
        "extracted_value": extracted_name,
        "record_value": student.student_name,
        "similarity": name_similarity,
        "match_status": name_status,
        "weight": 0.40,
    })

    # 2. Roll Number / Student ID Check
    extracted_roll = extracted_data.get("roll_number") or extracted_data.get("registration_number") or extracted_data.get("institution_student_id") or ""
    roll_similarity = 1.0 if normalize_text(extracted_roll) == normalize_text(student.institution_student_id) else (
        0.9 if normalize_text(extracted_roll) in normalize_text(student.institution_student_id) or normalize_text(student.institution_student_id) in normalize_text(extracted_roll)
        else 0.0
    )
    roll_status = "EXACT" if roll_similarity >= 0.95 else "PARTIAL" if roll_similarity >= 0.70 else "MISMATCH"
    if roll_status == "MISMATCH" and extracted_roll:
        discrepancies.append(f"Roll Number mismatch: Document has '{extracted_roll}', database record has '{student.institution_student_id}'")

    field_comparisons.append({
        "field": "institution_student_id",
        "extracted_value": extracted_roll,
        "record_value": student.institution_student_id,
        "similarity": roll_similarity,
        "match_status": roll_status,
        "weight": 0.30,
    })

    # 3. Date of Birth Check
    extracted_dob = normalize_dob(extracted_data.get("date_of_birth") or extracted_data.get("dob"))
    record_dob = normalize_dob(student.date_of_birth)
    if extracted_dob and record_dob:
        dob_similarity = 1.0 if extracted_dob == record_dob else 0.0
        dob_status = "EXACT" if dob_similarity == 1.0 else "MISMATCH"
        if dob_status == "MISMATCH":
            discrepancies.append(f"Date of birth mismatch: Document states '{extracted_dob}', database has '{record_dob}'")
    else:
        dob_similarity = 0.8 if not extracted_dob else 0.5
        dob_status = "NOT_SPECIFIED"

    field_comparisons.append({
        "field": "date_of_birth",
        "extracted_value": extracted_dob,
        "record_value": record_dob,
        "similarity": dob_similarity,
        "match_status": dob_status,
        "weight": 0.20,
    })

    # 4. Institution / Board Check
    extracted_inst = extracted_data.get("institution_name") or extracted_data.get("issuing_authority") or ""
    inst_name = institution.name if institution else ""
    inst_similarity = compute_string_similarity(extracted_inst, inst_name) if extracted_inst else 0.9
    inst_status = "EXACT" if inst_similarity >= 0.90 else "FUZZY" if inst_similarity >= 0.60 else "MISMATCH"

    field_comparisons.append({
        "field": "institution_name",
        "extracted_value": extracted_inst,
        "record_value": inst_name,
        "similarity": inst_similarity,
        "match_status": inst_status,
        "weight": 0.10,
    })

    # Weighted Confidence Score Calculation
    total_confidence = sum(item["similarity"] * item["weight"] for item in field_comparisons)
    total_confidence = round(min(1.0, max(0.0, total_confidence)), 3)

    if total_confidence >= 0.88 and not discrepancies:
        match_status = "VERIFIED"
    elif total_confidence >= 0.65:
        match_status = "REVIEW_REQUIRED"
    else:
        match_status = "MISMATCH_FLAGGED"

    # Persist DocumentReconciliation
    user_uuid = uuid.UUID(str(reconciled_by_user_id)) if reconciled_by_user_id else None
    recon = DocumentReconciliation(
        student_id=stud_uuid,
        institution_id=student.institution_id,
        document_type=document_type,
        file_name=file_name,
        extracted_data=extracted_data,
        field_comparisons=field_comparisons,
        confidence_score=total_confidence,
        match_status=match_status,
        discrepancies=discrepancies,
        reconciled_by=user_uuid,
    )
    db.add(recon)

    # If severe mismatch, flag student with a ValidationIssue
    if match_status == "MISMATCH_FLAGGED":
        issue = ValidationIssue(
            record_id=stud_uuid,
            rule_code="DOCUMENT_DATA_MISMATCH",
            severity="high",
            description=f"OCR reconciliation failed for {document_type}: {'; '.join(discrepancies)}",
            affected_field="student_name" if name_status == "MISMATCH" else "institution_student_id",
            expected_condition=student.student_name,
            observed_condition=extracted_name or "Mismatched document details",
            status="open",
        )
        db.add(issue)
        student.record_status = "flagged"

    log_event(
        actor_id=user_uuid,
        action="ocr_document_reconciled",
        target_type="student_record",
        target_id=str(stud_uuid),
        outcome="success" if match_status == "VERIFIED" else "flagged",
        metadata={
            "document_type": document_type,
            "confidence_score": total_confidence,
            "match_status": match_status,
            "discrepancies_count": len(discrepancies),
        },
        db=db,
    )

    db.commit()
    db.refresh(recon)

    return {
        "reconciliation_id": str(recon.id),
        "student_id": str(student.id),
        "student_name": student.student_name,
        "document_type": document_type,
        "file_name": file_name,
        "confidence_score": total_confidence,
        "match_status": match_status,
        "discrepancies": discrepancies,
        "field_comparisons": field_comparisons,
        "extracted_data": extracted_data,
        "created_at": recon.created_at.isoformat(),
    }


def get_student_reconciliations(student_id: str | uuid.UUID, db: Session) -> List[Dict[str, Any]]:
    """Returns history of document reconciliations for a student."""
    stud_uuid = uuid.UUID(str(student_id)) if isinstance(student_id, str) else student_id
    recons = (
        db.query(DocumentReconciliation)
        .filter(DocumentReconciliation.student_id == stud_uuid)
        .order_by(DocumentReconciliation.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(r.id),
            "student_id": str(r.student_id),
            "document_type": r.document_type,
            "file_name": r.file_name,
            "confidence_score": r.confidence_score,
            "match_status": r.match_status,
            "discrepancies": r.discrepancies or [],
            "field_comparisons": r.field_comparisons,
            "extracted_data": r.extracted_data,
            "created_at": r.created_at.isoformat(),
        }
        for r in recons
    ]
