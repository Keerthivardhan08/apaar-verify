from typing import Any, Optional
from fastapi import HTTPException, status


class APAARBaseException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        code: Optional[str] = None,
        headers: Optional[dict[str, str]] = None,
        extra: Optional[Any] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.code = code or "ERROR"
        self.extra = extra


class AuthenticationError(APAARBaseException):
    def __init__(self, detail: str = "Could not validate credentials", code: str = "AUTH_FAILED"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            code=code,
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionDeniedError(APAARBaseException):
    def __init__(self, detail: str = "Permission denied for this resource", code: str = "PERMISSION_DENIED"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            code=code,
        )


class NotFoundError(APAARBaseException):
    def __init__(self, detail: str = "Resource not found", code: str = "NOT_FOUND"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            code=code,
        )


class ValidationError(APAARBaseException):
    def __init__(self, detail: str = "Data validation error", code: str = "VALIDATION_FAILED", extra: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            code=code,
            extra=extra,
        )


class ConflictError(APAARBaseException):
    def __init__(self, detail: str = "Resource conflict", code: str = "CONFLICT"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            code=code,
        )


class BadRequestError(APAARBaseException):
    def __init__(self, detail: str = "Bad request", code: str = "BAD_REQUEST"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            code=code,
        )


APAARException = APAARBaseException


async def apaar_exception_handler(request, exc: APAARException):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": getattr(exc, "code", "ERROR"), "extra": getattr(exc, "extra", None)},
        headers=exc.headers,
    )


async def validation_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors() if hasattr(exc, "errors") else str(exc), "code": "VALIDATION_ERROR"},
    )


async def http_exception_handler(request, exc: HTTPException):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": "HTTP_ERROR"},
        headers=exc.headers,
    )

