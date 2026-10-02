from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import select


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
