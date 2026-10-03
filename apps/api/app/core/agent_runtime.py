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
    try:
        context = await rpc(user, "get_agent_runtime_context", {"p_command_id": str(command_id)})
    except SupabaseRestError as exc:
        raise AgentRuntimeError("AGENT_RUNTIME_CONTEXT_FAILED", exc.message, 409) from exc

    command = context.get("command") or {}
    planner_input = {
        "agent": context.get("agent"),
        "policy": context.get("policy"),
        "capabilities": context.get("capabilities") or [],
        "available_tools": context.get("available_tools") or [],
        "command": command.get("command_text"),
        "requested_capabilities": command.get("requested_capabilities") or [],
        "runtime_context": {
            "source": command.get("command_source"),
            "service_request_id": command.get("service_request_id"),
            "live_session_id": command.get("live_session_id"),
            "live_collaboration_id": command.get("live_collaboration_id"),
            "privacy": context.get("privacy") or {},
        },
    }

    system = (
        "You are the Allpha Agent Runtime planner. Produce ONLY valid JSON, never markdown. "
        "Do not invent tools or capabilities. Use only available_tools. "
        "Do not expose private chain-of-thought or private Agent-owner policy internals. "
        'Schema: {"risk_level":"low|medium|high|critical","requires_approval":true|false,'
        '"tasks":[{"task_key":"string","title":"string","description":"string","input":{},'
        '"steps":[{"step_key":"string","tool_key":"string","arguments":{}}]}]}. '
        "Prefer the minimum number of steps needed."
    )
    try:
        result = await generate(
            user,
            [
                GatewayMessage(role="system", content=system),
                GatewayMessage(role="user", content=json.dumps(planner_input, ensure_ascii=False)),
            ],
            agent_id=str(command["agent_id"]),
            capabilities=["ai.generate"],
            metadata={"purpose": "agent_planning", "command_id": str(command_id)},
        )
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


def _path_value(value: Any, path: str) -> Any:
    current: Any = value
    for part in path.split("."):
        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list) and part.isdigit() and int(part) < len(current):
            current = current[int(part)]
        else:
            return None
    return current


def _condition_matches(condition: Any, completed: dict[str, Any]) -> bool:
    if not condition:
        return True
    if not isinstance(condition, dict):
        return False
    if isinstance(condition.get("all"), list):
        return all(_condition_matches(item, completed) for item in condition["all"])
    if isinstance(condition.get("any"), list):
        return any(_condition_matches(item, completed) for item in condition["any"])
    path = condition.get("path")
    operator = condition.get("operator", "exists")
    if not isinstance(path, str):
        return False
    actual = _path_value(completed, path)
    if operator == "exists":
        return actual is not None
    if operator == "equals":
        return actual == condition.get("value")
    if operator == "not_equals":
        return actual != condition.get("value")
    if operator == "contains":
        return isinstance(actual, (str, list, dict)) and condition.get("value") in actual
    return False


def _retry_policy(policy: Any) -> tuple[int, int, set[str]]:
    if not isinstance(policy, dict):
        return 1, 0, set()
    try:
        max_attempts = max(1, min(int(policy.get("max_attempts", 1)), 5))
    except (TypeError, ValueError):
        max_attempts = 1
    try:
        backoff_ms = max(0, min(int(policy.get("backoff_ms", 250)), 30000))
    except (TypeError, ValueError):
        backoff_ms = 250
    codes = policy.get("retryable_codes") or []
    return max_attempts, backoff_ms, {str(code) for code in codes if isinstance(code, str)}


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

    completed: dict[str, Any] = {}
    for step in steps:
        control = (step.get("arguments") or {}).get("_workflow_control") or {}
        if not _condition_matches(control.get("condition"), completed):
            await rpc(
                user,
                "record_agent_tool_result",
                {
                    "p_step_id": str(step["id"]),
                    "p_status": "skipped",
                    "p_result": {"skipped": True, "reason": "condition_false"},
                },
            )
            completed[step["step_key"]] = {"status": "skipped", "result": {"skipped": True, "reason": "condition_false"}}
            continue

        args = dict(step.get("arguments") or {})
        args.pop("_workflow_control", None)
        messages = args.get("messages")
        if not isinstance(messages, list) or not messages:
            code = "AGENT_TOOL_ARGUMENTS_INVALID"
            await rpc(user, "record_agent_tool_result", {"p_step_id": str(step["id"]), "p_status": "failed", "p_error_code": code, "p_error_message": "ai.generate requires messages."})
            await rpc(user, "transition_agent_command", {"p_command_id": str(command_id), "p_to_state": "failed", "p_error_code": code, "p_error_message": "ai.generate requires messages."})
            raise AgentRuntimeError(code, "ai.generate requires messages.", 422)

        valid_messages = [m for m in messages if isinstance(m, dict) and m.get("role") and m.get("content")]
        max_attempts, backoff_ms, retryable_codes = _retry_policy(control.get("retry_policy"))
        last_error: AgentRuntimeError | None = None

        for attempt in range(1, max_attempts + 1):
            started = time.monotonic()
            try:
                if step["tool_key"] != "ai.generate":
                    raise AgentRuntimeError("AGENT_TOOL_EXECUTOR_NOT_IMPLEMENTED", f"Tool executor is not implemented for {step['tool_key']}.", 501)
                result = await generate(
                    user,
                    [GatewayMessage(role=str(m["role"]), content=str(m["content"])) for m in valid_messages],
                    agent_id=str(command["agent_id"]),
                    capabilities=["ai.generate"],
                    metadata={
                        "purpose": "agent_command",
                        "command_id": str(command_id),
                        "step_id": str(step["id"]),
                        "command_source": command.get("command_source"),
                        "live_session_id": command.get("live_session_id"),
                        "live_collaboration_id": command.get("live_collaboration_id"),
                        "attempt": attempt,
                    },
                )
                latency = int((time.monotonic() - started) * 1000)
                if result.estimated_cost_usd and result.estimated_cost_usd > 0:
                    try:
                        await rpc(user, "record_agent_spend", {"p_agent_id": str(command["agent_id"]), "p_command_id": str(command_id), "p_step_id": str(step["id"]), "p_amount": result.estimated_cost_usd, "p_currency": "USD", "p_metadata": {"source": "ai_gateway", "model_id": result.model_id, "attempt": attempt}})
                    except SupabaseRestError as exc:
                        raise AgentRuntimeError("AGENT_SPEND_LIMIT_EXCEEDED", exc.message, 402) from exc
                payload = {"text": result.text, "request_id": result.request_id, "model_id": result.model_id, "latency_ms": result.latency_ms, "estimated_cost_usd": result.estimated_cost_usd, "attempt": attempt}
                await rpc(user, "record_agent_tool_result", {"p_step_id": str(step["id"]), "p_status": "completed", "p_result": payload, "p_latency_ms": latency})
                completed[step["step_key"]] = {"status": "completed", "result": payload}
                last_error = None
                break
            except (AIGatewayError, AgentRuntimeError) as exc:
                last_error = exc if isinstance(exc, AgentRuntimeError) else AgentRuntimeError(exc.code, str(exc), exc.status_code)
                retryable = last_error.code in retryable_codes and attempt < max_attempts
                if retryable:
                    await asyncio.sleep((backoff_ms * attempt) / 1000)
                    continue
                await rpc(user, "record_agent_tool_result", {"p_step_id": str(step["id"]), "p_status": "failed", "p_error_code": last_error.code, "p_error_message": str(last_error), "p_latency_ms": int((time.monotonic() - started) * 1000)})
                await rpc(user, "transition_agent_command", {"p_command_id": str(command_id), "p_to_state": "failed", "p_error_code": last_error.code, "p_error_message": str(last_error)})
                raise last_error

        if last_error is not None:
            raise last_error

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
