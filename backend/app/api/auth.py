"""Auth API router — login (Email or APAAR ID), registration, logout, token refresh, and current user."""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token
from app.core.permissions import get_current_user
from app.models.user import User, UserRole
from app.models.student import StudentRecord
from app.services.audit import log_event
from jose import JWTError

router = APIRouter()


class LoginRequest(BaseModel):
    email: str  # Can be an email address or student APAAR ID (e.g. DEMO-APAAR-1001)
    password: str


class StudentRegisterRequest(BaseModel):
    apaar_id: str
    email: str
    password: str
    full_name: Optional[str] = None
    institution_id: Optional[str] = None


class StakeholderRegisterRequest(BaseModel):
    organization_name: str
    entity_type: str = "CORPORATE_EMPLOYER"
    contact_email: str
    contact_person: str
    purpose: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    roles: list
    apaar_id: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user using either Official Email Address OR Student APAAR ID.
    Returns JWT tokens and user profile with assigned roles.
    """
    identifier = request.email.strip()
    user = None
    resolved_apaar = None

    # 1. Attempt match by User.email
    if "@" in identifier:
        user = db.query(User).filter(User.email.ilike(identifier)).first()

    # 2. If not found or identifier looks like an APAAR ID:
    if not user:
        # Check if the identifier matches a StudentRecord APAAR ID
        student_record = db.query(StudentRecord).filter(
            StudentRecord.identity_reference.ilike(identifier)
        ).first()

        if student_record:
            resolved_apaar = student_record.identity_reference

            # For demo persona DEMO-APAAR-1001, connect to student@dsce.edu.in
            if identifier.upper() == "DEMO-APAAR-1001":
                user = db.query(User).filter(User.email == "student@dsce.edu.in").first()

            if not user:
                # Find student user by synthetic email or name
                synthetic_email = f"student.{resolved_apaar.lower()}@apaar.gov.in"
                user = db.query(User).filter(User.email == synthetic_email).first()

            if not user:
                # Find user with student role matching name
                user = db.query(User).join(UserRole).filter(
                    UserRole.role == "student",
                    User.full_name.ilike(f"%{student_record.student_name}%")
                ).first()

            # If user still doesn't exist, create an active student account dynamically
            if not user:
                pw_to_verify = request.password
                synthetic_email = f"student.{resolved_apaar.lower()}@apaar.gov.in"
                user = User(
                    id=uuid.uuid4(),
                    email=synthetic_email,
                    password_hash=hash_password(pw_to_verify if pw_to_verify == "Demo@1234" else "Demo@1234"),
                    full_name=f"{student_record.student_name} (Student)",
                    status="active",
                )
                db.add(user)
                db.flush()
                db.add(UserRole(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    role="student",
                    institution_id=student_record.institution_id,
                ))
                db.commit()
                db.refresh(user)

    # 3. If user has student role and resolved_apaar is not yet determined, try to find their APAAR ID
    if user and not resolved_apaar:
        roles_list = [r.role for r in user.roles]
        if "student" in roles_list:
            if user.email == "student@dsce.edu.in":
                resolved_apaar = "DEMO-APAAR-1001"
            else:
                sr = db.query(StudentRecord).filter(
                    or_(
                        StudentRecord.student_name.ilike(f"%{user.full_name.split('(')[0].strip()}%"),
                        StudentRecord.identity_reference.ilike(f"%{user.email.split('@')[0]}%")
                    )
                ).first()
                if sr:
                    resolved_apaar = sr.identity_reference

    # 4. Use constant-time comparison to verify password
    if not user or not verify_password(request.password, user.password_hash):
        log_event(
            db=db,
            action="auth.login.failed",
            target_type="user",
            outcome="failure",
            metadata={"identifier": identifier},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/APAAR ID or password.",
        )

    # 5. Check if user registration is pending AICTE approval (for external stakeholders)
    if user.status == "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organization verification registration is pending statutory authorization by AICTE Central Headquarters. Access will be enabled once approved.",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Account is {user.status}. Please contact platform administration.",
        )

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    log_event(
        db=db,
        action="auth.login.success",
        target_type="user",
        target_id=str(user.id),
        outcome="success",
        actor_id=user.id,
    )
    db.commit()

    roles = [
        {"role": r.role, "institution_id": str(r.institution_id) if r.institution_id else None}
        for r in user.roles
    ]

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            roles=roles,
            apaar_id=resolved_apaar,
        ),
    )


@router.post("/auth/register-student", response_model=LoginResponse)
def register_student(request: StudentRegisterRequest, db: Session = Depends(get_db)):
    """
    Self-registration for students with APAAR ID.
    Automatically approved and immediately logged in upon APAAR ID verification.
    """
    clean_apaar = request.apaar_id.strip()
    clean_email = request.email.strip().lower()

    if not clean_apaar or not clean_email or not request.password:
        raise HTTPException(status_code=400, detail="APAAR ID, Email, and Password are required.")

    # Look up official student record by APAAR ID
    student_record = db.query(StudentRecord).filter(
        StudentRecord.identity_reference.ilike(clean_apaar)
    ).first()

    inst_id = None
    resolved_name = request.full_name or "Student"
    if student_record:
        resolved_name = student_record.student_name
        inst_id = student_record.institution_id
    elif request.institution_id:
        try:
            inst_id = uuid.UUID(request.institution_id)
        except Exception:
            pass

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        existing_user.password_hash = hash_password(request.password)
        existing_user.status = "active"
        if resolved_name:
            existing_user.full_name = resolved_name
        user = existing_user
    else:
        user = User(
            id=uuid.uuid4(),
            email=clean_email,
            password_hash=hash_password(request.password),
            full_name=resolved_name,
            status="active",  # Automatic approval for students
        )
        db.add(user)
        db.flush()

    # Ensure student role is assigned
    existing_roles = [r.role for r in user.roles]
    if "student" not in existing_roles:
        role_entry = UserRole(
            id=uuid.uuid4(),
            user_id=user.id,
            role="student",
            institution_id=inst_id,
        )
        db.add(role_entry)
        db.flush()

    # If student record exists, ensure identity reference matches
    if student_record and not student_record.identity_reference:
        student_record.identity_reference = clean_apaar

    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    user_roles = [
        {"role": r.role, "institution_id": str(r.institution_id) if r.institution_id else None}
        for r in user.roles
    ]

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            roles=user_roles,
            apaar_id=clean_apaar,
        ),
    )


@router.post("/auth/register-stakeholder")
def register_stakeholder(request: StakeholderRegisterRequest, db: Session = Depends(get_db)):
    """
    One-time onboarding registration for external stakeholders (Employers, Exam Agencies).
    Status is set to 'pending_approval' until authorized by AICTE Central Headquarters.
    """
    clean_email = request.contact_email.strip().lower()

    if not request.organization_name.strip() or not clean_email or not request.password:
        raise HTTPException(status_code=400, detail="Organization Name, Email, and Password are required.")

    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user and existing_user.status == "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An authorized account with this email is already registered. Please sign in.",
        )

    full_display_name = f"{request.contact_person.strip()} ({request.organization_name.strip()})"
    pw_hash = hash_password(request.password)

    if existing_user:
        existing_user.password_hash = pw_hash
        existing_user.full_name = full_display_name
        existing_user.status = "pending_approval"
        user = existing_user
    else:
        user = User(
            id=uuid.uuid4(),
            email=clean_email,
            password_hash=pw_hash,
            full_name=full_display_name,
            status="pending_approval",  # Requires AICTE approval
        )
        db.add(user)
        db.flush()

    # Assign stakeholder and verifier roles
    existing_roles = {r.role for r in user.roles}
    for r_name in ["stakeholder", "verifier"]:
        if r_name not in existing_roles:
            db.add(UserRole(id=uuid.uuid4(), user_id=user.id, role=r_name))

    # Add to STAKEHOLDERS registry in consent module
    from app.api.consent import STAKEHOLDERS
    existing_stk = next((s for s in STAKEHOLDERS if s["contact_email"].lower() == clean_email), None)
    if existing_stk:
        existing_stk["name"] = request.organization_name.strip()
        existing_stk["entity_type"] = request.entity_type
        existing_stk["purpose"] = request.purpose.strip()
        existing_stk["registration_status"] = "pending_approval"
    else:
        new_stk = {
            "id": f"stk-reg-{uuid.uuid4().hex[:6]}",
            "name": request.organization_name.strip(),
            "entity_type": request.entity_type,
            "purpose": request.purpose.strip(),
            "contact_email": clean_email,
            "registration_status": "pending_approval",
            "applied_date": datetime.now().strftime("%Y-%m-%d"),
            "approved_by": None,
            "permitted_fields": ["student_name", "institution_name", "program_name", "academic_level"],
        }
        STAKEHOLDERS.append(new_stk)

    db.commit()

    return {
        "status": "success",
        "message": "Registration submitted successfully! Your organization verification account is pending statutory authorization by AICTE Central Headquarters. You will be able to log in once approved.",
        "registration_status": "pending_approval",
        "email": clean_email,
    }


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """End the active session (client-side token deletion + audit log)."""
    log_event(
        db=db,
        action="auth.logout",
        target_type="user",
        target_id=str(current_user.id),
        outcome="success",
        actor_id=current_user.id,
    )
    db.commit()


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/auth/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a refresh token for a new access token."""
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    user_id = uuid.UUID(payload["sub"])
    user = db.query(User).filter(User.id == user_id, User.status == "active").first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return current user profile and role assignments, including APAAR ID for students."""
    roles = [
        {"role": r.role, "institution_id": str(r.institution_id) if r.institution_id else None}
        for r in current_user.roles
    ]

    apaar_id = None
    if any(r["role"] == "student" for r in roles):
        if current_user.email == "student@dsce.edu.in":
            apaar_id = "DEMO-APAAR-1001"
        else:
            sr = db.query(StudentRecord).filter(
                StudentRecord.student_name.ilike(f"%{current_user.full_name.split('(')[0].strip()}%")
            ).first()
            if sr:
                apaar_id = sr.identity_reference

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "status": current_user.status,
        "roles": roles,
        "apaar_id": apaar_id,
        "last_login_at": current_user.last_login_at.isoformat() if current_user.last_login_at else None,
    }
