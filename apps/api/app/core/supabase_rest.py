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


async def select(
    user: AuthenticatedUser,
    table: str,
    query: dict[str, str],
) -> list[dict[str, Any]]:
    settings = get_settings()
    params = [(key, value) for key, value in query.items()]
    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/{quote(table, safe='._-')}"
    headers = {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {user.claims.get('_raw_token', '')}",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(url, params=params, headers=headers)

    if response.status_code >= 400:
        raise SupabaseRestError(response.status_code, "Supabase data request failed.")
    data = response.json()
    return data if isinstance(data, list) else []
