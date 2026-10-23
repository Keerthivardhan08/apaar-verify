"""Auth API router — login, logout, token refresh, and current user."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, ConfigDict

from app.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.permissions import get_current_user
from app.models.user import User
from app.services.audit import log_event
from jose import JWTError

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
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


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return JWT tokens."""
    user = db.query(User).filter(User.email == request.email).first()

    # Use constant-time comparison to prevent timing attacks
    if not user or not verify_password(request.password, user.password_hash):
        log_event(
            db=db,
            action="auth.login.failed",
            target_type="user",
            outcome="failure",
            metadata={"email_domain": request.email.split("@")[-1] if "@" in request.email else "unknown"},
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive or suspended.",
        )

    # Update last login
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

    roles = [{"role": r.role, "institution_id": str(r.institution_id) if r.institution_id else None}
             for r in user.roles]

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(id=str(user.id), email=user.email, full_name=user.full_name, roles=roles),
    )


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

    import uuid
    user_id = uuid.UUID(payload["sub"])
    user = db.query(User).filter(User.id == user_id, User.status == "active").first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Return current user profile and role assignments."""
    roles = [
        {"role": r.role, "institution_id": str(r.institution_id) if r.institution_id else None}
        for r in current_user.roles
    ]
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "status": current_user.status,
        "roles": roles,
        "last_login_at": current_user.last_login_at.isoformat() if current_user.last_login_at else None,
    }
