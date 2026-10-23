import uuid
from typing import Any, Callable, List, Optional
from fastapi import Depends, Header
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole
from app.core.security import verify_token
from app.core.exceptions import AuthenticationError, PermissionDeniedError


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError(detail="Missing or invalid Authorization header")
    
    token = authorization.split(" ", 1)[1]
    payload = verify_token(token)
    
    token_type = payload.get("type")
    if token_type != "access":
        raise AuthenticationError(detail="Invalid token type, expected access token")
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AuthenticationError(detail="Token subject missing")
    
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthenticationError(detail="Invalid user id in token")
        
    stmt = (
        select(User)
        .options(selectinload(User.roles))
        .where(User.id == user_uuid)
    )
    user = db.execute(stmt).scalar_one_or_none()
    
    if not user:
        raise AuthenticationError(detail="User no longer exists")
        
    if user.status != "active":
        raise PermissionDeniedError(detail=f"User account is {user.status}")
        
    return user


def require_role(*allowed_roles: str) -> Callable[[User], User]:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_names = [r.role for r in current_user.roles]
        
        # AICTE admin has universal access
        if "aicte_admin" in user_role_names:
            return current_user
            
        for role in allowed_roles:
            if role in user_role_names:
                return current_user
                
        raise PermissionDeniedError(
            detail=f"User does not have required permissions (requires: {', '.join(allowed_roles)})"
        )
    return role_checker


# Alias for plural naming convention
require_roles = require_role


def require_institution_access(
    arg1: Any,
    arg2: Any,
) -> None:
    """
    Validates that user has permission for institution.
    Supports either (current_user, target_institution_id) or (target_institution_id, current_user).
    """
    if isinstance(arg1, User):
        current_user, target_institution_id = arg1, arg2
    else:
        target_institution_id, current_user = arg1, arg2

    user_role_names = [r.role for r in current_user.roles]
    if "aicte_admin" in user_role_names or "reviewer" in user_role_names:
        return
        
    for r in current_user.roles:
        if r.institution_id and r.institution_id == target_institution_id:
            return
            
    raise PermissionDeniedError(detail="Access to requested institution denied")


def get_user_roles(user: User) -> List[str]:
    return [r.role for r in user.roles]


def get_user_institution_ids(user: User) -> List[uuid.UUID]:
    return [r.institution_id for r in user.roles if r.institution_id]


def get_user_scoped_institution_id(current_user: User) -> Optional[uuid.UUID]:
    """
    Returns the institution_id if the user is scoped to a specific institution.
    Returns None if the user has global scope (aicte_admin or reviewer).
    """
    user_role_names = get_user_roles(current_user)
    if "aicte_admin" in user_role_names or "reviewer" in user_role_names:
        return None
        
    for r in current_user.roles:
        if r.institution_id:
            return r.institution_id
            
    return None

