from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.agent_runtime import AgentRuntimeError, create_command, execute_command, plan_command
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import rpc, select


router = APIRouter(prefix="/api/v1/agent-runtime", tags=["Agent Runtime & Command System"])


class CommandCreateRequest(BaseModel):
    agent_id: UUID
    command: str = Field(min_length=1, max_length=20000)
    capabilities: list[str] = Field(default_factory=list, max_length=32)
    idempotency_key: str | None = Field(default=None, max_length=255)


class KillSwitchRequest(BaseModel):
    enabled: bool
    reason: str | None = Field(default=None, max_length=1000)


class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(pattern="^(approved|rejected)$")
    reason: str | None = Field(default=None, max_length=2000)


def _error(exc: AgentRuntimeError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)})


@router.get("/commands")
async def list_commands(limit: int = Query(default=50, ge=1, le=200), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    return {"data": await select(user, "agent_commands", {
        "select": "id,agent_id,command_text,requested_capabilities,status,autonomy_level,risk_level,risk_decision,policy_version,correlation_id,error_code,error_message,result_summary,created_at,started_at,completed_at",
        "order": "created_at.desc",
        "limit": str(limit),
    })}


@router.get("/commands/{command_id}")
async def get_command(command_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    commands = await select(user, "agent_commands", {"select": "*", "id": f"eq.{command_id}", "limit": "1"})
    if not commands:
        raise HTTPException(status_code=404, detail={"code": "COMMAND_NOT_FOUND", "message": "Command was not found."})
    tasks = await select(user, "agent_tasks", {"select": "*", "command_id": f"eq.{command_id}", "order": "sequence_no.asc"})
    steps = await select(user, "agent_task_steps", {"select": "*", "command_id": f"eq.{command_id}", "order": "sequence_no.asc"})
    events = await select(user, "agent_runtime_events", {"select": "*", "command_id": f"eq.{command_id}", "order": "created_at.asc"})
    return {"data": {"command": commands[0], "tasks": tasks, "steps": steps, "events": events}}


@router.post("/commands", status_code=201)
async def create_runtime_command(payload: CommandCreateRequest, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    try:
        command = await create_command(context["user"], payload.agent_id, payload.command, payload.capabilities, payload.idempotency_key)
        return {"data": command}
    except AgentRuntimeError as exc:
        raise _error(exc) from exc


@router.post("/commands/{command_id}/plan")
async def plan_runtime_command(command_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    try:
        return {"data": await plan_command(context["user"], command_id)}
    except AgentRuntimeError as exc:
        raise _error(exc) from exc


@router.post("/commands/{command_id}/execute")
async def execute_runtime_command(command_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    try:
        return {"data": await execute_command(context["user"], command_id)}
    except AgentRuntimeError as exc:
        raise _error(exc) from exc


@router.post("/commands/{command_id}/approval")
async def decide_approval(command_id: UUID, payload: ApprovalDecisionRequest, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    try:
        result = await rpc(context["user"], "decide_agent_approval", {"p_command_id": str(command_id), "p_decision": payload.decision, "p_reason": payload.reason})
        return {"data": result}
    except Exception as exc:
        raise HTTPException(status_code=409, detail={"code": "AGENT_APPROVAL_DECISION_FAILED", "message": str(exc)}) from exc


@router.get("/agents/{agent_id}/kill-switch")
async def get_kill_switch(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    rows = await select(context["user"], "agent_kill_switches", {"select": "*", "agent_id": f"eq.{agent_id}", "limit": "1"})
    return {"data": rows[0] if rows else {"agent_id": str(agent_id), "enabled": False}}


@router.put("/agents/{agent_id}/kill-switch")
async def set_kill_switch(agent_id: UUID, payload: KillSwitchRequest, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    try:
        result = await rpc(context["user"], "set_agent_kill_switch", {"p_agent_id": str(agent_id), "p_enabled": payload.enabled, "p_reason": payload.reason})
        return {"data": result}
    except Exception as exc:
        raise HTTPException(status_code=409, detail={"code": "KILL_SWITCH_UPDATE_FAILED", "message": str(exc)}) from exc
