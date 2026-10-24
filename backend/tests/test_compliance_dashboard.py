import uuid
import datetime
import pytest
from app.models.institution import Institution, Program, IntakeLimit
from app.models.student import StudentRecord
from app.models.user import User

def test_institution_compliance_dashboard_endpoint(client, admin_token, db_session):
    """
    Test compliance-dashboard endpoint returns all required fields:
    - Approved Intake
    - Actual Student Enrolment
    - Supernumerary Seats (and breakdown)
    - NRI Category
    - OCI Status
    - Foreign National (FN) Status
    - Other relevant student information
    """
    inst = db_session.query(Institution).filter(Institution.institution_code == "TEST-INST").first()
    prog = db_session.query(Program).filter(Program.institution_id == inst.id).first()
    admin_user = db_session.query(User).first()

    # Create intake limit
    intake = IntakeLimit(
        id=uuid.uuid4(),
        program_id=prog.id,
        admission_cycle="2026-27",
        approved_capacity=60,
        category="total",
        source_type="regulatory_order",
        source_reference="AICTE/TEST/2026/01",
        effective_from=datetime.date(2026, 6, 1),
    )
    db_session.add(intake)

    # Create students with different quotas and statuses
    student1 = StudentRecord(
        id=uuid.uuid4(),
        institution_id=inst.id,
        program_id=prog.id,
        admission_cycle="2026-27",
        institution_student_id="TEST-001",
        student_name="Aarav Sharma",
        admission_category="general",
        admission_status="admitted",
        nri_category="applicable",
        oci_status="not_applicable",
        foreign_national_status="not_applicable",
        supernumerary_category="nri",
        record_status="accepted",
        identity_verification_status="verified",
        identity_reference="DEMO-APAAR-8801",
        created_by=admin_user.id,
    )
    student2 = StudentRecord(
        id=uuid.uuid4(),
        institution_id=inst.id,
        program_id=prog.id,
        admission_cycle="2026-27",
        institution_student_id="TEST-002",
        student_name="Zayn Malik",
        admission_category="foreign_national",
        admission_status="admitted",
        nri_category="not_applicable",
        oci_status="applicable",
        foreign_national_status="applicable",
        supernumerary_category="foreign_national",
        record_status="submitted",
        identity_verification_status="pending",
        identity_reference="DEMO-APAAR-8802",
        created_by=admin_user.id,
    )
    db_session.add_all([student1, student2])
    db_session.commit()

    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get(f"/api/v1/institutions/{inst.id}/compliance-dashboard?cycle=2026-27", headers=headers)
    assert response.status_code == 200

    data = response.json()
    assert data["institution"]["id"] == str(inst.id)
    assert data["admission_cycle"] == "2026-27"

    metrics = data["metrics"]
    assert metrics["approved_intake"] == 60
    assert metrics["actual_enrolment"] == 2
    assert metrics["supernumerary_seats"] == 2
    assert metrics["nri_count"] == 1
    assert metrics["oci_count"] == 1
    assert metrics["foreign_national_count"] == 1

    supernumerary = data["supernumerary_breakdown"]
    assert supernumerary["nri"] == 1
    assert supernumerary["foreign_national"] == 1

    assert len(data["programs"]) >= 1
    prog_data = [p for p in data["programs"] if p["program_id"] == str(prog.id)][0]
    assert prog_data["approved_capacity"] == 60
    assert prog_data["enrolled_count"] == 2

    assert len(data["students"]) == 2
    student_map = {s["institution_student_id"]: s for s in data["students"]}
    assert "TEST-001" in student_map
    assert student_map["TEST-001"]["nri_category"] == "applicable"
    assert student_map["TEST-001"]["supernumerary_category"] == "nri"
    assert student_map["TEST-002"]["foreign_national_status"] == "applicable"
    assert student_map["TEST-002"]["oci_status"] == "applicable"
