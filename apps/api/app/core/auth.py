from dataclasses import dataclass
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient, PyJWTError

from app.core.config import get_settings


bearer_scheme = HTTPBearer(auto_error=False)

_ALLOWED_ALGORITHMS = {"RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "EdDSA"}


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: UUID
    role: str
    session_id: UUID | None
    claims: dict
    access_token: str


def _unauthorized(code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": code, "message": message},
        headers={"WWW-Authenticate": "Bearer"},
    )


def verify_access_token(token: str) -> AuthenticatedUser:
    settings = get_settings()

    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")
        if algorithm not in _ALLOWED_ALGORITHMS:
            raise _unauthorized("AUTH_UNSUPPORTED_ALGORITHM", "Unsupported JWT signing algorithm.")

        jwks_client = PyJWKClient(settings.supabase_jwks_url, cache_jwk_set=True, lifespan=600)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=[algorithm],
            audience=settings.supabase_jwt_audience,
            issuer=settings.supabase_auth_issuer,
            options={"require": ["exp", "iat", "iss", "aud", "sub", "role"]},
        )

        user_id = UUID(str(claims["sub"]))
        role = str(claims["role"])
        if role != "authenticated":
            raise _unauthorized("AUTH_INVALID_ROLE", "JWT role is not an authenticated user role.")

        session_id = None
        if claims.get("session_id"):
            session_id = UUID(str(claims["session_id"]))

        return AuthenticatedUser(
            user_id=user_id,
            role=role,
            session_id=session_id,
            claims=dict(claims),
            access_token=token,
        )
    except HTTPException:
        raise
    except (PyJWTError, ValueError, RuntimeError) as exc:
        raise _unauthorized("AUTH_INVALID_TOKEN", "The Supabase access token could not be verified.") from exc


async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("AUTH_REQUIRED", "A Supabase access token is required.")
    return verify_access_token(credentials.credentials)
