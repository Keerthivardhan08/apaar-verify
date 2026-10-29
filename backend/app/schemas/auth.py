import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str  # Can be an email address or student APAAR ID
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


class UserRoleOut(BaseModel):
    id: Optional[uuid.UUID] = None
    role: str
    institution_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    status: str
    roles: List[UserRoleOut] = []
    apaar_id: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str
