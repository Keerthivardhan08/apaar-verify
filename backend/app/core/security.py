import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import bcrypt
from jose import jwt, JWTError

from app.config import settings
from app.core.exceptions import AuthenticationError


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_bytes = plain_password.encode("utf-8")
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    pwd_bytes = password.encode("utf-8")
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


hash_password = get_password_hash


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "access",
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "refresh",
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as exc:
        raise AuthenticationError(detail=f"Token verification failed: {str(exc)}")


decode_token = verify_token



def compute_identifier_fingerprint(identifier: Optional[str]) -> Optional[str]:
    """
    Compute a keyed HMAC-SHA256 fingerprint for a student's APAAR/demo identifier.
    Guarantees privacy while enabling duplicate detection across institutions.
    """
    if not identifier:
        return None
    cleaned = identifier.strip().upper()
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        cleaned.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def mask_fingerprint(fingerprint: Optional[str]) -> Optional[str]:
    """
    Mask a sensitive identifier fingerprint for display in lists.
    """
    if not fingerprint:
        return None
    if len(fingerprint) <= 10:
        return "****"
    return f"{fingerprint[:4]}...{fingerprint[-4:]}"
