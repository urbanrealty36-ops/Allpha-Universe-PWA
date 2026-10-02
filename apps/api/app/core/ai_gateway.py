from __future__ import annotations

import hashlib
import os
import time
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import rpc, select


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


async def _update_request(user: AuthenticatedUser, request_id: str, values: dict[str, Any]) -> Any:
    return await rpc(user, "record_ai_gateway_outcome", {
        "p_request_id": request_id,
        **values,
    })


async def _record_attempt(user: AuthenticatedUser, values: dict[str, Any]) -> Any:
    return await rpc(user, "record_ai_gateway_attempt", {
        "p_request_id": values["request_id"],
        "p_attempt_no": values["attempt_no"],
        "p_provider_id": values["provider_id"],
        "p_model_id": values["model_id"],
        "p_status": values["status"],
        "p_latency_ms": values.get("latency_ms"),
        "p_input_tokens": values.get("input_tokens"),
        "p_output_tokens": values.get("output_tokens"),
        "p_total_tokens": values.get("total_tokens"),
        "p_estimated_cost_usd": values.get("estimated_cost_usd"),
        "p_http_status": values.get("http_status"),
        "p_error_code": values.get("error_code"),
        "p_error_message": values.get("error_message"),
    })


async def _record_usage(user: AuthenticatedUser, values: dict[str, Any]) -> Any:
    return await rpc(user, "record_ai_usage_event", {
        "p_request_id": values.get("request_id"),
        "p_event_type": values["event_type"],
        "p_provider_id": values.get("provider_id"),
        "p_model_id": values.get("model_id"),
        "p_agent_id": values.get("agent_id"),
        "p_input_tokens": values.get("input_tokens"),
        "p_output_tokens": values.get("output_tokens"),
        "p_total_tokens": values.get("total_tokens"),
        "p_estimated_cost_usd": values.get("estimated_cost_usd"),
        "p_latency_ms": values.get("latency_ms"),
        "p_metadata": values.get("metadata") or {},
    })


async def generate(user: AuthenticatedUser, messages: list[GatewayMessage], *, agent_id: str | None = None, capabilities: list[str] | None = None, idempotency_key: str | None = None, metadata: dict[str, Any] | None = None) -> GatewayResult:
    requested = {str(value) for value in (capabilities or [])}
    request = await rpc(user, "create_ai_gateway_request", {
        "p_agent_id": agent_id,
        "p_idempotency_key": idempotency_key,
        "p_requested_capabilities": sorted(requested),
        "p_input_fingerprint": fingerprint_messages(messages),
        "p_metadata": metadata or {},
    })
    request_id = str(request["id"])
    if request.get("idempotency_reused"):
        raise AIGatewayError("AI_IDEMPOTENCY_REPLAY_UNAVAILABLE", "An idempotency key has already been used. A new provider call was not started.", 409)

    models = await select(user, "ai_models", {
        "select": "id,provider_id,model_key,model_identifier,display_name,enabled,context_window_tokens,max_output_tokens,input_cost_per_1m,output_cost_per_1m,capabilities,ai_providers(id,provider_key,adapter,base_url,credential_env_var,enabled,metadata)",
        "enabled": "eq.true",
    })
    policies = await select(user, "ai_routing_policies", {
        "select": "id,policy_key,scope_type,scope_id,priority,enabled,required_capabilities,allowed_model_ids,fallback_model_ids,max_context_tokens,max_output_tokens,max_cost_usd,timeout_ms,max_retries,safety_policy,metadata",
        "enabled": "eq.true",
        "order": "priority.asc",
    })

    policy = _policy_for(str(user.user_id), agent_id, policies)
    if policy and policy.get("required_capabilities"):
        requested.update(str(value) for value in policy["required_capabilities"])

    candidates = _candidate_models(models, policy, requested)
    if not candidates:
        await _update_request(user, request_id, {
            "p_status": "not_configured",
            "p_safety_status": "not_configured",
            "p_error_code": "AI_NO_COMPATIBLE_MODEL",
            "p_error_message": "No enabled model satisfies the requested capabilities.",
        })
        await _record_usage(user, {"request_id": request_id, "event_type": "denied", "agent_id": agent_id, "metadata": {"reason": "no_compatible_model"}})
        raise AIGatewayError("AI_NO_COMPATIBLE_MODEL", "No configured AI model can satisfy this request.", 503)

    estimated_input = _estimate_tokens(messages)
    max_context = int((policy or {}).get("max_context_tokens") or candidates[0]["context_window_tokens"])
    if estimated_input >= max_context:
        await _update_request(user, request_id, {
            "p_status": "denied", "p_safety_status": "denied",
            "p_selected_policy_id": str(policy["id"]) if policy else None,
            "p_error_code": "AI_CONTEXT_BUDGET_EXCEEDED",
            "p_error_message": "Input exceeds the configured context budget.",
        })
        raise AIGatewayError("AI_CONTEXT_BUDGET_EXCEEDED", "Input exceeds the configured context budget.", 413)

    safety = (policy or {}).get("safety_policy") or {}
    if safety.get("mode") == "required" and not safety.get("enabled", False):
        await _update_request(user, request_id, {
            "p_status": "denied", "p_safety_status": "denied",
            "p_selected_policy_id": str(policy["id"]) if policy else None,
            "p_error_code": "AI_SAFETY_POLICY_NOT_CONFIGURED",
            "p_error_message": "The routing policy requires a configured safety gate.",
        })
        raise AIGatewayError("AI_SAFETY_POLICY_NOT_CONFIGURED", "AI safety policy is required but not configured.", 503)

    max_input_chars = safety.get("max_input_chars")
    if safety.get("enabled") and isinstance(max_input_chars, int) and sum(len(message.content) for message in messages) > max_input_chars:
        await _update_request(user, request_id, {
            "p_status": "denied", "p_safety_status": "denied",
            "p_selected_policy_id": str(policy["id"]) if policy else None,
            "p_error_code": "AI_SAFETY_INPUT_LIMIT",
            "p_error_message": "Input exceeds the configured safety input limit.",
        })
        raise AIGatewayError("AI_SAFETY_INPUT_LIMIT", "Input exceeds the configured safety input limit.", 413)

    max_retries = int((policy or {}).get("max_retries", 1))
    timeout_ms = int((policy or {}).get("timeout_ms", 30000))
    max_output = int((policy or {}).get("max_output_tokens") or candidates[0].get("max_output_tokens") or 2048)

    await _update_request(user, request_id, {
        "p_status": "running",
        "p_safety_status": "allowed" if safety.get("enabled") else "not_configured",
        "p_selected_policy_id": str(policy["id"]) if policy else None,
    })

    last_error: AIGatewayError | None = None
    for index, model in enumerate(candidates[: max_retries + 1], start=1):
        provider = model.get("ai_providers") or {}
        try:
            text, input_tokens, output_tokens, latency = await _provider_call(provider, model, messages, max_output, timeout_ms)
            total = (input_tokens or 0) + (output_tokens or 0) if input_tokens is not None or output_tokens is not None else None
            cost = _estimate_cost(model, input_tokens, output_tokens)
            if policy and policy.get("max_cost_usd") is not None and cost is not None and cost > float(policy["max_cost_usd"]):
                raise AIGatewayError("AI_COST_BUDGET_EXCEEDED", "Estimated model cost exceeds the routing policy budget.", 402)

            await _record_attempt(user, {"request_id": request_id, "attempt_no": index, "provider_id": str(provider["id"]), "model_id": str(model["id"]), "status": "completed", "latency_ms": latency, "input_tokens": input_tokens, "output_tokens": output_tokens, "total_tokens": total, "estimated_cost_usd": cost})
            await _update_request(user, request_id, {
                "p_status": "completed", "p_safety_status": "allowed" if safety.get("enabled") else "not_configured",
                "p_selected_model_id": str(model["id"]), "p_selected_policy_id": str(policy["id"]) if policy else None,
                "p_input_tokens": input_tokens, "p_output_tokens": output_tokens, "p_total_tokens": total,
                "p_estimated_cost_usd": cost, "p_latency_ms": latency,
                "p_response_text_hash": hashlib.sha256(text.encode()).hexdigest(),
            })
            await _record_usage(user, {"request_id": request_id, "event_type": "success", "provider_id": str(provider["id"]), "model_id": str(model["id"]), "agent_id": agent_id, "input_tokens": input_tokens, "output_tokens": output_tokens, "total_tokens": total, "estimated_cost_usd": cost, "latency_ms": latency})
            return GatewayResult(text=text, provider_id=str(provider["id"]), model_id=str(model["id"]), model_identifier=str(model["model_identifier"]), input_tokens=input_tokens, output_tokens=output_tokens, total_tokens=total, estimated_cost_usd=cost, latency_ms=latency, attempt_no=index)
        except AIGatewayError as exc:
            last_error = exc
            await _record_attempt(user, {"request_id": request_id, "attempt_no": index, "provider_id": str(provider["id"]), "model_id": str(model["id"]), "status": "timeout" if exc.code == "AI_PROVIDER_TIMEOUT" else ("rate_limited" if exc.code == "AI_PROVIDER_RATE_LIMITED" else "failed"), "error_code": exc.code, "error_message": str(exc)[:1000]})
            if index < min(max_retries + 1, len(candidates)):
                await _record_usage(user, {"request_id": request_id, "event_type": "retry", "provider_id": str(provider["id"]), "model_id": str(model["id"]), "agent_id": agent_id, "metadata": {"attempt_no": index, "error_code": exc.code}})
                continue
            break

    await _update_request(user, request_id, {
        "p_status": "failed", "p_safety_status": "allowed" if safety.get("enabled") else "not_configured",
        "p_selected_policy_id": str(policy["id"]) if policy else None,
        "p_error_code": last_error.code if last_error else "AI_GATEWAY_FAILED",
        "p_error_message": str(last_error)[:1000] if last_error else "All configured model attempts failed.",
    })
    await _record_usage(user, {"request_id": request_id, "event_type": "failure", "agent_id": agent_id, "metadata": {"error_code": last_error.code if last_error else "AI_GATEWAY_FAILED"}})
    raise last_error or AIGatewayError("AI_GATEWAY_FAILED", "All configured model attempts failed.", 502)
