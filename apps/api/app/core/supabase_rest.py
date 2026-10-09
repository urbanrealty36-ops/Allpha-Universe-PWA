from typing import Any
from urllib.parse import quote

import httpx

from app.core.auth import AuthenticatedUser
from app.core.config import get_settings


class SupabaseRestError(RuntimeError):
    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def _headers(user: AuthenticatedUser, *, prefer: str | None = None) -> dict[str, str]:
    settings = get_settings()
    headers = {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {user.access_token}",
        "Accept": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _url(table: str) -> str:
    settings = get_settings()
    return f"{settings.supabase_url.rstrip('/')}/rest/v1/{quote(table, safe='._-')}"


async def select(
    user: AuthenticatedUser,
    table: str,
    query: dict[str, str],
) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(_url(table), params=list(query.items()), headers=_headers(user))

    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase data request failed.")
    data = response.json()
    return data if isinstance(data, list) else []


async def insert(
    user: AuthenticatedUser,
    table: str,
    payload: dict[str, Any],
    *,
    returning: bool = True,
) -> list[dict[str, Any]]:
    prefer = "return=representation" if returning else "return=minimal"
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(_url(table), json=payload, headers=_headers(user, prefer=prefer))

    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase insert failed.")
    data = response.json() if returning and response.content else []
    return data if isinstance(data, list) else []


async def update(
    user: AuthenticatedUser,
    table: str,
    filters: dict[str, str],
    payload: dict[str, Any],
    *,
    returning: bool = True,
) -> list[dict[str, Any]]:
    prefer = "return=representation" if returning else "return=minimal"
    params = list(filters.items())
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.patch(_url(table), params=params, json=payload, headers=_headers(user, prefer=prefer))

    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase update failed.")
    data = response.json() if returning and response.content else []
    return data if isinstance(data, list) else []


async def delete(
    user: AuthenticatedUser,
    table: str,
    filters: dict[str, str],
) -> None:
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.delete(_url(table), params=list(filters.items()), headers=_headers(user, prefer="return=minimal"))

    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase delete failed.")


async def rpc(
    user: AuthenticatedUser,
    function: str,
    payload: dict[str, Any],
) -> Any:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/rpc/{quote(function, safe='._-')}"
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(url, json=payload, headers=_headers(user))

    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase RPC failed.")
    return response.json()


async def service_select(table: str, query: dict[str, str]) -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for server-side service operations.")
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(_url(table), params=list(query.items()), headers=headers)
    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase service data request failed.")
    data = response.json()
    return data if isinstance(data, list) else []


async def service_insert(table: str, payload: dict[str, Any], *, returning: bool = True) -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for server-side service operations.")
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Accept": "application/json",
        "Prefer": "return=representation" if returning else "return=minimal",
    }
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(_url(table), json=payload, headers=headers)
    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase service insert failed.")
    data = response.json() if returning and response.content else []
    return data if isinstance(data, list) else []


async def service_update(table: str, filters: dict[str, str], payload: dict[str, Any]) -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for server-side service operations.")
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Accept": "application/json",
        "Prefer": "return=representation",
    }
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.patch(_url(table), params=list(filters.items()), json=payload, headers=headers)
    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase service update failed.")
    data = response.json() if response.content else []
    return data if isinstance(data, list) else []


async def service_rpc(function: str, payload: dict[str, Any]) -> Any:
    settings = get_settings()
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for server-side service operations.")
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/rpc/{quote(function, safe='._-')}"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(url, json=payload, headers=headers)
    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase service RPC failed.")
    return response.json()
