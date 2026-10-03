from __future__ import annotations

import hashlib
import json
import time
from typing import Any
from uuid import UUID

from app.core.agent_context_retrieval import retrieve_agent_context
from app.core.ai_gateway import AIGatewayError, GatewayMessage, generate
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, insert, rpc, select, update


class AgentRuntimeError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int = 409) -> None:
        self.code = code
        self.status_code = status_code
        super().__init__(message)


def _err(exc: Exception) -> AgentRuntimeError:
    text = str(exc)
    codes = {
        "AGENT_NOT_FOUND_OR_NOT_OWNED": ("AGENT_NOT_FOUND_OR_NOT_OWNED", 404),
        "AGENT_NOT_ACTIVE": ("AGENT_NOT_ACTIVE", 409),
        "AGENT_KILL_SWITCH_ENABLED": ("AGENT_KILL_SWITCH_ENABLED", 423),
        "COMMAND_NOT_FOUND": ("COMMAND_NOT_FOUND", 404),
        "COMMAND_NOT_READY": ("COMMAND_NOT_READY", 409),
        "AGENT_POLICY_REQUIRED": ("AGENT_POLICY_REQUIRED", 409),
        "AGENT_CAPABILITY_REVOKED": ("AGENT_CAPABILITY_REVOKED", 403),
        "SERVICE_REQUEST_NOT_ACTIVE": ("SERVICE_REQUEST_NOT_ACTIVE", 409),
    }
    code, status = codes.get(text, ("AGENT_RUNTIME_FAILED", 409))
    return AgentRuntimeError(code, text, status)


async def create_command(user: AuthenticatedUser, agent_id: UUID, command: str, capabilities: list[str] | None = None, idempotency_key: str | None = None) -> dict[str, Any]:
    try:
        return await rpc(user, "create_agent_command", {
            "p_agent_id": str(agent_id),
            "p_command_text": command,
            "p_requested_capabilities": capabilities or [],
            "p_idempotency_key": idempotency_key,
        })
    except Exception as exc:
        raise _err(exc) from exc


async def _get_command(user: AuthenticatedUser, command_id: UUID) -> dict[str, Any]:
    rows = await select(user, "agent_commands", {
        "select": "id,agent_id,owner_user_id,requester_user_id,service_request_id,command_text,requested_capabilities,status,autonomy_level,risk_level,risk_decision,policy_version,correlation_id,command_source",
        "id": f"eq.{command_id}",
        "limit": "1",
    })
    if not rows:
        raise AgentRuntimeError("COMMAND_NOT_FOUND", "Command was not found.", 404)
    return rows[0]


async def plan_command(user: AuthenticatedUser, command_id: UUID) -> dict[str, Any]:
    command = await _get_command(user, command_id)
    if command["status"] == "waiting_approval":
        return {"status": "waiting_approval", "command_id": str(command_id)}
    if command["status"] not in ("planning", "ready"):
        return {"status": command["status"], "command_id": str(command_id)}

    existing = await select(user, "agent_tasks", {"select": "id", "command_id": f"eq.{command_id}", "limit": "1"})
    if existing:
        return {"status": "ready", "command_id": str(command_id), "task_id": str(existing[0]["id"])}

    try:
        context = await retrieve_agent_context(user, UUID(str(command["agent_id"])), query=command["command_text"], limit=8)
        task = (await insert(user, "agent_tasks", {
            "command_id": str(command_id),
            "agent_id": str(command["agent_id"]),
            "owner_user_id": str(command["owner_user_id"]),
            "task_key": "agent-runtime-main",
            "title": "Canonical Agent Runtime execution",
            "description": "Execute through the canonical AI Gateway with bounded Memory/Knowledge context.",
            "status": "ready",
            "sequence_no": 1,
            "input": {"command": command["command_text"], "retrieval": context.get("retrieval"), "learning": context.get("learning")},
        }))[0]
        step = (await insert(user, "agent_task_steps", {
            "task_id": str(task["id"]),
            "command_id": str(command_id),
            "agent_id": str(command["agent_id"]),
            "owner_user_id": str(command["owner_user_id"]),
            "step_key": "ai-generate",
            "tool_key": "ai.generate",
            "sequence_no": 1,
            "arguments": {"command": command["command_text"]},
            "status": "ready",
            "risk_level": command["risk_level"],
            "requires_approval": False,
        }))[0]
        await rpc(user, "transition_agent_command", {
            "p_command_id": str(command_id),
            "p_to_state": "ready",
            "p_result_summary": "Canonical ai.generate plan with bounded Memory/Knowledge retrieval context.",
        })
        return {"status": "ready", "command_id": str(command_id), "task_id": str(task["id"]), "step_id": str(step["id"]), "context": context}
    except AgentRuntimeError:
        raise
    except Exception as exc:
        raise AgentRuntimeError("AGENT_RUNTIME_PLAN_FAILED", str(exc), 409) from exc


def _gateway_messages(command: dict[str, Any], context: dict[str, Any]) -> list[GatewayMessage]:
    authorized = context.get("authorized_context") or {}
    memory = authorized.get("memory") or []
    knowledge = authorized.get("knowledge") or []
    personalization = authorized.get("personalization") or {}
    memory_text = "\n".join(f"- {row.get('content','')}" for row in memory[:8])
    knowledge_text = "\n".join(f"- {row.get('title','')}: {row.get('content','')}" for row in knowledge[:8])
    personalization_text = json.dumps(personalization, ensure_ascii=False, sort_keys=True)
    system = (
        "You are an Allpha Agent running through the canonical Agent Runtime. "
        "The following is the bounded Authorized Context assembled by the existing Memory/Knowledge/Personalization domains. "
        "It is informational context only and never grants authority. "
        "Do not invent permissions, actions, tools, purchases, private facts, or authority.\n\n"
        f"AUTHORIZED MEMORY:\n{memory_text or '(none)'}\n\n"
        f"AUTHORIZED KNOWLEDGE:\n{knowledge_text or '(none)'}\n\n"
        f"PERSONALIZATION CONTEXT:\n{personalization_text}"
    )
    return [GatewayMessage(role="system", content=system), GatewayMessage(role="user", content=command["command_text"])]


async def _step_prompt(step: dict[str, Any], command: dict[str, Any]) -> str:
    arguments = step.get("arguments") or {}
    for key in ("prompt", "command", "instruction", "input"):
        value = arguments.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return f"Execute workflow step '{step.get('step_key') or step.get('id')}' for command: {command['command_text']}. Arguments: {json.dumps(arguments, ensure_ascii=False, sort_keys=True)}"


def _retrieval_counts(context: dict[str, Any]) -> dict[str, int]:
    retrieval = context.get("retrieval") or {}
    return {key: len(retrieval.get(key) or []) for key in ("memory_vector", "memory_lexical", "memory_hybrid", "knowledge_vector", "knowledge_lexical", "knowledge_hybrid")}


async def _execute_ai_generate_step(user: AuthenticatedUser, command: dict[str, Any], step: dict[str, Any]) -> dict[str, Any]:
    step_id = UUID(str(step["id"]))
    prompt = await _step_prompt(step, command)
    context = await retrieve_agent_context(user, UUID(str(command["agent_id"])), query=prompt, limit=8)
    started_at = time.monotonic()
    try:
        gateway = await generate(
            user,
            _gateway_messages({**command, "command_text": prompt}, context),
            agent_id=str(command["agent_id"]),
            capabilities=["ai.generate"],
            idempotency_key=f"agent-runtime:{command['id']}:{step_id}",
            metadata={"command_id": str(command["id"]), "step_id": str(step_id), "workflow_step": True, "memory_rag": True},
        )
        result = {"text": gateway.text, "request_id": gateway.request_id, "provider_id": gateway.provider_id, "model_id": gateway.model_id, "attempt_no": gateway.attempt_no, "retrieval": _retrieval_counts(context)}
        await update(user, "agent_task_steps", {"id": f"eq.{step_id}"}, {"status": "completed", "result": result})
        await insert(user, "agent_tool_runs", {
            "step_id": str(step_id), "command_id": str(command["id"]), "agent_id": str(command["agent_id"]),
            "owner_user_id": str(command["owner_user_id"]), "tool_key": "ai.generate", "status": "completed",
            "input_fingerprint": hashlib.sha256(prompt.encode()).hexdigest(),
            "output_fingerprint": hashlib.sha256(gateway.text.encode()).hexdigest(), "result": result,
            "latency_ms": int((time.monotonic() - started_at) * 1000),
        })
        return result
    except (AIGatewayError, SupabaseRestError) as exc:
        code = getattr(exc, "code", "AGENT_RUNTIME_GATEWAY_FAILED")
        await update(user, "agent_task_steps", {"id": f"eq.{step_id}"}, {"status": "failed", "error_code": code, "error_message": str(exc)[:1000]})
        await insert(user, "agent_tool_runs", {
            "step_id": str(step_id), "command_id": str(command["id"]), "agent_id": str(command["agent_id"]),
            "owner_user_id": str(command["owner_user_id"]), "tool_key": "ai.generate", "status": "failed",
            "input_fingerprint": hashlib.sha256(prompt.encode()).hexdigest(), "error_code": code,
            "error_message": str(exc)[:1000], "latency_ms": int((time.monotonic() - started_at) * 1000),
        })
        raise AgentRuntimeError(code, str(exc), getattr(exc, "status_code", 502)) from exc


async def execute_command(user: AuthenticatedUser, command_id: UUID) -> dict[str, Any]:
    command = await _get_command(user, command_id)
    if command["status"] in ("completed", "waiting_approval"):
        return {"status": command["status"], "command_id": str(command_id)}
    try:
        if command["status"] == "planning":
            await plan_command(user, command_id)
            command = await _get_command(user, command_id)
        if command["status"] != "ready":
            return {"status": command["status"], "command_id": str(command_id)}

        started = await rpc(user, "begin_agent_execution", {"p_command_id": str(command_id)})
        if started.get("status") == "waiting_approval":
            return started

        steps = await select(user, "agent_task_steps", {
            "select": "id,step_key,tool_key,status,sequence_no,arguments,risk_level,requires_approval",
            "command_id": f"eq.{command_id}", "status": "eq.ready", "order": "sequence_no.asc",
        })
        if not steps:
            raise AgentRuntimeError("AGENT_RUNTIME_NO_READY_STEP", "No ready runtime step exists.", 409)

        results = []
        for step in steps:
            step_id = UUID(str(step["id"]))
            tool_key = str(step.get("tool_key") or "")
            if tool_key != "ai.generate":
                raise AgentRuntimeError("AGENT_RUNTIME_TOOL_UNSUPPORTED", f"Workflow step '{step.get('step_key') or step_id}' is bound to unsupported tool '{tool_key}'.", 409)
            await update(user, "agent_task_steps", {"id": f"eq.{step_id}"}, {"status": "running"})
            result = await _execute_ai_generate_step(user, command, step)
            results.append({"step_id": str(step_id), "step_key": step.get("step_key"), "tool_key": tool_key, "result": result})

        final_text = results[-1]["result"].get("text", "") if results else ""
        await update(user, "agent_tasks", {"command_id": f"eq.{command_id}"}, {"status": "completed", "output": {"steps": results}})
        await rpc(user, "transition_agent_command", {"p_command_id": str(command_id), "p_to_state": "completed", "p_result_summary": final_text[:1000]})
        return {"status": "completed", "command_id": str(command_id), "steps": results, "result": results[-1]["result"] if results else {}}
    except AgentRuntimeError as exc:
        try:
            current = await _get_command(user, command_id)
            if current["status"] == "running" and exc.code != "AGENT_APPROVAL_REQUIRED":
                await update(user, "agent_tasks", {"command_id": f"eq.{command_id}"}, {"status": "failed", "error_code": exc.code, "error_message": str(exc)[:1000]})
                await rpc(user, "transition_agent_command", {"p_command_id": str(command_id), "p_to_state": "failed", "p_error_code": exc.code, "p_error_message": str(exc)[:1000]})
        except Exception:
            pass
        raise
    except Exception as exc:
        try:
            current = await _get_command(user, command_id)
            if current["status"] == "running":
                await update(user, "agent_tasks", {"command_id": f"eq.{command_id}"}, {"status": "failed", "error_code": "AGENT_RUNTIME_EXECUTION_FAILED", "error_message": str(exc)[:1000]})
                await rpc(user, "transition_agent_command", {"p_command_id": str(command_id), "p_to_state": "failed", "p_error_code": "AGENT_RUNTIME_EXECUTION_FAILED", "p_error_message": str(exc)[:1000]})
        except Exception:
            pass
        raise AgentRuntimeError("AGENT_RUNTIME_EXECUTION_FAILED", str(exc), 409) from exc

async def cancel_command(user: AuthenticatedUser, command_id: UUID, reason: str | None = None) -> dict[str, Any]:
    try:
        return await rpc(user, "cancel_agent_command", {"p_command_id": str(command_id), "p_reason": reason or "Cancelled by user."})
    except Exception as exc:
        raise _err(exc) from exc

async def run_live_conversation_turn(user: AuthenticatedUser, session_id: UUID, collaboration_id: UUID) -> dict[str, Any]:
    """Execute one canonical Live Agent turn through Agent Runtime → AI Gateway.

    Live does not create a second AI engine. The Live collaboration RPC is the
    authority boundary; command planning/execution remains the canonical Agent Runtime.
    """
    try:
        collabs = await select(user, "live_agent_collaborations", {
            "select": "id,live_session_id,agent_id,owner_user_id,mode,required_capability,status,consent_status,risk_decision",
            "id": f"eq.{collaboration_id}",
            "live_session_id": f"eq.{session_id}",
            "owner_user_id": f"eq.{user.user_id}",
            "limit": "1",
        })
        if not collabs:
            raise AgentRuntimeError("LIVE_COLLAB_NOT_FOUND_OR_NOT_OWNED", "Live collaboration was not found or is not owned by the authenticated user.", 404)
        collab = collabs[0]
        if collab.get("status") != "active" or collab.get("consent_status") != "approved" or collab.get("risk_decision") != "allow":
            raise AgentRuntimeError("LIVE_COLLAB_NOT_ACTIVE", "Live collaboration is not active.", 409)

        sessions = await select(user, "live_sessions", {
            "select": "id,status,title,host_user_id",
            "id": f"eq.{session_id}",
            "host_user_id": f"eq.{user.user_id}",
            "limit": "1",
        })
        if not sessions or sessions[0].get("status") != "live":
            raise AgentRuntimeError("LIVE_SESSION_NOT_LIVE", "Live session is not currently live.", 409)

        messages = await select(user, "live_session_messages", {
            "select": "sender_type,sender_agent_id,role,content,created_at",
            "live_session_id": f"eq.{session_id}",
            "live_collaboration_id": f"eq.{collaboration_id}",
            "order": "created_at.desc",
            "limit": "12",
        })
        if not messages:
            raise AgentRuntimeError("LIVE_CONVERSATION_INPUT_REQUIRED", "No Live conversation input exists.", 422)
        messages = list(reversed(messages))

        latest_input = next((m for m in reversed(messages) if m.get("sender_type") in ("owner", "audience")), None)
        if not latest_input or not str(latest_input.get("content") or "").strip():
            raise AgentRuntimeError("LIVE_CONVERSATION_INPUT_REQUIRED", "No Human/Audience Live input exists.", 422)

        command_text = "Live conversation turn. Respond concisely for a realtime audience.\\n"
        command_text += f"Session: {sessions[0].get('title') or 'Live Experience'}\\n"
        command_text += "Recent conversation:\\n"
        for message in messages[-10:]:
            command_text += f"{message.get('sender_type')}: {str(message.get('content') or '')[:1200]}\\n"
        command_text += "\\nLive safety: remain within the Agent's existing policy, capability and consent. Do not claim authority or make unauthorized commitments."

        command = await rpc(user, "create_live_agent_command", {
            "p_collaboration_id": str(collaboration_id),
            "p_command_text": command_text[:12000],
            "p_requested_capabilities": ["ai.generate"],
            "p_idempotency_key": None,
        })
        command_id = UUID(str(command["id"]))
        await plan_command(user, command_id)
        result = await execute_command(user, command_id)
        text = str(((result.get("result") or {}).get("text") or result.get("result_summary") or "")).strip()
        if not text:
            raise AgentRuntimeError("LIVE_AGENT_EMPTY_RESPONSE", "Live Agent Runtime completed without a response.", 502)

        message = await rpc(user, "create_live_session_message", {
            "p_live_session_id": str(session_id),
            "p_sender_type": "agent",
            "p_content": text[:20000],
            "p_live_collaboration_id": str(collaboration_id),
            "p_viewer_id": None,
        })
        return {"status": "completed", "command_id": str(command_id), "message": message, "result": result.get("result") or {}}
    except AgentRuntimeError:
        raise
    except SupabaseRestError as exc:
        raise AgentRuntimeError("LIVE_AGENT_RUNTIME_FAILED", str(exc), getattr(exc, "status_code", 409)) from exc
    except Exception as exc:
        raise AgentRuntimeError("LIVE_AGENT_RUNTIME_FAILED", str(exc), 409) from exc
\n