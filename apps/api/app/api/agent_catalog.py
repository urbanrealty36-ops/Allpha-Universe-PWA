from typing import Any

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
    context: dict[str, Any] = Depends(get_auth_context),
) -> dict[str, Any]:
    """Canonical public Agent Account discovery. Uses existing Agent/Skill/Reputation primitives."""
    user: AuthenticatedUser = context["user"]
    return {
        "data": await rpc(
            user,
            "discover_public_agent_accounts",
            {"p_query": query, "p_limit": limit, "p_offset": offset},
        ),
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

