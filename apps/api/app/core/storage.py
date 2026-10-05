from typing import Any
from urllib.parse import quote

import httpx

from app.core.auth import AuthenticatedUser
from app.core.config import get_settings


class SupabaseStorageError(RuntimeError):
    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def _headers(user: AuthenticatedUser) -> dict[str, str]:
    settings = get_settings()
    return {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {user.access_token}",
        "Accept": "application/json",
    }


def _base_url() -> str:
    return f"{get_settings().supabase_url.rstrip('/')}/storage/v1"


async def create_signed_upload_url(
    user: AuthenticatedUser,
    bucket: str,
    path: str,
) -> dict[str, Any]:
    url = f"{_base_url()}/object/upload/sign/{quote(bucket, safe='')}/{quote(path, safe='/')}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(url, json={}, headers=_headers(user))

    if response.status_code >= 400:
        raise SupabaseStorageError(response.status_code, "Supabase Storage upload signing failed.")

    payload = response.json()
    relative_url = payload.get("url")
    if not isinstance(relative_url, str) or not relative_url:
        raise SupabaseStorageError(502, "Supabase Storage did not return an upload URL.")

    signed_url = relative_url if relative_url.startswith("http") else f"{_base_url()}{relative_url}"
    token = signed_url.split("token=", 1)[1] if "token=" in signed_url else None
    if not token:
        raise SupabaseStorageError(502, "Supabase Storage did not return an upload token.")

    return {"signed_url": signed_url, "token": token, "path": path}


async def create_signed_download_url(
    user: AuthenticatedUser,
    bucket: str,
    path: str,
    expires_in: int = 900,
) -> str:
    url = f"{_base_url()}/object/sign/{quote(bucket, safe='')}/{quote(path, safe='/')}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            url,
            json={"expiresIn": expires_in},
            headers={**_headers(user), "Content-Type": "application/json"},
        )

    if response.status_code >= 400:
        raise SupabaseStorageError(response.status_code, "Supabase Storage signing failed.")

    payload = response.json()
    relative_url = payload.get("signedURL")
    if not isinstance(relative_url, str) or not relative_url:
        raise SupabaseStorageError(502, "Supabase Storage did not return a signed URL.")
    return relative_url if relative_url.startswith("http") else f"{_base_url()}{relative_url}"

async def create_service_signed_download_url(
    bucket: str,
    path: str,
    expires_in: int = 900,
) -> str:
    """Create a short-lived signed URL for a server-approved public asset."""
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise SupabaseStorageError(500, "Supabase service role signing is not configured.")
    url = f"{_base_url()}/object/sign/{quote(bucket, safe='')}/{quote(path, safe='/')}"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(url, json={"expiresIn": expires_in}, headers=headers)
    if response.status_code >= 400:
        raise SupabaseStorageError(response.status_code, "Supabase Storage service signing failed.")
    payload = response.json()
    relative_url = payload.get("signedURL")
    if not isinstance(relative_url, str) or not relative_url:
        raise SupabaseStorageError(502, "Supabase Storage did not return a service signed URL.")
    return relative_url if relative_url.startswith("http") else f"{_base_url()}{relative_url}"



async def create_service_signed_download_urls(
    bucket: str,
    paths: list[str],
    expires_in: int = 900,
) -> dict[str, str]:
    """Create multiple short-lived service-role signed URLs in one Storage API call."""
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise SupabaseStorageError(500, "Supabase service role signing is not configured.")
    if not paths:
        return {}
    url = f"{_base_url()}/object/sign/{quote(bucket, safe='')}"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            url,
            json={"expiresIn": expires_in, "paths": paths},
            headers=headers,
        )
    if response.status_code >= 400:
        raise SupabaseStorageError(response.status_code, "Supabase Storage batch signing failed.")
    payload = response.json()
    if not isinstance(payload, list):
        raise SupabaseStorageError(502, "Supabase Storage did not return a batch signed URL list.")
    base = _base_url()
    result: dict[str, str] = {}
    for item in payload:
        if not isinstance(item, dict):
            continue
        path = item.get("path")
        signed = item.get("signedURL") or item.get("signedUrl")
        if isinstance(path, str) and isinstance(signed, str) and signed:
            result[path] = signed if signed.startswith("http") else f"{base}{signed}"
    return result
