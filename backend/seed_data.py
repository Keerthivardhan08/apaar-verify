"""
Synthetic seed data script for APAAR Verify.
Populates demonstration institutions, programs, intake limits, users,
and synthetic student records with deliberate anomalies for testing.

DISCLAIMER: All data generated is synthetic for demonstration purposes only.
"""
import uuid
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
import app.models  # Ensure all models are registered
from app.models.institution import Institution, Program, IntakeLimit
from app.models.user import User, UserRole
from app.models.student import StudentRecord, StudentIdentity
from app.models.audit import AuditEvent
from app.models.notification import Notification
from app.core.security import hash_password
from app.services.validation import validate_and_persist
from app.services.audit import log_event


def seed():
    print("Creating tables if they don't exist...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@aicte.gov.in").first():
            print("Database already contains seed data. Skipping seed.")
            return

        print("Seeding Institutions...")
        inst1 = Institution(
            id=uuid.uuid4(),
            institution_code="IIT-DEMO",
            name="Indian Institute of Technology (Demo)",
            institution_type="engineering",
            state="Delhi",
            city="New Delhi",
            status="active",
        )
        inst2 = Institution(
            id=uuid.uuid4(),
            institution_code="NIT-DEMO",
            name="National Institute of Technology (Demo)",
            institution_type="engineering",
            state="Karnataka",
            city="Surathkal",
            status="active",
        )
        inst3 = Institution(
            id=uuid.uuid4(),
            institution_code="DEC-DEMO",
            name="Demo Engineering College",
            institution_type="engineering",
            state="Maharashtra",
            city="Pune",
            status="active",
        )
        inst4 = Institution(
            id=uuid.uuid4(),
            institution_code="DSCE-BLR",
            name="Dayananda Sagar College of Engineering",
            institution_type="engineering",
            state="Karnataka",
            city="Bengaluru",
            status="active",
        )
        db.add_all([inst1, inst2, inst3, inst4])
        db.flush()

        print("Seeding Programs...")
        # IIT Programs
        prog_iit_cs = Program(
            id=uuid.uuid4(),
            institution_id=inst1.id,
            program_code="CS-UG-2026",
            program_name="B.Tech Computer Science & Engineering",
            academic_level="ug",
            branch="Computer Science",
            duration_years=4,
            status="active",
        )
        prog_iit_ee = Program(
            id=uuid.uuid4(),
            institution_id=inst1.id,
            program_code="EE-UG-2026",
            program_name="B.Tech Electrical Engineering",
            academic_level="ug",
            branch="Electrical",
            duration_years=4,
            status="active",
        )
        prog_iit_me = Program(
            id=uuid.uuid4(),
            institution_id=inst1.id,
            program_code="ME-UG-2026",
            program_name="B.Tech Mechanical Engineering",
            academic_level="ug",
            branch="Mechanical",
            duration_years=4,
            status="active",
        )

        # NIT Programs
        prog_nit_cs = Program(
            id=uuid.uuid4(),
            institution_id=inst2.id,
            program_code="CS-UG-2026",
            program_name="B.Tech Computer Science & Engineering",
            academic_level="ug",
            branch="Computer Science",
            duration_years=4,
            status="active",
        )
        prog_nit_ec = Program(
            id=uuid.uuid4(),
            institution_id=inst2.id,
            program_code="EC-UG-2026",
            program_name="B.Tech Electronics & Communication",
            academic_level="ug",
            branch="Electronics",
            duration_years=4,
            status="active",
        )

        # DSCE Programs
        prog_dsce_cs = Program(
            id=uuid.uuid4(),
            institution_id=inst4.id,
            program_code="CS-UG-2026",
            program_name="B.E. Computer Science & Engineering",
            academic_level="ug",
            branch="Computer Science",
            duration_years=4,
            status="active",
        )
        prog_dsce_ai = Program(
            id=uuid.uuid4(),
            institution_id=inst4.id,
            program_code="AI-UG-2026",
            program_name="B.E. Artificial Intelligence & Machine Learning",
            academic_level="ug",
            branch="Artificial Intelligence",
            duration_years=4,
            status="active",
        )
        prog_dsce_is = Program(
            id=uuid.uuid4(),
            institution_id=inst4.id,
            program_code="IS-UG-2026",
            program_name="B.E. Information Science & Engineering",
            academic_level="ug",
            branch="Information Science",
            duration_years=4,
            status="active",
        )

        db.add_all([
            prog_iit_cs, prog_iit_ee, prog_iit_me,
            prog_nit_cs, prog_nit_ec,
            prog_dsce_cs, prog_dsce_ai, prog_dsce_is
        ])
        db.flush()

        print("Seeding Intake Limits...")
        # Deliberately set IIT CS capacity to 10 so our 12 students trigger INTAKE_EXCEEDED
        intake_iit_cs = IntakeLimit(
            id=uuid.uuid4(),
            program_id=prog_iit_cs.id,
            admission_cycle="2026-27",
            approved_capacity=10,
            category="total",
            source_type="demonstration",
            source_reference="AICTE/DEMO/APPROVAL/2026/01",
            effective_from=date(2026, 6, 1),
            verification_status="verified",
        )
        intake_iit_ee = IntakeLimit(
            id=uuid.uuid4(),
            program_id=prog_iit_ee.id,
            admission_cycle="2026-27",
            approved_capacity=30,
            category="total",
            source_type="demonstration",
            source_reference="AICTE/DEMO/APPROVAL/2026/02",
            effective_from=date(2026, 6, 1),
            verification_status="verified",
        )
        intake_nit_cs = IntakeLimit(
            id=uuid.uuid4(),
            program_id=prog_nit_cs.id,
            admission_cycle="2026-27",
            approved_capacity=40,
            category="total",
            source_type="demonstration",
            source_reference="AICTE/DEMO/APPROVAL/2026/03",
            effective_from=date(2026, 6, 1),
            verification_status="verified",
        )
        intake_dsce_cs = IntakeLimit(
            id=uuid.uuid4(),
            program_id=prog_dsce_cs.id,
            admission_cycle="2026-27",
            approved_capacity=120,
            category="total",
            source_type="official",
            source_reference="AICTE/DSCE/APPROVAL/2026/01",
            effective_from=date(2026, 6, 1),
            verification_status="verified",
        )
        intake_dsce_ai = IntakeLimit(
            id=uuid.uuid4(),
            program_id=prog_dsce_ai.id,
            admission_cycle="2026-27",
            approved_capacity=60,
            category="total",
            source_type="official",
            source_reference="AICTE/DSCE/APPROVAL/2026/02",
            effective_from=date(2026, 6, 1),
            verification_status="verified",
        )
        db.add_all([intake_iit_cs, intake_iit_ee, intake_nit_cs, intake_dsce_cs, intake_dsce_ai])
        db.flush()

        print("Seeding Users & Roles...")
        pw_hash = hash_password("Demo@1234")

        # 1. AICTE Admin
        user_admin = User(
            id=uuid.uuid4(),
            email="admin@aicte.gov.in",
            password_hash=pw_hash,
            full_name="Dr. Rajiv Kumar (AICTE Admin)",
            status="active",
        )
        # 2. IIT Operator
        user_iit_op = User(
            id=uuid.uuid4(),
            email="operator@iit-demo.edu",
            password_hash=pw_hash,
            full_name="Anil Verma (IIT Operator)",
            status="active",
        )
        # 3. IIT Admin / Dean
        user_iit_admin = User(
            id=uuid.uuid4(),
            email="admin@iit-demo.edu",
            password_hash=pw_hash,
            full_name="Prof. S. R. Raman (IIT Dean / Admin)",
            status="active",
        )
        # 4. NIT Operator
        user_nit_op = User(
            id=uuid.uuid4(),
            email="operator@nit-demo.edu",
            password_hash=pw_hash,
            full_name="Suresh Nair (NIT Operator)",
            status="active",
        )
        # 5. DSCE Operator
        user_dsce_op = User(
            id=uuid.uuid4(),
            email="operator@dsce.edu.in",
            password_hash=pw_hash,
            full_name="Naveen Gowda (DSCE Operator)",
            status="active",
        )
        # 6. DSCE Admin / Principal
        user_dsce_admin = User(
            id=uuid.uuid4(),
            email="admin@dsce.edu.in",
            password_hash=pw_hash,
            full_name="Dr. C. P. S. Prakash (Principal / DSCE Admin)",
            status="active",
        )
        # 7. DEC Operator
        user_dec_op = User(
            id=uuid.uuid4(),
            email="operator@dec-demo.edu",
            password_hash=pw_hash,
            full_name="Kavita Patil (DEC Pune Operator)",
            status="active",
        )
        # 8. AICTE Compliance Reviewer
        user_reviewer = User(
            id=uuid.uuid4(),
            email="reviewer@aicte.gov.in",
            password_hash=pw_hash,
            full_name="Pooja Sharma (Compliance Reviewer)",
            status="active",
        )
        # 9. Corporate / Public Verifier
        user_verifier = User(
            id=uuid.uuid4(),
            email="verifier@demo.gov.in",
            password_hash=pw_hash,
            full_name="Vikramaditya Sen (Corporate / Public Verifier)",
            status="active",
        )
        db.add_all([
            user_admin, user_iit_op, user_iit_admin, user_nit_op,
            user_dsce_op, user_dsce_admin, user_dec_op, user_reviewer, user_verifier
        ])
        db.flush()

        # Roles
        roles = [
            UserRole(id=uuid.uuid4(), user_id=user_admin.id, role="aicte_admin"),
            UserRole(id=uuid.uuid4(), user_id=user_admin.id, role="reviewer"),
            UserRole(id=uuid.uuid4(), user_id=user_iit_op.id, role="institution_operator", institution_id=inst1.id),
            UserRole(id=uuid.uuid4(), user_id=user_iit_admin.id, role="institution_admin", institution_id=inst1.id),
            UserRole(id=uuid.uuid4(), user_id=user_nit_op.id, role="institution_operator", institution_id=inst2.id),
            UserRole(id=uuid.uuid4(), user_id=user_dsce_op.id, role="institution_operator", institution_id=inst4.id),
            UserRole(id=uuid.uuid4(), user_id=user_dsce_admin.id, role="institution_admin", institution_id=inst4.id),
            UserRole(id=uuid.uuid4(), user_id=user_dec_op.id, role="institution_operator", institution_id=inst3.id),
            UserRole(id=uuid.uuid4(), user_id=user_reviewer.id, role="reviewer"),
            UserRole(id=uuid.uuid4(), user_id=user_verifier.id, role="verifier"),
        ]
        db.add_all(roles)
        db.flush()

        print("Seeding Student Records with deliberate anomalies...")

        # Cross institution duplicate candidate identifier
        CROSS_ID = "DEMO-APAAR-CROSS99"

        # 12 records in IIT CS (Capacity is 10 -> INTAKE_EXCEEDED)
        students_data = [
            # Normal records
            {"name": "Aarav Sharma", "id": "IIT-CS-001", "ident": "DEMO-APAAR-1001", "prog": prog_iit_cs, "cat": "general", "nri": "not_applicable"},
            {"name": "Priya Patel", "id": "IIT-CS-002", "ident": "DEMO-APAAR-1002", "prog": prog_iit_cs, "cat": "obc", "nri": "not_applicable"},
            {"name": "Rahul Verma", "id": "IIT-CS-003", "ident": "DEMO-APAAR-1003", "prog": prog_iit_cs, "cat": "sc", "nri": "not_applicable"},
            {"name": "Sneha Reddy", "id": "IIT-CS-004", "ident": "DEMO-APAAR-1004", "prog": prog_iit_cs, "cat": "ews", "nri": "not_applicable"},
            {"name": "Vikram Singh", "id": "IIT-CS-005", "ident": "DEMO-APAAR-1005", "prog": prog_iit_cs, "cat": "general", "nri": "not_applicable"},
            # Inconsistent category anomaly (NRI applicable but category=general)
            {"name": "Rohan Mehta", "id": "IIT-CS-006", "ident": "DEMO-APAAR-1006", "prog": prog_iit_cs, "cat": "general", "nri": "applicable"},
            # Invalid identifier format anomaly
            {"name": "Kavya Nair", "id": "IIT-CS-007", "ident": "BAD_FORMAT_999", "prog": prog_iit_cs, "cat": "general", "nri": "not_applicable"},
            # Local duplicate pair (same identity reference)
            {"name": "Aditya Joshi", "id": "IIT-CS-008", "ident": "DEMO-APAAR-DUP10", "prog": prog_iit_cs, "cat": "general", "nri": "not_applicable"},
            {"name": "Aditya Joshi Duplicate", "id": "IIT-CS-009", "ident": "DEMO-APAAR-DUP10", "prog": prog_iit_cs, "cat": "general", "nri": "not_applicable"},
            # Cross-institution duplicate candidate
            {"name": "Ananya Rao", "id": "IIT-CS-010", "ident": CROSS_ID, "prog": prog_iit_cs, "cat": "general", "nri": "not_applicable"},
            # 11th and 12th push IIT CS over capacity
            {"name": "Karan Malhotra", "id": "IIT-CS-011", "ident": "DEMO-APAAR-1011", "prog": prog_iit_cs, "cat": "general", "nri": "not_applicable"},
            {"name": "Neha Gupta", "id": "IIT-CS-012", "ident": "DEMO-APAAR-1012", "prog": prog_iit_cs, "cat": "general", "nri": "not_applicable"},
        ]

        # NIT students (including matching cross-institution record)
        nit_students_data = [
            {"name": "Ananya Rao (Transfer/Duplicate)", "id": "NIT-CS-001", "ident": CROSS_ID, "prog": prog_nit_cs, "cat": "general", "nri": "not_applicable"},
            {"name": "Manish Tiwari", "id": "NIT-CS-002", "ident": "DEMO-APAAR-2002", "prog": prog_nit_cs, "cat": "obc", "nri": "not_applicable"},
            {"name": "Divya Krishnan", "id": "NIT-CS-003", "ident": "DEMO-APAAR-2003", "prog": prog_nit_cs, "cat": "general", "nri": "not_applicable"},
        ]

        # DSCE students
        dsce_students_data = [
            {"name": "Chirag Hegde", "id": "DSCE-2026-CS001", "ident": "987654321011", "prog": prog_dsce_cs, "cat": "general", "nri": "not_applicable"},
            {"name": "Aishwarya Rao", "id": "DSCE-2026-CS002", "ident": "987654321012", "prog": prog_dsce_cs, "cat": "obc", "nri": "not_applicable"},
            {"name": "Darshan Kumar", "id": "DSCE-2026-AI001", "ident": "987654321013", "prog": prog_dsce_ai, "cat": "sc", "nri": "not_applicable"},
            {"name": "Meghana B.", "id": "DSCE-2026-IS001", "ident": "987654321014", "prog": prog_dsce_is, "cat": "general", "nri": "not_applicable"},
        ]

        all_records = []
        for s in students_data:
            rec = StudentRecord(
                id=uuid.uuid4(),
                institution_id=inst1.id,
                program_id=s["prog"].id,
                admission_cycle="2026-27",
                institution_student_id=s["id"],
                student_name=s["name"],
                date_of_birth=date(2005, 5, 15),
                gender="male" if "a" in s["name"].lower() else "female",
                admission_category=s["cat"],
                admission_status="admitted",
                nri_category=s["nri"],
                oci_status="not_applicable",
                foreign_national_status="not_applicable",
                supernumerary_category="none",
                identity_reference=s["ident"],
                record_status="submitted",
                identity_verification_status="mock_verified" if not s["ident"].startswith("BAD") else "unverified",
                created_by=user_iit_op.id,
            )
            db.add(rec)
            all_records.append(rec)

        for s in nit_students_data:
            rec = StudentRecord(
                id=uuid.uuid4(),
                institution_id=inst2.id,
                program_id=s["prog"].id,
                admission_cycle="2026-27",
                institution_student_id=s["id"],
                student_name=s["name"],
                date_of_birth=date(2005, 8, 20),
                gender="female",
                admission_category=s["cat"],
                admission_status="admitted",
                nri_category=s["nri"],
                oci_status="not_applicable",
                foreign_national_status="not_applicable",
                supernumerary_category="none",
                identity_reference=s["ident"],
                record_status="submitted",
                identity_verification_status="mock_verified",
                created_by=user_nit_op.id,
            )
            db.add(rec)
            all_records.append(rec)

        for s in dsce_students_data:
            rec = StudentRecord(
                id=uuid.uuid4(),
                institution_id=inst4.id,
                program_id=s["prog"].id,
                admission_cycle="2026-27",
                institution_student_id=s["id"],
                student_name=s["name"],
                date_of_birth=date(2005, 7, 10),
                gender="male" if "Chirag" in s["name"] or "Darshan" in s["name"] else "female",
                admission_category=s["cat"],
                admission_status="admitted",
                nri_category=s["nri"],
                oci_status="not_applicable",
                foreign_national_status="not_applicable",
                supernumerary_category="none",
                identity_reference=s["ident"],
                record_status="submitted",
                identity_verification_status="mock_verified",
                created_by=user_dsce_op.id,
            )
            db.add(rec)
            all_records.append(rec)

        db.flush()

        print("Executing Validation Engine across all records...")
        for rec in all_records:
            validate_and_persist(rec, db)

        print("Logging Initial Audit & Notification events...")
        log_event(
            db=db,
            action="system.seed_completed",
            target_type="database",
            outcome="success",
            actor_id=user_admin.id,
            metadata={"records_seeded": len(all_records), "institutions": 4},
        )

        notif = Notification(
            id=uuid.uuid4(),
            recipient_id=user_admin.id,
            notification_type="system_alert",
            title="Integrity Anomaly Detected",
            message="Initial submission validation identified capacity overages and cross-institution duplicates.",
            created_at=datetime.now(timezone.utc),
        )
        db.add(notif)

        db.commit()
        print("[SUCCESS] Seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seed: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed()
