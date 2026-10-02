import json
import time
from typing import Any
from uuid import UUID

from app.core.ai_gateway import AIGatewayError, GatewayMessage, generate
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, rpc, select


class AgentRuntimeError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int = 409) -> None:
        self.code = code
        self.status_code = status_code
        super().__init__(message)


def _parse_plan(text: str) -> dict[str, Any]:
    raw = text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:].lstrip()
    try:
        plan = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise AgentRuntimeError("AGENT_PLAN_INVALID_JSON", "AI planner returned invalid JSON.", 502) from exc
    if not isinstance(plan, dict) or not isinstance(plan.get("tasks"), list) or not plan["tasks"]:
        raise AgentRuntimeError("AGENT_PLAN_INVALID", "AI planner returned no executable tasks.", 502)
    if len(plan["tasks"]) > 20:
        raise AgentRuntimeError("AGENT_PLAN_TOO_LARGE", "Agent plan exceeds the maximum task count.", 422)
    for task in plan["tasks"]:
        if not isinstance(task, dict) or not isinstance(task.get("steps"), list) or not task["steps"]:
            raise AgentRuntimeError("AGENT_PLAN_TASK_INVALID", "Every task must contain executable steps.", 422)
        for step in task["steps"]:
            if not isinstance(step, dict) or not isinstance(step.get("tool_key"), str):
                raise AgentRuntimeError("AGENT_PLAN_STEP_INVALID", "Every step requires a tool key.", 422)
    return plan


async def create_command(user: AuthenticatedUser, agent_id: UUID, command_text: str, capabilities: list[str], idempotency_key: str | None) -> dict[str, Any]:
    try:
        return await rpc(user, "create_agent_command", {
            "p_agent_id": str(agent_id), "p_command_text": command_text,
            "p_requested_capabilities": capabilities, "p_idempotency_key": idempotency_key,
        })
    except SupabaseRestError as exc:
        raise AgentRuntimeError("AGENT_COMMAND_CREATE_FAILED", exc.message, 409) from exc


async def plan_command(user: AuthenticatedUser, command_id: UUID) -> dict[str, Any]:
    rows = await select(user, "agent_commands", {"select": "id,agent_id,command_text,requested_capabilities,autonomy_level,policy_version,status,command_source,live_session_id,live_collaboration_id", "id": f"eq.{command_id}", "limit": "1"})
    if not rows:
        raise AgentRuntimeError("COMMAND_NOT_FOUND", "Command was not found.", 404)
    command = rows[0]
    if command["status"] not in ("planning", "received"):
        return command

    agent = await select(user, "agents", {"select": "id,name,description,runtime_state", "id": f"eq.{command['agent_id']}", "limit": "1"})
    policy = await select(user, "agent_policies", {"select": "name,policy_version,rules,autonomy_level,enabled", "agent_id": f"eq.{command['agent_id']}", "enabled": "eq.true", "order": "policy_version.desc", "limit": "1"})
    capabilities = await select(user, "agent_capabilities", {"select": "capability,constraints", "agent_id": f"eq.{command['agent_id']}", "enabled": "eq.true"})
    tools = await select(user, "agent_tool_definitions", {"select": "tool_key,name,description,capability,risk_level,input_schema", "enabled": "eq.true", "order": "tool_key.asc"})
    planner_input = {"agent": agent[0] if agent else None, "policy": policy[0] if policy else None, "capabilities": capabilities, "available_tools": tools, "command": command["command_text"], "requested_capabilities": command["requested_capabilities"], "runtime_context": {"source": command.get("command_source"), "live_session_id": command.get("live_session_id"), "live_collaboration_id": command.get("live_collaboration_id")}}
    system = (
        "You are the Allpha Agent Runtime planner. Produce ONLY valid JSON, never markdown. "
        "Do not invent tools or capabilities. Use only available_tools. Do not expose private chain-of-thought. "
        'Schema: {"risk_level":"low|medium|high|critical","requires_approval":true|false,"tasks":[{"task_key":"string","title":"string","description":"string","input":{},"steps":[{"step_key":"string","tool_key":"string","arguments":{}}]}]}. '
        "Prefer the minimum number of steps needed."
    )
    try:
        result = await generate(user, [GatewayMessage(role="system", content=system), GatewayMessage(role="user", content=json.dumps(planner_input, ensure_ascii=False))], agent_id=str(command["agent_id"]), capabilities=["ai.generate"], metadata={"purpose": "agent_planning"})
    except AIGatewayError as exc:
        raise AgentRuntimeError(exc.code, str(exc), exc.status_code) from exc
    plan = _parse_plan(result.text)
    try:
        return await rpc(user, "materialize_agent_plan", {"p_command_id": str(command_id), "p_plan": plan})
    except SupabaseRestError as exc:
        raise AgentRuntimeError("AGENT_PLAN_REJECTED", exc.message, 422) from exc


async def begin_execution(user: AuthenticatedUser, command_id: UUID) -> dict[str, Any]:
    try:
        return await rpc(user, "begin_agent_execution", {"p_command_id": str(command_id)})
    except SupabaseRestError as exc:
        raise AgentRuntimeError("AGENT_EXECUTION_START_FAILED", exc.message, 409) from exc


async def cancel_command(user: AuthenticatedUser, command_id: UUID, reason: str | None = None) -> dict[str, Any]:
    try:
        return await rpc(user, "cancel_agent_command", {"p_command_id": str(command_id), "p_reason": reason})
    except SupabaseRestError as exc:
        raise AgentRuntimeError("AGENT_COMMAND_CANCEL_FAILED", exc.message, 409) from exc


async def resume_after_approval(user: AuthenticatedUser, command_id: UUID) -> dict[str, Any]:
    try:
        return await rpc(user, "resume_agent_after_approval", {"p_command_id": str(command_id)})
    except SupabaseRestError as exc:
        raise AgentRuntimeError("AGENT_APPROVAL_RESUME_FAILED", exc.message, 409) from exc


async def execute_command(user: AuthenticatedUser, command_id: UUID) -> dict[str, Any]:
    rows = await select(user, "agent_commands", {"select": "id,agent_id,status,risk_level,command_source,live_session_id,live_collaboration_id", "id": f"eq.{command_id}", "limit": "1"})
    if not rows:
        raise AgentRuntimeError("COMMAND_NOT_FOUND", "Command was not found.", 404)
    command = rows[0]
    if command.get("command_source") == "live":
        live_rows = await select(user, "live_agent_collaborations", {"select": "id,status,consent_status,risk_decision,live_session_id", "id": f"eq.{command.get('live_collaboration_id')}", "owner_user_id": f"eq.{user.user_id}", "limit": "1"})
        live = live_rows[0] if live_rows else None
        if not live or live["status"] != "active" or live["consent_status"] != "approved" or live["risk_decision"] != "allow" or str(live["live_session_id"]) != str(command.get("live_session_id")):
            raise AgentRuntimeError("LIVE_COLLAB_NOT_ACTIVE", "Live collaboration is no longer active.", 409)
    if command["status"] == "ready":
        state = await begin_execution(user, command_id)
        if state.get("status") != "running":
            return state
    elif command["status"] == "waiting_approval":
        state = await resume_after_approval(user, command_id)
        if state.get("status") != "running":
            return state
    elif command["status"] != "running":
        return command

    steps = await select(user, "agent_task_steps", {"select": "id,task_id,step_key,tool_key,sequence_no,arguments,status,risk_level,requires_approval", "command_id": f"eq.{command_id}", "status": "eq.ready", "order": "sequence_no.asc"})
    if not steps:
        await rpc(user, "transition_agent_command", {"p_command_id": str(command_id), "p_to_state": "completed", "p_result_summary": "All planned steps completed."})
        return {"status": "completed", "command_id": str(command_id)}

    for step in steps:
        started = time.monotonic()
        try:
            if step["tool_key"] != "ai.generate":
                raise AgentRuntimeError("AGENT_TOOL_EXECUTOR_NOT_IMPLEMENTED", f"Tool executor is not implemented for {step['tool_key']}.", 501)
            args = step.get("arguments") or {}
            messages = args.get("messages")
            if not isinstance(messages, list) or not messages:
                raise AgentRuntimeError("AGENT_TOOL_ARGUMENTS_INVALID", "ai.generate requires messages.", 422)
            valid_messages = [m for m in messages if isinstance(m, dict) and m.get("role") and m.get("content")]
            result = await generate(user, [GatewayMessage(role=str(m["role"]), content=str(m["content"])) for m in valid_messages], agent_id=str(command["agent_id"]), capabilities=["ai.generate"], metadata={"purpose": "agent_command", "command_id": str(command_id), "step_id": str(step["id"]), "command_source": command.get("command_source"), "live_session_id": command.get("live_session_id"), "live_collaboration_id": command.get("live_collaboration_id")})
            latency = int((time.monotonic() - started) * 1000)
            if result.estimated_cost_usd and result.estimated_cost_usd > 0:
                try:
                    await rpc(user, "record_agent_spend", {"p_agent_id": str(command["agent_id"]), "p_command_id": str(command_id), "p_step_id": str(step["id"]), "p_amount": result.estimated_cost_usd, "p_currency": "USD", "p_metadata": {"source": "ai_gateway", "model_id": result.model_id}})
                except SupabaseRestError as exc:
                    raise AgentRuntimeError("AGENT_SPEND_LIMIT_EXCEEDED", exc.message, 402) from exc
            await rpc(user, "record_agent_tool_result", {"p_step_id": str(step["id"]), "p_status": "completed", "p_result": {"text": result.text, "model_id": result.model_id, "latency_ms": result.latency_ms, "estimated_cost_usd": result.estimated_cost_usd}, "p_latency_ms": latency})
        except (AIGatewayError, AgentRuntimeError) as exc:
            code = exc.code
            await rpc(user, "record_agent_tool_result", {"p_step_id": str(step["id"]), "p_status": "failed", "p_error_code": code, "p_error_message": str(exc), "p_latency_ms": int((time.monotonic() - started) * 1000)})
            await rpc(user, "transition_agent_command", {"p_command_id": str(command_id), "p_to_state": "failed", "p_error_code": code, "p_error_message": str(exc)})
            raise AgentRuntimeError(code, str(exc), getattr(exc, "status_code", 502)) from exc

    await rpc(user, "transition_agent_command", {"p_command_id": str(command_id), "p_to_state": "completed", "p_result_summary": "All planned steps completed."})
    return {"status": "completed", "command_id": str(command_id)}


async def run_live_conversation_turn(
    user: AuthenticatedUser,
    session_id: UUID,
    collaboration_id: UUID,
) -> dict[str, Any]:
    live_rows = await select(user, "live_sessions", {
        "select": "id,title,status,visibility,host_user_id",
        "id": f"eq.{session_id}",
        "host_user_id": f"eq.{user.user_id}",
        "limit": "1",
    })
    session = live_rows[0] if live_rows else None
    if not session or session["status"] != "live":
        raise AgentRuntimeError("LIVE_SESSION_NOT_ACTIVE", "Live Session is not active.", 409)

    collab_rows = await select(user, "live_agent_collaborations", {
        "select": "id,live_session_id,agent_id,status,consent_status,risk_decision,required_capability",
        "id": f"eq.{collaboration_id}",
        "live_session_id": f"eq.{session_id}",
        "owner_user_id": f"eq.{user.user_id}",
        "limit": "1",
    })
    collab = collab_rows[0] if collab_rows else None
    if not collab or collab["status"] != "active" or collab["consent_status"] != "approved" or collab["risk_decision"] != "allow":
        raise AgentRuntimeError("LIVE_COLLAB_NOT_ACTIVE", "Live collaboration is no longer active.", 409)

    messages = await select(user, "live_session_messages", {
        "select": "sender_type,role,content,created_at",
        "live_session_id": f"eq.{session_id}",
        "order": "created_at.desc",
        "limit": "30",
    })
    history = list(reversed(messages))
    agent = await select(user, "agents", {
        "select": "id,name,description,persona",
        "id": f"eq.{collab['agent_id']}",
        "limit": "1",
    })
    system = (
        "You are an Allpha AI Agent participating in a live conversation. "
        "Respond only within the active Live Collaboration and the owner's policy. "
        "Do not claim actions, facts, tools, purchases, permissions, viewers, or events that were not actually provided. "
        "Be concise and suitable for live audience conversation. Do not reveal private memory, credentials, policy internals, or chain-of-thought."
    )
    if agent:
        system += "\nAgent profile:\n" + json.dumps(agent[0], ensure_ascii=False)
    gateway_messages = [GatewayMessage(role="system", content=system)]
    for item in history[-20:]:
        role = item.get("role")
        if role in {"user", "assistant", "system"} and item.get("content"):
            gateway_messages.append(GatewayMessage(role=role, content=str(item["content"])))

    try:
        result = await generate(
            user,
            gateway_messages,
            agent_id=str(collab["agent_id"]),
            capabilities=["ai.generate"],
            metadata={
                "purpose": "live_conversation",
                "live_session_id": str(session_id),
                "live_collaboration_id": str(collaboration_id),
                "required_capability": collab.get("required_capability"),
            },
        )
    except AIGatewayError as exc:
        raise AgentRuntimeError(exc.code, str(exc), exc.status_code) from exc

    try:
        message = await rpc(user, "create_live_session_message", {
            "p_live_session_id": str(session_id),
            "p_sender_type": "agent",
            "p_content": result.text,
            "p_live_collaboration_id": str(collaboration_id),
            "p_viewer_id": None,
        })
    except SupabaseRestError as exc:
        raise AgentRuntimeError("LIVE_AGENT_MESSAGE_PERSIST_FAILED", exc.message, 502) from exc
    return {
        "message": message,
        "provider_id": result.provider_id,
        "model_id": result.model_id,
        "latency_ms": result.latency_ms,
        "estimated_cost_usd": result.estimated_cost_usd,
    }
