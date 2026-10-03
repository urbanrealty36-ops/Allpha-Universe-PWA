import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_publishable_key: str
    supabase_jwt_audience: str = "authenticated"
    supabase_service_role_key: str = ""
    midtrans_server_key: str = ""
    midtrans_client_key: str = ""
    midtrans_environment: str = "sandbox"
    allpha_public_web_url: str = "http://localhost:3000"
    security_pepper: str = ""
    trusted_proxy_ips: str = ""
    security_pepper: str = ""
    trusted_proxy_ips: str = ""

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
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip(),
        midtrans_server_key=os.getenv("MIDTRANS_SERVER_KEY", "").strip(),
        midtrans_client_key=os.getenv("MIDTRANS_CLIENT_KEY", "").strip(),
        midtrans_environment=os.getenv("MIDTRANS_ENVIRONMENT", "sandbox").strip() or "sandbox",
        allpha_public_web_url=os.getenv("ALLPHA_PUBLIC_WEB_URL", "http://localhost:3000").strip().rstrip("/"),
        security_pepper=os.getenv("ALLPHA_SECURITY_PEPPER", "").strip(),
        trusted_proxy_ips=os.getenv("TRUSTED_PROXY_IPS", "").strip(),
        security_pepper=os.getenv("ALLPHA_SECURITY_PEPPER", "").strip(),
        trusted_proxy_ips=os.getenv("TRUSTED_PROXY_IPS", "").strip(),
        supabase_jwt_audience=os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated").strip()
        or "authenticated",
    )
