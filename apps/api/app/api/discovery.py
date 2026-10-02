from typing import Any, Literal

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, rpc, select
from app.services.content_gravity import apply_content_gravity

router = APIRouter(prefix="/api/v1/discovery", tags=["Allpha Universe Discovery"])

Surface = Literal["home", "following", "for_you", "moments", "worlds", "live"]


def _error(exc: SupabaseRestError) -> dict[str, Any]:
    return {"code": "DISCOVERY_SOURCE_FAILED", "message": exc.message, "status_code": exc.status_code}


def _feed_items(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, dict) and isinstance(value.get("data"), list):
        return [item for item in value["data"] if isinstance(item, dict)]
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    return []


@router.get("/home")
async def discovery_home(
    surface: Surface = Query(default="home"),
    limit: int = Query(default=12, ge=1, le=30),
    query: str | None = Query(default=None, max_length=160),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    """Compose Feed, Content Gravity, Universe and Live without creating duplicate engines."""
    user = context["user"]
    feed_surface = {
        "home": "home",
        "following": "following",
        "for_you": "for_you",
        "moments": "reels",
        "worlds": "world",
        "live": "live_now",
    }[surface]

    result: dict[str, Any] = {
        "surface": surface,
        "content": [],
        "worlds": [],
        "live": [],
        "navigation": {
            "feed": "/feed",
            "reels": "/reels",
            "universe": "/universe",
            "worlds": "/worlds",
            "live": "/live",
        },
        "sources": {
            "feed_engine": "existing:get_feed",
            "content_gravity": "existing:feed+personalization+content_topics+world_context",
            "universe_engine": "existing:universe_worlds",
            "live_engine": "existing:live_sessions",
        },
    }

    try:
        feed_result = await rpc(user, "get_feed", {
            "p_surface": feed_surface,
            "p_limit": limit,
            "p_offset": 0,
            "p_query": query,
        })
        items = _feed_items(feed_result)
        gravity_items = await apply_content_gravity(user, items, surface=surface)
        if isinstance(feed_result, dict):
            result["content"] = {
                **feed_result,
                "data": gravity_items,
            }
        else:
            result["content"] = gravity_items
    except SupabaseRestError as exc:
        result["content_error"] = _error(exc)

    if surface in {"home", "worlds"}:
        try:
            result["worlds"] = await select(user, "universe_worlds", {
                "select": "id,galaxy_id,name,slug,description,status,visibility,world_type,theme_key,updated_at",
                "status": "eq.published",
                "visibility": "eq.public",
                "order": "updated_at.desc",
                "limit": str(min(limit, 20)),
            })
        except SupabaseRestError as exc:
            result["worlds_error"] = _error(exc)

    if surface in {"home", "live"}:
        try:
            result["live"] = await select(user, "live_sessions", {
                "select": "id,host_user_id,experience_template_id,experience_template_version_id,source_type,title,status,visibility,scheduled_at,district_id,booth_id,metadata,created_at,updated_at",
                "status": "eq.live",
                "visibility": "eq.public",
                "order": "updated_at.desc",
                "limit": str(min(limit, 20)),
            })
        except SupabaseRestError as exc:
            result["live_error"] = _error(exc)

    return result
