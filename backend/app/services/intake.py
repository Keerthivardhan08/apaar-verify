import uuid
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.institution import IntakeLimit, Program
from app.models.student import StudentRecord


def get_program_intake(
    program_id: uuid.UUID,
    cycle: str,
    db: Session,
    category: str = "total",
) -> Optional[IntakeLimit]:
    """Retrieve approved intake limit for a program and cycle."""
    return (
        db.query(IntakeLimit)
        .filter(
            IntakeLimit.program_id == program_id,
            IntakeLimit.admission_cycle == cycle,
            IntakeLimit.category == category,
        )
        .first()
    )


def get_enrolled_count(
    program_id: uuid.UUID,
    cycle: str,
    db: Session,
) -> int:
    """Count non-rejected enrolled students in a program and cycle."""
    return (
        db.query(StudentRecord)
        .filter(
            StudentRecord.program_id == program_id,
            StudentRecord.admission_cycle == cycle,
            StudentRecord.record_status.in_(["submitted", "accepted", "flagged", "under_review", "corrected"]),
        )
        .count()
    )


def calculate_utilization(
    program_id: uuid.UUID,
    cycle: str,
    db: Session,
) -> Dict[str, Any]:
    """Calculate seat utilization metrics for a program."""
    program = db.query(Program).filter(Program.id == program_id).first()
    intake = get_program_intake(program_id, cycle, db)
    enrolled = get_enrolled_count(program_id, cycle, db)

    if not intake:
        return {
            "program_id": str(program_id),
            "program_code": program.program_code if program else "UNKNOWN",
            "admission_cycle": cycle,
            "approved_capacity": None,
            "enrolled_count": enrolled,
            "utilization_pct": None,
            "status": "data_unavailable",
        }

    cap = intake.approved_capacity
    utilization_pct = round((enrolled / cap * 100), 2) if cap > 0 else 0.0
    status = (
        "exceeded" if enrolled > cap
        else "at_risk" if utilization_pct >= 80.0
        else "normal"
    )

    return {
        "program_id": str(program_id),
        "program_code": program.program_code if program else "UNKNOWN",
        "admission_cycle": cycle,
        "approved_capacity": cap,
        "enrolled_count": enrolled,
        "utilization_pct": utilization_pct,
        "status": status,
        "source_type": intake.source_type,
        "source_reference": intake.source_reference,
    }
