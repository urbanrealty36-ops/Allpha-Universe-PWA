from __future__ import annotations

import hashlib
import os
import time
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import insert, select, update


class AIGatewayError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int = 502) -> None:
        self.code = code
        self.status_code = status_code
        super().__init__(message)


@dataclass(frozen=True)
class GatewayMessage:
    role: str
    content: str


@dataclass(frozen=True)
class GatewayResult:
    text: str
    provider_id: str
    model_id: str
    model_identifier: str
    input_tokens: int | None
    output_tokens: int | None
    total_tokens: int | None
    estimated_cost_usd: float | None
    latency_ms: int
    attempt_no: int


def fingerprint_messages(messages: list[GatewayMessage]) -> str:
    raw = "\n".join(f"{m.role}:{m.content}" for m in messages).encode()
    return hashlib.sha256(raw).hexdigest()


def _estimate_tokens(messages: list[GatewayMessage]) -> int:
    return max(1, sum(len(m.content) for m in messages) // 4)


def _policy_for(user_id: str, agent_id: str | None, policies: list[dict[str, Any]]) -> dict[str, Any] | None:
    eligible = []
    for policy in policies:
        scope = policy.get("scope_type")
        if scope == "global":
            eligible.append((2, policy))
        elif scope == "user" and policy.get("scope_id") == user_id:
            eligible.append((1, policy))
        elif agent_id and scope == "agent" and policy.get("scope_id") == agent_id:
            eligible.append((0, policy))
    if not eligible:
        return None
    eligible.sort(key=lambda item: (item[0], int(item[1].get("priority", 100))))
    return eligible[0][1]


def _capabilities(model: dict[str, Any]) -> set[str]:
    raw = model.get("capabilities") or []
    if isinstance(raw, list):
        return {str(value) for value in raw}
    if isinstance(raw, dict):
        return {str(key) for key, value in raw.items() if value}
    return set()


def _candidate_models(models: list[dict[str, Any]], policy: dict[str, Any] | None, requested: set[str]) -> list[dict[str, Any]]:
    enabled = [
        model for model in models
        if model.get("enabled")
        and isinstance(model.get("ai_providers"), dict)
        and model["ai_providers"].get("enabled")
    ]

    def compatible(model: dict[str, Any]) -> bool:
        return requested.issubset(_capabilities(model))

    if policy:
        allowed = [str(value) for value in policy.get("allowed_model_ids") or []]
        fallback = [str(value) for value in policy.get("fallback_model_ids") or []]
        primary = [model for model in enabled if str(model["id"]) in allowed and compatible(model)]
        secondary = [model for model in enabled if str(model["id"]) in fallback and compatible(model)]
        if primary or secondary:
            return primary + [model for model in secondary if model not in primary]
    return [model for model in enabled if compatible(model)]


def _provider_secret(provider: dict[str, Any]) -> str:
    env_name = provider.get("credential_env_var")
    if not env_name:
        raise AIGatewayError("AI_PROVIDER_CREDENTIAL_NOT_CONFIGURED", "Provider credential environment variable is not configured.", 503)
    value = os.getenv(str(env_name), "").strip()
    if not value:
        raise AIGatewayError("AI_PROVIDER_CREDENTIAL_NOT_CONFIGURED", "Provider credential is not configured on the server.", 503)
    return value


async def _call_openai_compatible(provider: dict[str, Any], model: dict[str, Any], messages: list[GatewayMessage], max_output_tokens: int, timeout_ms: int) -> tuple[str, int | None, int | None, int]:
    payload = {
        "model": model["model_identifier"],
        "messages": [{"role": message.role, "content": message.content} for message in messages],
        "max_tokens": max_output_tokens,
    }
    headers = {"Authorization": f"Bearer {_provider_secret(provider)}", "Content-Type": "application/json"}
    url = f"{provider['base_url'].rstrip('/')}/chat/completions"
    started = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=timeout_ms / 1000) as client:
            response = await client.post(url, json=payload, headers=headers)
    except httpx.TimeoutException as exc:
        raise AIGatewayError("AI_PROVIDER_TIMEOUT", "AI provider request timed out.", 504) from exc
    except httpx.HTTPError as exc:
        raise AIGatewayError("AI_PROVIDER_NETWORK_ERROR", "AI provider network request failed.", 502) from exc
    latency = int((time.monotonic() - started) * 1000)
    if response.status_code >= 400:
        code = "AI_PROVIDER_RATE_LIMITED" if response.status_code == 429 else "AI_PROVIDER_HTTP_ERROR"
        raise AIGatewayError(code, f"AI provider returned HTTP {response.status_code}.", 429 if response.status_code == 429 else 502)
    data = response.json()
    choices = data.get("choices") or []
    text = ((choices[0].get("message") or {}).get("content") or "") if choices else ""
    usage = data.get("usage") or {}
    return str(text), usage.get("prompt_tokens"), usage.get("completion_tokens"), latency


async def _call_anthropic(provider: dict[str, Any], model: dict[str, Any], messages: list[GatewayMessage], max_output_tokens: int, timeout_ms: int) -> tuple[str, int | None, int | None, int]:
    system = "\n".join(message.content for message in messages if message.role == "system")
    body_messages = [{"role": message.role, "content": message.content} for message in messages if message.role != "system"]
    payload: dict[str, Any] = {"model": model["model_identifier"], "max_tokens": max_output_tokens, "messages": body_messages}
    if system:
        payload["system"] = system
    headers = {
        "x-api-key": _provider_secret(provider),
        "anthropic-version": str((provider.get("metadata") or {}).get("anthropic_version", "2023-06-01")),
        "content-type": "application/json",
    }
    url = f"{provider['base_url'].rstrip('/')}/messages"
    started = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=timeout_ms / 1000) as client:
            response = await client.post(url, json=payload, headers=headers)
    except httpx.TimeoutException as exc:
        raise AIGatewayError("AI_PROVIDER_TIMEOUT", "AI provider request timed out.", 504) from exc
    except httpx.HTTPError as exc:
        raise AIGatewayError("AI_PROVIDER_NETWORK_ERROR", "AI provider network request failed.", 502) from exc
    latency = int((time.monotonic() - started) * 1000)
    if response.status_code >= 400:
        code = "AI_PROVIDER_RATE_LIMITED" if response.status_code == 429 else "AI_PROVIDER_HTTP_ERROR"
        raise AIGatewayError(code, f"AI provider returned HTTP {response.status_code}.", 429 if response.status_code == 429 else 502)
    data = response.json()
    text = "".join(str(block.get("text", "")) for block in (data.get("content") or []) if block.get("type") == "text")
    usage = data.get("usage") or {}
    return text, usage.get("input_tokens"), usage.get("output_tokens"), latency


async def _provider_call(provider: dict[str, Any], model: dict[str, Any], messages: list[GatewayMessage], max_output_tokens: int, timeout_ms: int) -> tuple[str, int | None, int | None, int]:
    if provider.get("adapter") == "openai_compatible":
        return await _call_openai_compatible(provider, model, messages, max_output_tokens, timeout_ms)
    if provider.get("adapter") == "anthropic":
        return await _call_anthropic(provider, model, messages, max_output_tokens, timeout_ms)
    raise AIGatewayError("AI_PROVIDER_ADAPTER_UNSUPPORTED", "The configured provider adapter is unsupported.", 503)


def _estimate_cost(model: dict[str, Any], input_tokens: int | None, output_tokens: int | None) -> float | None:
    if input_tokens is None and output_tokens is None:
        return None
    return ((input_tokens or 0) * float(model.get("input_cost_per_1m") or 0) + (output_tokens or 0) * float(model.get("output_cost_per_1m") or 0)) / 1_000_000


async def _update_request(user: AuthenticatedUser, request_id: str, values: dict[str, Any]) -> None:
    await update(user, "ai_gateway_requests", {"id": f"eq.{request_id}"}, values, returning=False)


async def _record_attempt(user: AuthenticatedUser, values: dict[str, Any]) -> None:
    await insert(user, "ai_gateway_attempts", values, returning=False)


async def _record_usage(user: AuthenticatedUser, values: dict[str, Any]) -> None:
    await insert(user, "ai_usage_events", {"user_id": str(user.user_id), **values}, returning=False)


async def generate(user: AuthenticatedUser, messages: list[GatewayMessage], *, agent_id: str | None = None, capabilities: list[str] | None = None, idempotency_key: str | None = None, metadata: dict[str, Any] | None = None) -> GatewayResult:
    requested = {str(value) for value in (capabilities or [])}
    existing = []
    if idempotency_key:
        existing = await select(user, "ai_gateway_requests", {
            "select": "id,status",
            "user_id": f"eq.{user.user_id}",
            "idempotency_key": f"eq.{idempotency_key}",
            "limit": "1",
        })
        if existing:
            raise AIGatewayError("AI_IDEMPOTENCY_REPLAY_UNAVAILABLE", "An idempotency key has already been used. A new provider call was not started.", 409)

    request_rows = await insert(user, "ai_gateway_requests", {
        "user_id": str(user.user_id),
        "agent_id": agent_id,
        "idempotency_key": idempotency_key,
        "requested_capabilities": sorted(requested),
        "input_fingerprint": fingerprint_messages(messages),
        "metadata": metadata or {},
    })
    if not request_rows:
        raise AIGatewayError("AI_GATEWAY_REQUEST_CREATE_FAILED", "The AI gateway request could not be created.", 502)
    request = request_rows[0]
    request_id = str(request["id"])

    providers = await select(user, "ai_providers", {"select": "id,provider_key,display_name,adapter,base_url,credential_env_var,enabled,metadata", "enabled": "eq.true"})
    models = await select(user, "ai_models", {"select": "id,provider_id,model_key,model_identifier,display_name,enabled,context_window_tokens,max_output_tokens,input_cost_per_1m,output_cost_per_1m,capabilities,ai_providers(id,provider_key,adapter,base_url,credential_env_var,enabled,metadata)", "enabled": "eq.true"})
    policies = await select(user, "ai_routing_policies", {"select": "id,policy_key,scope_type,scope_id,priority,enabled,required_capabilities,allowed_model_ids,fallback_model_ids,max_context_tokens,max_output_tokens,max_cost_usd,timeout_ms,max_retries,safety_policy,metadata", "enabled": "eq.true", "order": "priority.asc"})
    del providers

    policy = _policy_for(str(user.user_id), agent_id, policies)
    if policy and policy.get("required_capabilities"):
        requested.update(str(value) for value in policy["required_capabilities"])

    candidates = _candidate_models(models, policy, requested)
    if not candidates:
        await _update_request(user, request_id, {"request_id": request_id, "status": "not_configured", "safety_status": "not_configured", "error_code": "AI_NO_COMPATIBLE_MODEL", "error_message": "No enabled model satisfies the requested capabilities."})
        await _record_usage(user, {"p_request_id": request_id, "event_type": "denied", "agent_id": agent_id, "metadata": {"reason": "no_compatible_model"}})
        raise AIGatewayError("AI_NO_COMPATIBLE_MODEL", "No configured AI model can satisfy this request.", 503)

    estimated_input = _estimate_tokens(messages)
    max_context = int((policy or {}).get("max_context_tokens") or candidates[0]["context_window_tokens"])
    if estimated_input >= max_context:
        await rpc(user, "record_ai_gateway_outcome", {"p_request_id": request_id, "p_status": "denied", "p_safety_status": "denied", "selected_policy_id": str(policy["id"]) if policy else None, "p_error_code": "AI_CONTEXT_BUDGET_EXCEEDED", "p_error_message": "Input exceeds the configured context budget."})
        raise AIGatewayError("AI_CONTEXT_BUDGET_EXCEEDED", "Input exceeds the configured context budget.", 413)

    safety = (policy or {}).get("safety_policy") or {}
    if safety.get("mode") == "required" and not safety.get("enabled", False):
        await rpc(user, "record_ai_gateway_outcome", {"p_request_id": request_id, "p_status": "denied", "p_safety_status": "denied", "p_selected_policy_id": str(policy["id"]) if policy else None, "p_error_code": "AI_SAFETY_POLICY_NOT_CONFIGURED", "p_error_message": "The routing policy requires a configured safety gate."})
        raise AIGatewayError("AI_SAFETY_POLICY_NOT_CONFIGURED", "AI safety policy is required but not configured.", 503)
    max_input_chars = safety.get("max_input_chars")
    if safety.get("enabled") and isinstance(max_input_chars, int) and sum(len(message.content) for message in messages) > max_input_chars:
        await rpc(user, "record_ai_gateway_outcome", {"p_request_id": request_id, "p_status": "denied", "p_safety_status": "denied", "p_selected_policy_id": str(policy["id"]) if policy else None, "p_error_code": "AI_SAFETY_INPUT_LIMIT", "p_error_message": "Input exceeds the configured safety input limit."})
        raise AIGatewayError("AI_SAFETY_INPUT_LIMIT", "Input exceeds the configured safety input limit.", 413)

    max_retries = int((policy or {}).get("max_retries", 1))
    timeout_ms = int((policy or {}).get("timeout_ms", 30000))
    max_output = int((policy or {}).get("max_output_tokens") or candidates[0].get("max_output_tokens") or 2048)
    last_error: AIGatewayError | None = None

    await rpc(user, "record_ai_gateway_outcome", {"p_request_id": request_id, "status": "running", "p_safety_status": "allowed" if safety.get("enabled") else "not_configured", "p_selected_policy_id": str(policy["id"]) if policy else None})

    for index, model in enumerate(candidates[: max_retries + 1], start=1):
        provider = model.get("ai_providers") or {}
        await _record_attempt(user, {"p_request_id": request_id, "attempt_no": index, "provider_id": str(provider["id"]), "model_id": str(model["id"]), "p_status": "started"})
        try:
            text, input_tokens, output_tokens, latency = await _provider_call(provider, model, messages, max_output, timeout_ms)
            total = (input_tokens or 0) + (output_tokens or 0) if input_tokens is not None or output_tokens is not None else None
            cost = _estimate_cost(model, input_tokens, output_tokens)
            if policy and policy.get("max_cost_usd") is not None and cost is not None and cost > float(policy["max_cost_usd"]):
                raise AIGatewayError("AI_COST_BUDGET_EXCEEDED", "Estimated model cost exceeds the routing policy budget.", 402)
            await rpc(user, "record_ai_gateway_attempt", {"p_request_id": request_id, "p_attempt_no": index, "p_provider_id": str(provider["id"]), "p_model_id": str(model["id"]), "p_status": "completed", "latency_ms": latency, "input_tokens": input_tokens, "output_tokens": output_tokens, "total_tokens": total, "estimated_cost_usd": cost})
            await rpc(user, "record_ai_gateway_outcome", {"p_request_id": request_id, "p_status": "completed", "p_safety_status": "allowed" if safety.get("enabled") else "not_configured", "selected_model_id": str(model["id"]), "p_selected_policy_id": str(policy["id"]) if policy else None, "p_input_tokens": input_tokens, "p_output_tokens": output_tokens, "p_total_tokens": total, "p_estimated_cost_usd": cost, "p_latency_ms": latency, "response_text_hash": hashlib.sha256(text.encode()).hexdigest()})
            await rpc(user, "record_ai_usage_event", {"p_request_id": request_id, "p_event_type": "success", "p_provider_id": str(provider["id"]), "p_model_id": str(model["id"]), "agent_id": agent_id, "p_input_tokens": input_tokens, "p_output_tokens": output_tokens, "p_total_tokens": total, "p_estimated_cost_usd": cost, "p_latency_ms": latency})
            return GatewayResult(text=text, provider_id=str(provider["id"]), model_id=str(model["id"]), model_identifier=str(model["model_identifier"]), input_tokens=input_tokens, output_tokens=output_tokens, total_tokens=total, estimated_cost_usd=cost, latency_ms=latency, attempt_no=index)
        except AIGatewayError as exc:
            last_error = exc
            await rpc(user, "record_ai_gateway_attempt", {"p_request_id": request_id, "p_attempt_no": index, "p_provider_id": str(provider["id"]), "p_model_id": str(model["id"]), "p_status": "timeout" if exc.code == "AI_PROVIDER_TIMEOUT" else ("rate_limited" if exc.code == "AI_PROVIDER_RATE_LIMITED" else "failed"), "p_error_code": exc.code, "p_error_message": str(exc)[:1000]})
            if index < min(max_retries + 1, len(candidates)):
                await rpc(user, "record_ai_usage_event", {"p_request_id": request_id, "p_event_type": "retry", "p_provider_id": str(provider["id"]), "p_model_id": str(model["id"]), "p_agent_id": agent_id, "p_metadata": {"attempt_no": index, "error_code": exc.code}})
                continue
            break

    await rpc(user, "record_ai_gateway_outcome", {"p_request_id": request_id, "p_status": "failed", "p_safety_status": "allowed" if safety.get("enabled") else "not_configured", "p_selected_policy_id": str(policy["id"]) if policy else None, "p_error_code": last_error.code if last_error else "AI_GATEWAY_FAILED", "p_error_message": str(last_error)[:1000] if last_error else "All configured model attempts failed."})
    await rpc(user, "record_ai_usage_event", {"p_request_id": request_id, "p_event_type": "failure", "p_agent_id": agent_id, "p_metadata": {"error_code": last_error.code if last_error else "AI_GATEWAY_FAILED"}})
    raise last_error or AIGatewayError("AI_GATEWAY_FAILED", "All configured model attempts failed.", 502)
