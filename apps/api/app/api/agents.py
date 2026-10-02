from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser, require_auth
from app.core.agent_runtime import AgentRuntimeError, create_command, execute_command, plan_command
from app.core.supabase_rest import SupabaseRestError, insert, rpc, select, update


router = APIRouter(prefix="/api/v1/agents", tags=["Agents"])


class AgentCommandRequest(BaseModel):
    command: str
    requested_capabilities: list[str] = Field(default_factory=list, max_length=16)
    idempotency_key: str | None = Field(default=None, max_length=200)


class AgentFactoryContext(BaseModel):
    scope: str = Field(default="universe", pattern=r"^(universe|world|district|zone|booth|live|feed|content|personal|private)$")
    resource_id: UUID | None = None


class AgentCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    handle: str | None = Field(default=None, min_length=3, max_length=64)
    description: str | None = None
    organization_id: UUID | None = None
    visibility: str = "public"
    persona: dict[str, Any] = Field(default_factory=dict)
    tone: dict[str, Any] = Field(default_factory=dict)
    interests: list[Any] = Field(default_factory=list)
    goals: list[Any] = Field(default_factory=list)
    boundaries: dict[str, Any] = Field(default_factory=dict)
    autonomy_level: str = "recommend"
    budget_currency: str = Field(default="USD", min_length=3, max_length=3)
    max_spend_per_action: float | None = Field(default=None, ge=0)
    daily_spend_limit: float | None = Field(default=None, ge=0)
    monthly_spend_limit: float | None = Field(default=None, ge=0)
    requires_approval_above: float | None = Field(default=None, ge=0)
    agent_type_key: str | None = Field(default=None, min_length=1, max_length=120)
    character_key: str | None = Field(default=None, min_length=1, max_length=120)
    skill_keys: list[str] = Field(default_factory=list, max_length=32)
    universe_context: AgentFactoryContext = Field(default_factory=AgentFactoryContext)
    experience_mode: str = Field(default="social", pattern=r"^(social|networking|communication|commerce|education|news|live|event|presentation|collaboration|personal|private|creator)$")


class AgentUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    handle: str | None = Field(default=None, min_length=3, max_length=64)
    description: str | None = None
    avatar_path: str | None = None
    visibility: str | None = None
    status: str | None = None


class PersonaUpdateRequest(BaseModel):
    persona: dict[str, Any] = Field(default_factory=dict)
    tone: dict[str, Any] = Field(default_factory=dict)
    interests: list[Any] = Field(default_factory=list)
    goals: list[Any] = Field(default_factory=list)
    boundaries: dict[str, Any] = Field(default_factory=dict)


class PolicyUpdateRequest(BaseModel):
    name: str | None = None
    rules: dict[str, Any] = Field(default_factory=dict)
    autonomy_level: str = "recommend"
    spending_limit: float | None = Field(default=None, ge=0)
    rate_limit: dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True


class BudgetUpdateRequest(BaseModel):
    currency: str = Field(min_length=3, max_length=3)
    max_spend_per_action: float | None = Field(default=None, ge=0)
    daily_spend_limit: float | None = Field(default=None, ge=0)
    monthly_spend_limit: float | None = Field(default=None, ge=0)
    requires_approval_above: float | None = Field(default=None, ge=0)
    enabled: bool = True


class CredentialCreateRequest(BaseModel):
    credential_type: str = Field(min_length=1, max_length=120)
    issuer: str = Field(min_length=1, max_length=240)
    subject: str | None = None
    issued_at: str | None = None
    expires_at: str | None = None
    claims: dict[str, Any] = Field(default_factory=dict)


def _agent_filter(agent_id: UUID) -> dict[str, str]:
    return {"id": f"eq.{agent_id}", "limit": "1"}


async def _owned_agent(user: AuthenticatedUser, agent_id: UUID) -> dict[str, Any]:
    rows = await select(user, "agents", {
        "select": "id,owner_user_id,organization_id,name,handle,status,runtime_state,description,avatar_path,visibility,authority_policy_version,created_at,updated_at",
        "id": f"eq.{agent_id}",
        "limit": "1",
    })
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "AGENT_NOT_FOUND", "message": "Agent was not found or is not owned by the authenticated user."})
    return rows[0]


async def _agent_bundle(user: AuthenticatedUser, agent_id: UUID, context: dict) -> dict[str, Any]:
    agent = await _owned_agent(user, agent_id)
    identity = await select(user, "agent_identities", {"select": "*", "agent_id": f"eq.{agent_id}", "limit": "1"})
    persona = await select(user, "agent_personas", {"select": "*", "agent_id": f"eq.{agent_id}", "limit": "1"})
    passport = await select(user, "agent_passports", {"select": "*", "agent_id": f"eq.{agent_id}", "limit": "1"})
    policies = await select(user, "agent_policies", {"select": "*", "agent_id": f"eq.{agent_id}", "order": "policy_version.desc", "limit": "1"})
    budget = await select(user, "agent_budgets", {"select": "*", "agent_id": f"eq.{agent_id}", "limit": "1"})
    return {"agent": agent, "identity": identity[0] if identity else None, "persona": persona[0] if persona else None, "passport": passport[0] if passport else None, "policy": policies[0] if policies else None, "budget": budget[0] if budget else None}


@router.get("")
async def list_my_agents_root(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    return await list_my_agents(context)


@router.get("/me")
async def list_my_agents(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    return {"data": await select(user, "agents", {"select": "id,name,handle,status,runtime_state,description,avatar_path,visibility,created_at,updated_at", "owner_user_id": f"eq.{user.user_id}", "order": "created_at.desc"})}


@router.post("", status_code=201)
async def create_agent(payload: AgentCreateRequest, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]

    type_rows = await select(user, "agent_type_catalog", {
        "select": "type_key,default_skill_keys",
        "type_key": f"eq.{payload.agent_type_key}",
        "enabled": "eq.true",
        "limit": "1",
    }) if payload.agent_type_key else []
    if payload.agent_type_key and not type_rows:
        raise HTTPException(status_code=422, detail={"code": "AGENT_TYPE_INVALID", "message": "The selected Agent Type is not available."})

    character_rows = await select(user, "agent_character_catalog", {
        "select": "character_key,persona_defaults,tone_defaults",
        "character_key": f"eq.{payload.character_key}",
        "enabled": "eq.true",
        "limit": "1",
    }) if payload.character_key else []
    if payload.character_key and not character_rows:
        raise HTTPException(status_code=422, detail={"code": "AGENT_CHARACTER_INVALID", "message": "The selected AI Character is not available."})

    context_tables = {
        "world": "universe_worlds",
        "district": "districts",
        "zone": "district_zones",
        "booth": "booths",
        "live": "live_sessions",
        "content": "content_items",
    }
    factory_context = payload.universe_context.model_dump(mode="json")
    scope = factory_context["scope"]
    resource_id = factory_context.get("resource_id")
    if scope in context_tables and not resource_id:
        raise HTTPException(status_code=422, detail={"code": "AGENT_CONTEXT_RESOURCE_REQUIRED", "message": f"A resource_id is required for {scope} context."})
    if scope in context_tables and resource_id:
        rows = await select(user, context_tables[scope], {"select": "id", "id": f"eq.{resource_id}", "limit": "1"})
        if not rows:
            raise HTTPException(status_code=422, detail={"code": "AGENT_CONTEXT_RESOURCE_INVALID", "message": "The selected Universe context resource is unavailable to this user."})

    factory_config = {
        "agent_type_key": payload.agent_type_key,
        "character_key": payload.character_key,
        "experience_mode": payload.experience_mode,
        "universe_context": factory_context,
    }
    character = character_rows[0] if character_rows else None
    effective_persona = dict(character.get("persona_defaults") or {}) if character else {}
    effective_persona.update(payload.persona)
    effective_tone = dict(character.get("tone_defaults") or {}) if character else {}
    effective_tone.update(payload.tone)

    selected_skills = list(dict.fromkeys(payload.skill_keys))
    if type_rows:
        selected_skills = list(dict.fromkeys(selected_skills + list(type_rows[0].get("default_skill_keys") or [])))

    skill_rows = []
    if selected_skills:
        skill_rows = await select(user, "agent_skill_catalog", {
            "select": "skill_key,name,description",
            "skill_key": f"in.({','.join(selected_skills)})",
            "enabled": "eq.true",
        })
        available_skill_keys = {skill["skill_key"] for skill in skill_rows}
        missing_skill_keys = [key for key in selected_skills if key not in available_skill_keys]
        if missing_skill_keys:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "AGENT_SKILL_INVALID",
                    "message": "One or more selected Agent Skills are not available.",
                    "skill_keys": missing_skill_keys,
                },
            )

    try:
        result = await rpc(user, "create_agent_identity", {
            "p_name": payload.name, "p_handle": payload.handle, "p_description": payload.description,
            "p_organization_id": str(payload.organization_id) if payload.organization_id else None,
            "p_visibility": payload.visibility, "p_persona": effective_persona, "p_tone": effective_tone,
            "p_interests": payload.interests, "p_goals": payload.goals, "p_boundaries": payload.boundaries,
            "p_autonomy_level": payload.autonomy_level, "p_budget_currency": payload.budget_currency.upper(),
            "p_max_spend_per_action": payload.max_spend_per_action, "p_daily_spend_limit": payload.daily_spend_limit,
            "p_monthly_spend_limit": payload.monthly_spend_limit, "p_requires_approval_above": payload.requires_approval_above,
            "p_factory_config": factory_config,
        })
    except SupabaseRestError as exc:
        raise HTTPException(status_code=exc.status_code if 400 <= exc.status_code < 500 else 502, detail={"code": "AGENT_CREATE_FAILED", "message": exc.message}) from exc
    agent_id = UUID(result["agent_id"])

    for skill in skill_rows:
        await insert(user, "agent_skills", {
            "agent_id": str(agent_id),
            "name": skill["name"],
            "description": skill.get("description"),
            "version": "1.0.0",
            "configuration": {
                "catalog_key": skill["skill_key"],
                "source": "platform_catalog",
            },
        })

    return await _agent_bundle(user, agent_id, context)


@router.get("/{agent_id}")
async def get_agent(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    return await _agent_bundle(context["user"], agent_id, context)


@router.patch("/{agent_id}")
async def update_agent(agent_id: UUID, payload: AgentUpdateRequest, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    await _owned_agent(user, agent_id)
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail={"code": "AGENT_UPDATE_EMPTY", "message": "At least one field is required."})
    rows = await update(user, "agents", _agent_filter(agent_id), values)
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "AGENT_NOT_FOUND", "message": "Agent was not found."})
    return await _agent_bundle(user, agent_id, context)


@router.get("/{agent_id}/persona")
async def get_persona(agent_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    rows = await select(user, "agent_personas", {"select": "*", "agent_id": f"eq.{agent_id}", "limit": "1"})
    return rows[0] if rows else None


@router.put("/{agent_id}/persona")
async def put_persona(agent_id: UUID, payload: PersonaUpdateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    values = payload.model_dump()
    rows = await update(user, "agent_personas", {"agent_id": f"eq.{agent_id}"}, values)
    if not rows:
        rows = await insert(user, "agent_personas", {"agent_id": str(agent_id), **values})
    return rows[0] if rows else None


@router.get("/{agent_id}/passport")
async def get_passport(agent_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    rows = await select(user, "agent_passports", {"select": "*", "agent_id": f"eq.{agent_id}", "limit": "1"})
    return rows[0] if rows else None


@router.get("/{agent_id}/policy")
async def get_policy(agent_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    rows = await select(user, "agent_policies", {"select": "*", "agent_id": f"eq.{agent_id}", "order": "policy_version.desc", "limit": "1"})
    return rows[0] if rows else None


@router.put("/{agent_id}/policy")
async def put_policy(agent_id: UUID, payload: PolicyUpdateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    current = await get_policy(agent_id, context)
    values = payload.model_dump()
    if current:
        values["policy_version"] = int(current["policy_version"]) + 1
        rows = await update(user, "agent_policies", {"id": f"eq.{current['id']}"}, values)
    else:
        values.update({"agent_id": str(agent_id), "policy_version": 1})
        rows = await insert(user, "agent_policies", values)
    return rows[0] if rows else None


@router.get("/{agent_id}/budget")
async def get_budget(agent_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    rows = await select(user, "agent_budgets", {"select": "*", "agent_id": f"eq.{agent_id}", "limit": "1"})
    return rows[0] if rows else None


@router.put("/{agent_id}/budget")
async def put_budget(agent_id: UUID, payload: BudgetUpdateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    values = payload.model_dump(); values["currency"] = values["currency"].upper()
    rows = await update(user, "agent_budgets", {"agent_id": f"eq.{agent_id}"}, values)
    if not rows:
        rows = await insert(user, "agent_budgets", {"agent_id": str(agent_id), **values})
    return rows[0] if rows else None


@router.get("/{agent_id}/credentials")
async def list_credentials(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    return {"data": await select(user, "agent_credentials", {"select": "id,credential_type,issuer,subject,status,issued_at,expires_at,claims,created_at,updated_at", "agent_id": f"eq.{agent_id}", "order": "created_at.desc"})}


@router.post("/{agent_id}/credentials", status_code=201)
async def create_credential(agent_id: UUID, payload: CredentialCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    values = payload.model_dump(); values.update({"agent_id": str(agent_id), "status": "pending"})
    return (await insert(user, "agent_credentials", values))[0]


@router.get("/{agent_id}/reputation")
async def get_reputation(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]; await _owned_agent(user, agent_id)
    return {"data": await select(user, "agent_reputation_events", {"select": "id,event_type,score_delta,source_type,source_id,metadata,occurred_at,created_at", "agent_id": f"eq.{agent_id}", "order": "occurred_at.desc"})}



class SkillCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    version: str = "1.0.0"
    configuration: dict[str, Any] = Field(default_factory=dict)


class CapabilityCreateRequest(BaseModel):
    capability: str = Field(min_length=1, max_length=160)
    constraints: dict[str, Any] = Field(default_factory=dict)


class PermissionCreateRequest(BaseModel):
    resource: str = Field(min_length=1, max_length=160)
    action: str = Field(min_length=1, max_length=160)
    effect: str = "allow"
    scope: dict[str, Any] = Field(default_factory=dict)
    valid_from: str | None = None
    valid_until: str | None = None


@router.get("/{agent_id}/identity")
async def get_ai_identity(agent_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]
    await _owned_agent(user, agent_id)
    rows = await select(user, "agent_identities", {"select": "*", "agent_id": f"eq.{agent_id}", "limit": "1"})
    return rows[0] if rows else None


@router.post("/{agent_id}/verification/request")
async def request_verification(agent_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]
    await _owned_agent(user, agent_id)
    identity = await update(user, "agent_identities", {"agent_id": f"eq.{agent_id}"}, {
        "verification_status": "pending",
        "verification_method": "owner_requested",
    })
    passport = await update(user, "agent_passports", {"agent_id": f"eq.{agent_id}"}, {
        "verification_status": "pending",
    })
    return {"identity": identity[0] if identity else None, "passport": passport[0] if passport else None}


@router.get("/{agent_id}/skills")
async def list_skills(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    await _owned_agent(user, agent_id)
    return {"data": await select(user, "agent_skills", {"select": "*", "agent_id": f"eq.{agent_id}", "order": "created_at.desc"})}


@router.post("/{agent_id}/skills", status_code=201)
async def add_skill(agent_id: UUID, payload: SkillCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]
    await _owned_agent(user, agent_id)
    return (await insert(user, "agent_skills", {"agent_id": str(agent_id), **payload.model_dump()}))[0]


@router.get("/{agent_id}/capabilities")
async def list_capabilities(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    await _owned_agent(user, agent_id)
    return {"data": await select(user, "agent_capabilities", {"select": "id,capability,enabled,constraints,created_at,updated_at", "agent_id": f"eq.{agent_id}", "order": "created_at.desc"})}


@router.post("/{agent_id}/capabilities", status_code=201)
async def add_capability(agent_id: UUID, payload: CapabilityCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]
    await _owned_agent(user, agent_id)
    return (await insert(user, "agent_capabilities", {"agent_id": str(agent_id), "granted_by_user_id": str(user.user_id), **payload.model_dump()}))[0]


@router.get("/{agent_id}/permissions")
async def list_permissions(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    await _owned_agent(user, agent_id)
    return {"data": await select(user, "agent_permissions", {"select": "*", "agent_id": f"eq.{agent_id}", "order": "created_at.desc"})}


@router.post("/{agent_id}/permissions", status_code=201)
async def add_permission(agent_id: UUID, payload: PermissionCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user: AuthenticatedUser = context["user"]
    await _owned_agent(user, agent_id)
    if payload.effect not in {"allow", "deny"}:
        raise HTTPException(status_code=422, detail={"code": "INVALID_PERMISSION_EFFECT", "message": "Permission effect must be allow or deny."})
    return (await insert(user, "agent_permissions", {"agent_id": str(agent_id), **payload.model_dump()}))[0]


@router.post("/{agent_id}/command", status_code=201)
async def command_agent(agent_id: UUID, payload: AgentCommandRequest, user: AuthenticatedUser = Depends(require_auth)) -> dict[str, Any]:
    if not payload.command.strip():
        raise HTTPException(status_code=422, detail={"code": "AGENT_COMMAND_EMPTY", "message": "Agent command must not be empty."})
    await _owned_agent(user, agent_id)
    try:
        command = await create_command(user, agent_id, payload.command.strip(), payload.requested_capabilities, payload.idempotency_key)
        command_id = UUID(command["command_id"] if "command_id" in command else command["id"])
        planned = await plan_command(user, command_id)
        execution = await execute_command(user, command_id)
        return {"data": {"command": command, "plan": planned, "execution": execution}, "runtime": {"agent_id": str(agent_id), "command_id": str(command_id), "status": execution.get("status") or planned.get("status") or command.get("status"), "ai_gateway": "delegated", "telemetry": "agent_commands + agent_task_steps + ai_gateway_requests/attempts"}}
    except AgentRuntimeError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc), "agent_id": str(agent_id)}) from exc
