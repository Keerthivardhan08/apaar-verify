"""
Asymmetric Cryptographic Trust Framework (PKI) Service.

Provides:
- RSA-2048 asymmetric key pair management with file-backed persistence.
- RS256 token signing (cryptographic non-repudiation).
- Dynamic JWKS (JSON Web Key Set) generation conforming to RFC 7517.
- Public key isolation (verifiers require only the public JWKS to validate credentials).
"""
import base64
import os
from pathlib import Path
from typing import Any, Dict, Optional

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import jwt, JWTError


DEFAULT_KEY_ID = "apaar-rsa-2026-v1"
KEYS_DIR = Path(__file__).resolve().parent.parent.parent / ".keys"
PRIVATE_KEY_PATH = KEYS_DIR / "apaar_private_key.pem"
PUBLIC_KEY_PATH = KEYS_DIR / "apaar_public_key.pem"


class PKIService:
    """Manages RSA-2048 cryptographic operations, key storage, and JWKS endpoints."""

    def __init__(self, key_id: str = DEFAULT_KEY_ID):
        self.key_id = key_id
        self._private_key: Optional[rsa.RSAPrivateKey] = None
        self._public_key: Optional[rsa.RSAPublicKey] = None
        self._initialize_keys()

    def _initialize_keys(self) -> None:
        """Load existing RSA keys from disk, or generate a fresh 2048-bit key pair."""
        KEYS_DIR.mkdir(parents=True, exist_ok=True)

        if PRIVATE_KEY_PATH.exists() and PUBLIC_KEY_PATH.exists():
            try:
                with open(PRIVATE_KEY_PATH, "rb") as f:
                    self._private_key = serialization.load_pem_private_key(
                        f.read(),
                        password=None,
                    )
                with open(PUBLIC_KEY_PATH, "rb") as f:
                    self._public_key = serialization.load_pem_public_key(f.read())
                return
            except Exception:
                # If key file is corrupted, regenerate safely
                pass

        # Generate fresh RSA 2048-bit key pair
        self._private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        self._public_key = self._private_key.public_key()

        # Persist PEM files
        private_bytes = self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        public_bytes = self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        with open(PRIVATE_KEY_PATH, "wb") as f:
            f.write(private_bytes)
        with open(PUBLIC_KEY_PATH, "wb") as f:
            f.write(public_bytes)

    def get_private_key_pem(self) -> str:
        """Returns private key in PEM format."""
        return self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode("utf-8")

    def get_public_key_pem(self) -> str:
        """Returns public key in PEM format."""
        return self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")

    @staticmethod
    def _int_to_base64url(val: int) -> str:
        """Convert a positive integer to Base64URL string without padding (RFC 7517)."""
        val_bytes = val.to_bytes((val.bit_length() + 7) // 8, byteorder="big")
        return base64.urlsafe_b64encode(val_bytes).rstrip(b"=").decode("ascii")

    def get_jwk(self) -> Dict[str, Any]:
        """Returns public key as a single RFC 7517 JWK dictionary."""
        public_numbers = self._public_key.public_numbers()
        return {
            "kty": "RSA",
            "use": "sig",
            "alg": "RS256",
            "kid": self.key_id,
            "n": self._int_to_base64url(public_numbers.n),
            "e": self._int_to_base64url(public_numbers.e),
        }

    def get_jwks(self) -> Dict[str, Any]:
        """Returns standard RFC 7517 JWKS structure for /.well-known/jwks.json."""
        return {
            "keys": [self.get_jwk()]
        }

    def sign_jwt(self, payload: Dict[str, Any], extra_headers: Optional[Dict[str, Any]] = None) -> str:
        """
        Sign a JWT payload using RS256 with the managed private key.
        Injects standard headers (alg: RS256, kid).
        """
        headers = {
            "alg": "RS256",
            "typ": "JWT",
            "kid": self.key_id,
        }
        if extra_headers:
            headers.update(extra_headers)

        return jwt.encode(
            payload,
            self.get_private_key_pem(),
            algorithm="RS256",
            headers=headers,
        )

    def verify_jwt(self, token: str, audience: Optional[str] = None) -> Dict[str, Any]:
        """
        Verify an RS256 signed JWT using the isolated public key.
        Raises JWTError if invalid or expired.
        """
        options = {"verify_aud": False} if not audience else {}
        return jwt.decode(
            token,
            self.get_public_key_pem(),
            algorithms=["RS256"],
            audience=audience,
            options=options,
        )

    def get_metadata(self) -> Dict[str, Any]:
        """Returns public metadata about the active trust framework."""
        jwk = self.get_jwk()
        return {
            "key_id": self.key_id,
            "algorithm": "RS256",
            "key_type": "RSA-2048",
            "key_usage": "Digital Signature (Verifiable Credentials)",
            "jwk": jwk,
            "public_key_pem": self.get_public_key_pem(),
            "jwks_url": "/api/v1/.well-known/jwks.json",
            "status": "active",
        }


# Global singleton instance
pki_service = PKIService()
