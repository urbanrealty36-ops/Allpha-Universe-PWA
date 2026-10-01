import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_publishable_key: str
    supabase_jwt_audience: str = "authenticated"

    @property
    def supabase_auth_issuer(self) -> str:
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @property
    def supabase_jwks_url(self) -> str:
        return f"{self.supabase_auth_issuer}/.well-known/jwks.json"


def get_settings() -> Settings:
    url = os.getenv("SUPABASE_URL", "").strip()
    publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "").strip()
    if not url or not publishable_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured for authenticated API access."
        )
    return Settings(
        supabase_url=url,
        supabase_publishable_key=publishable_key,
        supabase_jwt_audience=os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated").strip()
        or "authenticated",
    )
