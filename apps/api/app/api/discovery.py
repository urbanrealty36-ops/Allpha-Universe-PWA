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
        "communities": [],
        "live": [],
        "agents": [],
        "navigation": {
            "feed": "/feed",
            "reels": "/reels",
            "universe": "/universe",
            "worlds": "/worlds",
            "communities": "/communities",
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

    if surface in {"home", "worlds"}:
        try:
            result["communities"] = await select(user, "communities", {
                "select": "id,name,handle,description,visibility,status,join_policy,updated_at",
                "status": "eq.active",
                "order": "updated_at.desc",
                "limit": str(min(limit, 20)),
            })
        except SupabaseRestError as exc:
            result["communities_error"] = _error(exc)

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


@router.get("/moments")
async def discovery_moments(
    limit: int = Query(default=18, ge=1, le=30),
    query: str | None = Query(default=None, max_length=160),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    """Universe Stream / Moments presentation contract over existing Feed + Gravity + Universe + Presence + Live sources."""
    user = context["user"]
    result: dict[str, Any] = {
        "surface": "moments",
        "content": [],
        "worlds": [],
        "agents": [],
        "presence": [],
        "live": [],
        "communities": [],
        "navigation": {
            "universe": "/universe",
            "moments": "/moments",
            "content": "/content",
            "world": "/world",
            "agent": "/agents",
            "live": "/live",
        },
        "sources": {
            "feed_engine": "existing:get_feed",
            "content_gravity": "existing:feed+personalization+content_topics+world_context",
            "world_content": "existing:universe_world_content",
            "agent_presence": "existing:universe_agent_presences",
            "live_engine": "existing:live_sessions",
        },
    }

    try:
        feed_result = await rpc(user, "get_feed", {
            "p_surface": "reels",
            "p_limit": limit,
            "p_offset": 0,
            "p_query": query,
        })
        items = _feed_items(feed_result)
        gravity_items = await apply_content_gravity(user, items, surface="moments")
        result["content"] = gravity_items
    except SupabaseRestError as exc:
        result["content_error"] = _error(exc)
        return result

    content_ids = [str(item["id"]) for item in result["content"] if item.get("id")]
    if not content_ids:
        return result

    ids_filter = f"in.({','.join(content_ids)})"

    try:
        links = await select(user, "universe_world_content", {
            "select": "content_id,world_id,placement,sort_order",
            "content_id": ids_filter,
            "order": "sort_order.asc",
        })
        world_ids = list(dict.fromkeys(str(row["world_id"]) for row in links if row.get("world_id")))
        if world_ids:
            worlds = await select(user, "universe_worlds", {
                "select": "id,name,slug,description,world_type,theme_key,status,visibility",
                "id": f"in.({','.join(world_ids)})",
                "status": "eq.published",
                "visibility": "eq.public",
            })
        else:
            worlds = []
        world_by_id = {str(row["id"]): row for row in worlds}
        content_worlds: dict[str, list[dict[str, Any]]] = {}
        for row in links:
            world = world_by_id.get(str(row.get("world_id")))
            if world:
                content_worlds.setdefault(str(row["content_id"]), []).append({
                    "id": world["id"],
                    "name": world["name"],
                    "slug": world["slug"],
                    "world_type": world.get("world_type"),
                    "placement": row.get("placement"),
                })
        result["worlds"] = worlds
        result["content_worlds"] = content_worlds

        if world_ids:
            presences = await select(user, "universe_agent_presences", {
                "select": "id,world_id,agent_id,state,activity,context,entered_at,last_seen_at,exited_at",
                "world_id": f"in.({','.join(world_ids)})",
                "exited_at": "is.null",
                "state": "neq.sleeping",
                "order": "last_seen_at.desc",
                "limit": str(min(limit * 2, 60)),
            })
        else:
            presences = []
        result["presence"] = presences

        agent_ids = list(dict.fromkeys(str(row["agent_id"]) for row in presences if row.get("agent_id")))
        owner_agent_ids = [
            str(item["owner_id"])
            for item in result["content"]
            if item.get("owner_type") == "agent" and item.get("owner_id")
        ]
        agent_ids = list(dict.fromkeys(agent_ids + owner_agent_ids))
        agents: list[dict[str, Any]] = []
        for agent_id in agent_ids[:limit]:
            try:
                profile = await rpc(user, "get_public_agent_account", {"p_agent_id": agent_id})
                if profile:
                    agents.append(profile)
            except SupabaseRestError:
                continue
        result["agents"] = agents
    except SupabaseRestError as exc:
        result["context_error"] = _error(exc)

    try:
        result["live"] = await select(user, "live_sessions", {
            "select": "id,host_user_id,host_agent_id,experience_template_id,experience_template_version_id,source_type,title,status,visibility,scheduled_at,district_id,booth_id,metadata,started_at,created_at,updated_at",
            "status": "eq.live",
            "visibility": "eq.public",
            "order": "updated_at.desc",
            "limit": str(min(limit, 20)),
        })
    except SupabaseRestError as exc:
        result["live_error"] = _error(exc)

    try:
        result["communities"] = await select(user, "communities", {
            "select": "id,name,handle,description,visibility,status,join_policy,updated_at",
            "status": "eq.active",
            "order": "updated_at.desc",
            "limit": str(min(6, limit)),
        })
    except SupabaseRestError as exc:
        result["communities_error"] = _error(exc)

    return result
