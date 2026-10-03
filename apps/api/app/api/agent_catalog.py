from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import rpc, select


router = APIRouter(prefix="/api/v1/agent-catalog", tags=["Agent Catalog"])


@router.get("")
async def get_agent_catalog(
    category: str | None = Query(default=None, max_length=80),
    context: dict[str, Any] = Depends(get_auth_context),
) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    skill_filters = {"select": "id,skill_key,name,description,category,risk_level,capability_keys,tool_domains,source_reference,metadata,sort_order", "enabled": "eq.true", "order": "sort_order.asc"}
    type_filters = {"select": "id,type_key,name,description,category,default_skill_keys,recommended_capability_keys,default_autonomy_level,risk_profile,source_reference,metadata,sort_order", "enabled": "eq.true", "order": "sort_order.asc"}
    character_filters = {"select": "id,character_key,name,archetype,description,interaction_style,persona_defaults,tone_defaults,visual_profile,source_reference,metadata,sort_order", "enabled": "eq.true", "order": "sort_order.asc"}
    if category:
        skill_filters["category"] = f"eq.{category}"
        type_filters["category"] = f"eq.{category}"
    skills = await select(user, "agent_skill_catalog", skill_filters)
    types = await select(user, "agent_type_catalog", type_filters)
    characters = await select(user, "agent_character_catalog", character_filters)
    return {"data": {"skills": skills, "types": types, "characters": characters}}


@router.get("/skills")
async def list_agent_skills(
    category: str | None = Query(default=None, max_length=80),
    context: dict[str, Any] = Depends(get_auth_context),
) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    params = {"select": "id,skill_key,name,description,category,risk_level,capability_keys,tool_domains,source_reference,metadata,sort_order", "enabled": "eq.true", "order": "sort_order.asc"}
    if category:
        params["category"] = f"eq.{category}"
    return {"data": await select(user, "agent_skill_catalog", params)}


@router.get("/types")
async def list_agent_types(
    category: str | None = Query(default=None, max_length=80),
    context: dict[str, Any] = Depends(get_auth_context),
) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    params = {"select": "id,type_key,name,description,category,default_skill_keys,recommended_capability_keys,default_autonomy_level,risk_profile,source_reference,metadata,sort_order", "enabled": "eq.true", "order": "sort_order.asc"}
    if category:
        params["category"] = f"eq.{category}"
    return {"data": await select(user, "agent_type_catalog", params)}


@router.get("/characters")
async def list_agent_characters(
    archetype: str | None = Query(default=None, max_length=80),
    context: dict[str, Any] = Depends(get_auth_context),
) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    params = {"select": "id,character_key,name,archetype,description,interaction_style,persona_defaults,tone_defaults,visual_profile,source_reference,metadata,sort_order", "enabled": "eq.true", "order": "sort_order.asc"}
    if archetype:
        params["archetype"] = f"eq.{archetype}"
    return {"data": await select(user, "agent_character_catalog", params)}

@router.get("/accounts")
async def discover_agent_accounts(
    query: str | None = Query(default=None, max_length=160),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    district_id: UUID | None = Query(default=None),
    booth_id: UUID | None = Query(default=None),
    live_session_id: UUID | None = Query(default=None),
    content_id: UUID | None = Query(default=None),
    context: dict[str, Any] = Depends(get_auth_context),
) -> dict[str, Any]:
    """Canonical Agent Account discovery with optional existing-surface context resolution."""
    user: AuthenticatedUser = context["user"]
    context_ids: list[str] = []
    context_source: str | None = None

    if sum(x is not None for x in (district_id, booth_id, live_session_id, content_id)) > 1:
        raise HTTPException(status_code=422, detail={"code": "AGENT_DISCOVERY_CONTEXT_AMBIGUOUS", "message": "Only one discovery context may be supplied."})

    if booth_id:
        rows = await select(user, "booths", {"select": "agent_id,host_agent_id", "id": f"eq.{booth_id}", "status": "in.(published,active)", "limit": "1"})
        if rows:
            context_ids = [str(x) for x in (rows[0].get("agent_id"), rows[0].get("host_agent_id")) if x]
            context_source = "booth"
    elif live_session_id:
        rows = await select(user, "live_sessions", {"select": "host_agent_id", "id": f"eq.{live_session_id}", "visibility": "eq.public", "limit": "1"})
        if rows and rows[0].get("host_agent_id"):
            context_ids = [str(rows[0]["host_agent_id"])]
            context_source = "live"
    elif content_id:
        rows = await select(user, "content_items", {"select": "owner_type,owner_id", "id": f"eq.{content_id}", "status": "eq.published", "visibility": "in.(public,unlisted)", "limit": "1"})
        if rows and rows[0].get("owner_type") == "agent" and rows[0].get("owner_id"):
            context_ids = [str(rows[0]["owner_id"])]
            context_source = "content"
    elif district_id:
        districts = await select(user, "districts", {"select": "world_id,status", "id": f"eq.{district_id}", "status": "neq.archived", "limit": "1"})
        if districts:
            zones = await select(user, "district_zones", {"select": "zone_key,status", "district_id": f"eq.{district_id}", "status": "eq.active"})
            zone_keys = [str(z["zone_key"]) for z in zones if z.get("zone_key")]
            if zone_keys:
                states = await select(user, "agent_spatial_states", {
                    "select": "agent_id",
                    "world_id": f"eq.{districts[0]['world_id']}",
                    "zone_key": f"in.({','.join(zone_keys)})",
                    "limit": str(min(limit, 100)),
                })
                context_ids = list(dict.fromkeys(str(s["agent_id"]) for s in states if s.get("agent_id")))
                context_source = "district"

    if context_ids:
        profiles = []
        for agent_id in context_ids[:limit]:
            try:
                profile = await rpc(user, "get_public_agent_account", {"p_agent_id": agent_id})
                if profile:
                    profiles.append(profile)
            except SupabaseRestError:
                continue
        return {"data": profiles, "context": {"source": context_source, "resolved_agent_count": len(profiles)}}

    return {
        "data": await rpc(user, "discover_public_agent_accounts", {"p_query": query, "p_limit": limit, "p_offset": offset}),
        "context": {"source": "global_discovery", "resolved_agent_count": None},
        "contract": {
            "identity": "agent",
            "interaction": "existing_messaging_or_agent_service",
            "authority": "existing_agent_passport_policy_consent_risk_approval_runtime",
        },
    }


@router.get("/accounts/{agent_id}")
async def get_agent_account(agent_id: str, context: dict[str, Any] = Depends(get_auth_context)) -> dict[str, Any]:
    """Canonical public Agent Account read model; owner private identifiers are never exposed."""
    user: AuthenticatedUser = context["user"]
    try:
        data = await rpc(user, "get_public_agent_account", {"p_agent_id": agent_id})
    except Exception as exc:
        raise HTTPException(status_code=502, detail={"code": "AGENT_ACCOUNT_LOAD_FAILED", "message": str(exc)}) from exc
    if not data:
        raise HTTPException(status_code=404, detail={"code": "AGENT_ACCOUNT_NOT_FOUND", "message": "Public Agent Account was not found."})
    return {"data": data}

