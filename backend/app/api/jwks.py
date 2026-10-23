"""
JWKS & PKI Public Trust API Router.

Endpoints:
- GET /api/v1/.well-known/jwks.json : Standard RFC 7517 JSON Web Key Set for third-party public key verification
- GET /api/v1/.well-known/pki/metadata : Detailed asymmetric trust framework metadata
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.pki import pki_service

router = APIRouter(tags=["Cryptographic Trust Framework"])


@router.get("/.well-known/jwks.json", summary="JSON Web Key Set (RFC 7517)")
async def get_jwks():
    """
    Public RFC 7517 JWKS endpoint.
    Third-party verifiers, employer systems, and foreign institutions can use this endpoint
    to dynamically retrieve the current public RSA key to verify credential tokens locally
    without making any direct calls to the student database.
    """
    jwks = pki_service.get_jwks()
    return JSONResponse(
        content=jwks,
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/.well-known/pki/metadata", summary="PKI Trust Metadata")
async def get_pki_metadata():
    """
    Returns public certificate metadata, algorithm specifications, and public key PEM.
    """
    return pki_service.get_metadata()
