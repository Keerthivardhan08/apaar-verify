import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User, UserRole
from app.models.institution import Institution, Program, IntakeLimit
from app.core.security import hash_password

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test institution
    import uuid, datetime
    inst = Institution(
        id=uuid.uuid4(),
        institution_code="TEST-INST",
        name="Test Institute of Technology",
        institution_type="engineering",
        state="Delhi",
        city="New Delhi",
        status="active",
    )
    db.add(inst)
    db.flush()

    # Create test program
    prog = Program(
        id=uuid.uuid4(),
        institution_id=inst.id,
        program_code="CS-TEST",
        program_name="Computer Science",
        academic_level="ug",
        branch="CS",
        duration_years=4,
        status="active",
    )
    db.add(prog)
    db.flush()

    # Create admin user
    admin = User(
        id=uuid.uuid4(),
        email="testadmin@aicte.gov.in",
        password_hash=hash_password("Demo@1234"),
        full_name="Test Admin",
        status="active",
    )
    db.add(admin)
    db.flush()

    role = UserRole(
        id=uuid.uuid4(),
        user_id=admin.id,
        role="aicte_admin",
    )
    db.add(role)

    # Create operator user
    operator = User(
        id=uuid.uuid4(),
        email="testop@test.edu",
        password_hash=hash_password("Demo@1234"),
        full_name="Test Operator",
        status="active",
    )
    db.add(operator)
    db.flush()

    op_role = UserRole(
        id=uuid.uuid4(),
        user_id=operator.id,
        role="institution_operator",
        institution_id=inst.id,
    )
    db.add(op_role)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "testadmin@aicte.gov.in", "password": "Demo@1234"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture
def operator_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "testop@test.edu", "password": "Demo@1234"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_student(db_session):
    from app.models.student import StudentRecord
    from app.models.institution import Institution, Program
    from app.models.user import User
    import uuid, datetime

    inst = db_session.query(Institution).first()
    prog = db_session.query(Program).first()
    user = db_session.query(User).first()

    student = StudentRecord(
        id=uuid.uuid4(),
        institution_id=inst.id,
        program_id=prog.id,
        admission_cycle="2026-27",
        institution_student_id="TST-STD-001",
        student_name="Test Student",
        date_of_birth=datetime.date(2004, 1, 1),
        gender="male",
        admission_category="general",
        admission_status="admitted",
        created_by=user.id,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student
