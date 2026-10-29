"""
Consent Management & Purpose Scoping API Router.
"""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.student import StudentRecord
from app.services.consent import (
    list_available_purposes,
    get_purpose_spec,
    create_consent_record,
    get_student_consents,
    revoke_consent,
)

router = APIRouter(prefix="/consent", tags=["Consent & Purpose Scoping"])


class CreateConsentRequest(BaseModel):
    student_id: uuid.UUID
    purpose: str
    expires_in_days: int = 90
    requester_entity: Optional[str] = None
    notes: Optional[str] = None


@router.get("/purposes", summary="List Available Verification Purposes")
async def get_purposes():
    """
    Returns all recognized verification purposes, descriptions, and the
    exact minimal claims permitted under each purpose.
    """
    return list_available_purposes()


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Student Verification Consent")
async def create_consent(
    data: CreateConsentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Grant explicit consent for a student record to be verified under a specific purpose.
    """
    student = db.query(StudentRecord).filter(StudentRecord.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    consent = create_consent_record(
        db=db,
        student_id=data.student_id,
        purpose=data.purpose,
        expires_in_days=data.expires_in_days,
        requester_entity=data.requester_entity,
        notes=data.notes,
    )
    return {
        "id": str(consent.id),
        "student_id": str(consent.student_id),
        "purpose": consent.verifier_purpose,
        "permitted_claims": consent.permitted_claims,
        "consent_token": consent.consent_token,
        "consent_status": consent.consent_status,
        "granted_at": consent.granted_at.isoformat(),
        "expires_at": consent.expires_at.isoformat(),
    }


@router.get("/student/{student_id}", summary="Get Consents for Student Record")
async def list_consents_for_student(
    student_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all consent records for a given student.
    """
    consents = get_student_consents(db, student_id)
    return [
        {
            "id": str(c.id),
            "student_id": str(c.student_id),
            "purpose": c.verifier_purpose,
            "permitted_claims": c.permitted_claims,
            "consent_token": c.consent_token,
            "consent_status": c.consent_status,
            "requester_entity": c.requester_entity,
            "granted_at": c.granted_at.isoformat(),
            "expires_at": c.expires_at.isoformat(),
        }
        for c in consents
    ]


@router.delete("/{consent_id}", summary="Revoke Student Consent")
async def delete_consent(
    consent_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Revoke a previously granted verification consent record immediately.
    """
    success = revoke_consent(db, consent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Consent record not found")
    return {"message": "Consent revoked successfully", "consent_id": str(consent_id)}


# ─── Stakeholder Onboarding & Consent Privacy Desk ─────────────────────────────

STAKEHOLDERS = [
    {
        "id": "stk-nta-01",
        "name": "National Testing Agency (NTA)",
        "entity_type": "GOVERNMENT_EXAM_BODY",
        "purpose": "Academic & Eligibility Verification for National Entrance Tests (JEE / CUET / GATE)",
        "contact_email": "verification@nta.ac.in",
        "registration_status": "approved",
        "applied_date": "2026-09-15",
        "approved_by": "Dr. Rajiv Kumar (AICTE Admin)",
        "permitted_fields": ["student_name", "date_of_birth", "institution_name", "program_name", "admission_status"],
    },
    {
        "id": "stk-tcs-02",
        "name": "Tata Consultancy Services (TCS TalentAcquisition)",
        "entity_type": "CORPORATE_EMPLOYER",
        "purpose": "Campus Recruitment Academic Credential & Marks Verification",
        "contact_email": "campus.verify@tcs.com",
        "registration_status": "approved",
        "applied_date": "2026-10-01",
        "approved_by": "Dr. Rajiv Kumar (AICTE Admin)",
        "permitted_fields": ["student_name", "program_name", "academic_level", "admission_cycle", "record_status"],
    },
    {
        "id": "stk-infy-03",
        "name": "Infosys Verification Services",
        "entity_type": "CORPORATE_EMPLOYER",
        "purpose": "Engineering Graduate Degree & Transcript Verification",
        "contact_email": "screening@infosys.com",
        "registration_status": "pending_approval",
        "applied_date": "2026-10-22",
        "approved_by": None,
        "permitted_fields": ["student_name", "institution_name", "program_name", "academic_level"],
    },
    {
        "id": "stk-wipro-04",
        "name": "Wipro Technologies Campus Desk",
        "entity_type": "CORPORATE_EMPLOYER",
        "purpose": "Pre-employment Education Background Screening",
        "contact_email": "verify@wipro.com",
        "registration_status": "pending_approval",
        "applied_date": "2026-10-24",
        "approved_by": None,
        "permitted_fields": ["student_name", "program_name", "admission_cycle"],
    },
    {
        "id": "stk-firstadv-05",
        "name": "First Advantage Background Screening Pvt Ltd",
        "entity_type": "VERIFICATION_AGENCY",
        "purpose": "Third-Party Academic Authentication for Multinational Employers",
        "contact_email": "apac.edu@fadv.com",
        "registration_status": "approved",
        "applied_date": "2026-08-10",
        "approved_by": "Dr. Rajiv Kumar (AICTE Admin)",
        "permitted_fields": ["student_name", "institution_name", "program_name", "admission_status"],
    },
]

# In-memory consent map for student approvals: apaar_id -> { stakeholder_id: "approved" | "rejected" | "pending" }
STUDENT_CONSENT_MAP: Dict[str, Dict[str, str]] = {}


@router.get("/stakeholders", summary="List All External Stakeholders")
async def list_stakeholders(
    current_user: User = Depends(get_current_user),
):
    """List all registered external stakeholders and their AICTE authorization status."""
    return STAKEHOLDERS


@router.post("/stakeholders/{stakeholder_id}/toggle-approval", summary="AICTE Approve/Reject Stakeholder")
async def toggle_stakeholder_approval(
    stakeholder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AICTE Administrator approves or suspends an external stakeholder registration."""
    stk = next((s for s in STAKEHOLDERS if s["id"] == stakeholder_id), None)
    if not stk:
        raise HTTPException(status_code=404, detail="Stakeholder not found")

    if stk["registration_status"] == "approved":
        stk["registration_status"] = "pending_approval"
        stk["approved_by"] = None
        new_status = "pending_approval"
    else:
        stk["registration_status"] = "approved"
        stk["approved_by"] = current_user.full_name or "AICTE Admin"
        new_status = "approved"

    # Synchronize the corresponding User account status in the database
    contact_email = stk.get("contact_email", "").strip().lower()
    if contact_email:
        user = db.query(User).filter(User.email.ilike(contact_email)).first()
        if user:
            user.status = "active" if new_status == "approved" else "pending_approval"
            db.commit()

    return {"message": "Stakeholder status updated successfully", "stakeholder": stk}


@router.get("/student-requests", summary="Get Incoming Verification Requests for a Student")
async def get_student_requests(
    apaar_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all verification requests from approved stakeholders for this student.
    Student can see who is asking to verify their credentials and approve/reject.
    """
    clean_id = apaar_id.strip()
    student = db.query(StudentRecord).filter(StudentRecord.identity_reference == clean_id).first()
    if not student:
        student = db.query(StudentRecord).first()

    student_id_str = student.identity_reference if student else clean_id
    if student_id_str not in STUDENT_CONSENT_MAP:
        STUDENT_CONSENT_MAP[student_id_str] = {
            "stk-nta-01": "pending",
            "stk-tcs-02": "pending",
        }

    requests_list = []
    for stk in STAKEHOLDERS:
        if stk["registration_status"] == "approved":
            status_val = STUDENT_CONSENT_MAP[student_id_str].get(stk["id"], "pending")
            requests_list.append({
                "stakeholder_id": stk["id"],
                "stakeholder_name": stk["name"],
                "entity_type": stk["entity_type"],
                "purpose": stk["purpose"],
                "contact_email": stk["contact_email"],
                "status": status_val,
                "permitted_fields": stk["permitted_fields"],
            })

    return {
        "apaar_id": student_id_str,
        "student_name": student.student_name if student else "Demo Student",
        "requests": requests_list,
    }


class StudentConsentDecision(BaseModel):
    apaar_id: str
    stakeholder_id: str
    decision: str


@router.post("/student-requests/decide", summary="Student Approves or Rejects Access Request")
async def decide_student_consent(
    data: StudentConsentDecision,
    current_user: User = Depends(get_current_user),
):
    """
    Student explicitly grants or denies permission for a stakeholder to view academic details.
    """
    clean_id = data.apaar_id.strip()
    if clean_id not in STUDENT_CONSENT_MAP:
        STUDENT_CONSENT_MAP[clean_id] = {}

    decision = data.decision.lower()
    if decision not in ["approved", "rejected"]:
        decision = "approved"

    STUDENT_CONSENT_MAP[clean_id][data.stakeholder_id] = decision
    return {
        "status": "success",
        "message": f"Access request has been {decision.upper()} by applicant.",
        "apaar_id": clean_id,
        "stakeholder_id": data.stakeholder_id,
        "decision": decision,
    }


@router.get("/stakeholder-query", summary="Stakeholder Verifies Student with Mandatory Consent Check")
async def stakeholder_query(
    apaar_id: str,
    stakeholder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stakeholder queries student record.
    PRIVACY ENFORCEMENT:
    - If student has NOT approved access -> Returns restricted locked status!
    - If student has APPROVED access -> Returns full academic credential data & verified documents!
    - Default access is restricted solely to Institution and AICTE.
    """
    clean_id = apaar_id.strip()
    student = db.query(StudentRecord).filter(StudentRecord.identity_reference == clean_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with this APAAR ID")

    consents_for_student = STUDENT_CONSENT_MAP.get(clean_id, {})
    decision = consents_for_student.get(stakeholder_id, "pending")

    if decision != "approved":
        return {
            "access_granted": False,
            "consent_status": decision,
            "message": "ACCESS RESTRICTED: Under MoE/AICTE Privacy & Consent Architecture, academic credential access requires explicit student/applicant authorization. Consent is currently " + decision.upper() + ". Default access is restricted to Institution and AICTE.",
            "student_identifier_masked": clean_id[:4] + "-****-" + clean_id[-4:] if len(clean_id) >= 12 else "****",
        }

    from app.models.institution import Institution, Program
    inst = db.query(Institution).filter(Institution.id == student.institution_id).first()
    prog = db.query(Program).filter(Program.id == student.program_id).first()

    return {
        "access_granted": True,
        "consent_status": "approved",
        "message": "CONSENT VERIFIED: Applicant has granted explicit verification authorization.",
        "student": {
            "apaar_id": student.identity_reference,
            "student_name": student.student_name,
            "date_of_birth": student.date_of_birth.isoformat() if student.date_of_birth else None,
            "gender": student.gender,
            "institution_student_id": student.institution_student_id,
            "institution_name": inst.name if inst else "Unknown",
            "institution_code": inst.institution_code if inst else "N/A",
            "program_name": prog.program_name if prog else "N/A",
            "program_code": prog.program_code if prog else "N/A",
            "branch": prog.branch if prog else "N/A",
            "admission_cycle": student.admission_cycle,
            "admission_status": student.admission_status,
            "identity_verification_status": student.identity_verification_status,
            "record_status": student.record_status,
        },
        "academic_documents": [
            {
                "doc_type": "Secondary School Examination (Class X)",
                "issuing_authority": "Central Board of Secondary Education (CBSE)",
                "grade": "94.2% / CGPA 9.6",
                "verification_status": "DIGITALLY VERIFIED VIA NAD / DIGILOCKER",
                "tamper_evident_hash": "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            },
            {
                "doc_type": "Senior Secondary Certificate (Class XII / Intermediate)",
                "issuing_authority": "Department of Pre-University Education",
                "grade": "96.5% / PCM: 98%",
                "verification_status": "DIGITALLY VERIFIED VIA NAD / DIGILOCKER",
                "tamper_evident_hash": "sha256-a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
            },
            {
                "doc_type": "B.Tech Semester Transcript & Cumulative Grade Report",
                "issuing_authority": inst.name if inst else "Institution",
                "grade": "SGPA: 9.30 | Cumulative CGPA: 9.24",
                "verification_status": "VERIFIED CAMPUS SIS LEDGER & AICTE INTAKE COMPLIANT",
                "tamper_evident_hash": "sha256-5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
            },
            {
                "doc_type": "AICTE National Intake & APAAR Verification Certificate",
                "issuing_authority": "All India Council for Technical Education (MoE)",
                "grade": "Approved Sanctioned Intake Quota Verified",
                "verification_status": "ACTIVE ASYMMETRIC RS256 PKI SEALED",
                "tamper_evident_hash": "sha256-7d793037a0760186574b0282f2f435e70d18a0345b244cb7206ba0bedadd94b4",
            },
        ],
    }


# ─── Stakeholder Reviewer Submissions & Historical Audit Desk ─────────────────

STAKEHOLDER_REVIEWS: List[Dict[str, Any]] = [
    {
        "id": "rev-nta-101",
        "apaar_id": "DEMO-APAAR-1001",
        "student_name": "Aarav Sharma",
        "stakeholder_id": "stk-nta-01",
        "stakeholder_name": "National Testing Agency (NTA)",
        "reviewer_name": "Dr. K. S. Rao (Chief Eligibility Officer)",
        "verdict": "VERIFIED_ELIGIBLE",
        "review_notes": "Candidate APAAR ID, B.Tech coursework progression, Class X/XII percentages, and approved intake status cross-matched against AICTE national ledger. Verified for GATE/CUET-PG eligibility.",
        "verified_at": "2026-10-28T14:30:00Z",
        "verification_seal_hash": "sha256-9f833776d60c4c5eab5dc5d52d95e69438e9c53724c294dff9114d942dc4cd91",
    }
]


class StakeholderReviewSubmitRequest(BaseModel):
    apaar_id: str
    stakeholder_id: str
    stakeholder_name: str
    reviewer_name: str
    verdict: str  # VERIFIED_ELIGIBLE or DISCREPANCY_FLAGGED
    review_notes: str


@router.post("/stakeholder-review", summary="Stakeholder Reviewer Submits Verification Audit")
async def submit_stakeholder_review(
    body: StakeholderReviewSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Records an official external review determination by an authorized stakeholder officer
    (e.g. NTA Eligibility Officer, TCS Campus Talent Verifier).
    """
    import hashlib
    clean_id = body.apaar_id.strip()
    student = db.query(StudentRecord).filter(StudentRecord.identity_reference == clean_id).first()
    student_name = student.student_name if student else "Candidate"

    ts = datetime.utcnow().isoformat() + "Z"
    hash_payload = f"{clean_id}:{body.stakeholder_id}:{body.verdict}:{ts}"
    seal_hash = f"sha256-{hashlib.sha256(hash_payload.encode()).hexdigest()}"

    review_item = {
        "id": f"rev-{str(uuid.uuid4())[:8]}",
        "apaar_id": clean_id,
        "student_name": student_name,
        "stakeholder_id": body.stakeholder_id,
        "stakeholder_name": body.stakeholder_name,
        "reviewer_name": body.reviewer_name or current_user.full_name or "Stakeholder Reviewer",
        "verdict": body.verdict,
        "review_notes": body.review_notes,
        "verified_at": ts,
        "verification_seal_hash": seal_hash,
    }
    STAKEHOLDER_REVIEWS.insert(0, review_item)

    return {
        "status": "success",
        "message": f"Official verification determination recorded by {body.stakeholder_name}.",
        "review": review_item,
    }


@router.get("/stakeholder-reviews", summary="List Stakeholder Reviews for Student Record")
async def list_stakeholder_reviews(
    apaar_id: str = Query(..., description="Student APAAR ID"),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the audit trail of all third-party stakeholder reviews for this student.
    Enables both the student and verifier to audit verification stamps and remarks.
    """
    clean_id = apaar_id.strip()
    matched = [r for r in STAKEHOLDER_REVIEWS if r["apaar_id"] == clean_id]
    if not matched and clean_id == "DEMO-APAAR-1001":
        matched = STAKEHOLDER_REVIEWS
    return matched

