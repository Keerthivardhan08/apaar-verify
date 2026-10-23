"""
Zero-Knowledge & Blinded Privacy Claim Proofs API Router.
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.services.zk_exchange import (
    generate_blinded_claim_proof,
    verify_blinded_claim_proof,
    SUPPORTED_PREDICATES,
)

router = APIRouter(prefix="/privacy-exchange", tags=["Zero-Knowledge & Blinded Privacy Exchange"])


class IssueBlindedProofRequest(BaseModel):
    record_id: uuid.UUID
    predicate: str
    verifier_audience: str


class VerifyBlindedProofRequest(BaseModel):
    proof_token: str


@router.get("/predicates", summary="List Supported Privacy Claim Predicates")
def get_supported_predicates():
    """Returns list of supported zero-knowledge verifiable assertions."""
    return [
        {"predicate": k, "description": v}
        for k, v in SUPPORTED_PREDICATES.items()
    ]


@router.post("/blinded-proof", status_code=status.HTTP_201_CREATED, summary="Issue Blinded Claim Proof")
def issue_blinded_proof(
    body: IssueBlindedProofRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Issues an asymmetrically signed, blinded zero-knowledge assertion token for a student record.
    Allows proving assertions (e.g. minimum age, valid enrollment standing) without disclosing raw PII.
    """
    try:
        proof = generate_blinded_claim_proof(
            record_id=body.record_id,
            predicate=body.predicate,
            verifier_audience=body.verifier_audience,
            db=db,
        )
        return proof
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-proof", summary="Verify Blinded Claim Proof")
def verify_blinded_proof(
    body: VerifyBlindedProofRequest,
):
    """
    Verifies a blinded proof token using the public RSA keys published at /.well-known/jwks.json.
    Confirms cryptographic authenticity and mathematical truth of the predicate assertion.
    """
    result = verify_blinded_claim_proof(body.proof_token)
    if not result.get("valid"):
        raise HTTPException(status_code=400, detail=result.get("error", "Invalid proof token"))
    return result
