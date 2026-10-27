"""
Admission Integrity Graph API (PRD Section 5.10 / GRAPH)
Generates nodes and links representing entities, relationships,
and potential cross-institution duplicate links for visual investigation.
"""
import uuid
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.models.user import User
from app.models.institution import Institution, Program
from app.models.student import StudentRecord
from app.models.validation import ValidationIssue

router = APIRouter()


@router.get("/graph/data")
def get_integrity_graph_data(
    admission_cycle: Optional[str] = Query("2026-27"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Construct node-link graph of participating technical institutions,
    active programs, enrolled students, validation issues, and cross-match anomalies.
    Accessible to all authenticated platform officers and reviewers.
    """
    institutions = db.query(Institution).filter(Institution.status == "active").all()
    programs = db.query(Program).filter(Program.status == "active").all()
    
    student_q = db.query(StudentRecord)
    if admission_cycle and admission_cycle != "all":
        # Check if records exist for requested cycle, else load all records
        cycle_count = db.query(StudentRecord).filter(StudentRecord.admission_cycle == admission_cycle).count()
        if cycle_count > 0:
            student_q = student_q.filter(StudentRecord.admission_cycle == admission_cycle)
    students = student_q.all()

    issues = db.query(ValidationIssue).filter(ValidationIssue.status.in_(["open", "under_review", "reopened"])).all()

    nodes: List[Dict[str, Any]] = []
    links: List[Dict[str, Any]] = []

    # 1. Institution Nodes
    for inst in institutions:
        nodes.append({
            "id": f"inst_{inst.id}",
            "type": "institution",
            "label": inst.name,
            "code": inst.institution_code,
            "state": inst.state,
            "severity": "normal",
        })

    # 2. Program Nodes
    for prog in programs:
        nodes.append({
            "id": f"prog_{prog.id}",
            "type": "program",
            "label": prog.program_name,
            "code": prog.program_code,
            "academic_level": prog.academic_level,
            "severity": "normal",
        })
        # Link Program -> Institution
        links.append({
            "source": f"inst_{prog.institution_id}",
            "target": f"prog_{prog.id}",
            "type": "contains_program",
            "label": "offers",
        })

    # 3. Student Nodes
    # Map identity references to list of student records to detect cross-institution duplicates
    ident_map: Dict[str, List[StudentRecord]] = {}

    for stu in students:
        # Mask student reference
        ref = stu.identity_reference or ""
        masked_ref = f"{ref[:4]}...{ref[-4:]}" if len(ref) > 8 else (ref if ref else "****")

        # Check issues for this student
        student_issues = [i for i in issues if i.record_id == stu.id]
        has_critical = any(i.severity == "critical" for i in student_issues)
        has_high = any(i.severity == "high" for i in student_issues)
        severity = "critical" if has_critical else "high" if has_high else "normal"

        nodes.append({
            "id": f"stu_{stu.id}",
            "type": "student",
            "label": stu.student_name,
            "student_id": stu.institution_student_id,
            "masked_identity": masked_ref,
            "institution_id": str(stu.institution_id),
            "record_status": stu.record_status,
            "severity": severity,
            "issue_count": len(student_issues),
        })

        # Link Student -> Program
        links.append({
            "source": f"prog_{stu.program_id}",
            "target": f"stu_{stu.id}",
            "type": "enrolled",
            "label": "enrolled in",
        })

        if stu.identity_reference:
            ident_map.setdefault(stu.identity_reference, []).append(stu)

    # 4. Cross-Institution Duplicate Anomalies
    for ref, matched_students in ident_map.items():
        if len(matched_students) > 1:
            # Check if across different institutions
            inst_set = {s.institution_id for s in matched_students}
            if len(inst_set) > 1:
                # Add cross-institution link
                for i in range(len(matched_students)):
                    for j in range(i + 1, len(matched_students)):
                        s1, s2 = matched_students[i], matched_students[j]
                        links.append({
                            "source": f"stu_{s1.id}",
                            "target": f"stu_{s2.id}",
                            "type": "cross_duplicate",
                            "label": "POTENTIAL CROSS-INSTITUTION DUPLICATE",
                            "severity": "critical",
                        })

    return {
        "cycle": admission_cycle,
        "nodes": nodes,
        "links": links,
        "summary": {
            "institutions_count": len(institutions),
            "programs_count": len(programs),
            "students_count": len(students),
            "cross_matches_count": sum(1 for l in links if l.get("type") == "cross_duplicate"),
        },
    }
