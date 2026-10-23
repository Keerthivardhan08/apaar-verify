import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class VerificationRequestCreate(BaseModel):
    record_id: uuid.UUID
    purpose: str
    claims: Optional[Dict[str, Any]] = None


class VerifyTokenRequest(BaseModel):
    token: str


class RevokeCredentialRequest(BaseModel):
    reason: Optional[str] = "Revoked by issuer"


class VerificationCredentialOut(BaseModel):
    id: uuid.UUID
    issuer_id: str
    subject_reference: str
    record_id: uuid.UUID
    claims: Dict[str, Any]
    issued_at: datetime
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    credential_status: str
    token: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerificationResultOut(BaseModel):
    valid: bool
    result: str
    message: Optional[str] = None
    issuer: Optional[str] = None
    subject_reference: Optional[str] = None
    claims: Optional[Dict[str, Any]] = None
    issued_at: Optional[str] = None
    expires_at: Optional[str] = None
    revoked_at: Optional[str] = None
    demo: bool = True
    note: Optional[str] = None
    verification_status: Optional[str] = None
