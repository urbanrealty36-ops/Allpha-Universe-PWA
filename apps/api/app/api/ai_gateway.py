import os
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.ai_gateway import AIGatewayError, GatewayMessage, generate
from app.core.supabase_rest import select
from app.core.security import SecurityViolation, require_safe_prompt
from app.core.security import SecurityViolation, require_safe_prompt

router = APIRouter(prefix="/api/v1/ai", tags=["AI Gateway & Model Router"])


class MessageInput(BaseModel):
    role: str = Field(pattern="^(system|user|assistant)$")
    content: str = Field(min_length=1, max_length=200000)


class GenerateRequest(BaseModel):
    messages: list[MessageInput] = Field(min_length=1, max_length=100)
    agent_id: UUID | None = None
    capabilities: list[str] = Field(default_factory=list, max_length=32)
    idempotency_key: str | None = Field(default=None, max_length=255)
    metadata: dict[str, Any] = Field(default_factory=dict)


def _error(exc: AIGatewayError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)})


@router.get("/config")
async def get_config(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    return {"data": await select(context["user"], "ai_models", {
        "select": "id,provider_id,model_key,model_identifier,display_name,context_window_tokens,max_output_tokens,capabilities,ai_providers(id,provider_key,display_name,adapter)",
        "enabled": "eq.true",
    })}


@router.get("/health")
async def get_health(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    """Return non-secret AI Gateway readiness diagnostics for the authenticated caller."""
    providers = await select(context["user"], "ai_providers", {
        "select": "id,provider_key,display_name,adapter,base_url,credential_env_var,enabled,metadata",
        "enabled": "eq.true",
    })
    models = await select(context["user"], "ai_models", {
        "select": "id,provider_id,model_key,model_identifier,display_name,enabled,context_window_tokens,max_output_tokens,capabilities,ai_providers(id,provider_key,enabled)",
        "enabled": "eq.true",
    })
    policies = await select(context["user"], "ai_routing_policies", {
        "select": "id,policy_key,scope_type,scope_id,priority,enabled,max_context_tokens,max_output_tokens,max_cost_usd,timeout_ms,max_retries,safety_policy",
        "enabled": "eq.true",
        "order": "priority.asc",
    })

    provider_status = []
    for provider in providers:
        env_name = str(provider.get("credential_env_var") or "").strip()
        configured = bool(env_name and os.getenv(env_name, "").strip())
        provider_status.append({
            "id": provider.get("id"),
            "provider_key": provider.get("provider_key"),
            "display_name": provider.get("display_name"),
            "adapter": provider.get("adapter"),
            "enabled": bool(provider.get("enabled")),
            "credential_env_var": env_name or None,
            "credential_configured": configured,
        })

    enabled_models = [
        model for model in models
        if model.get("enabled") and isinstance(model.get("ai_providers"), dict) and model["ai_providers"].get("enabled")
    ]
    credential_ready = any(item["credential_configured"] for item in provider_status)
    model_ready = bool(enabled_models)
    routing_ready = bool(policies)
    return {
        "data": {
            "status": "ready" if credential_ready and model_ready and routing_ready else "not_ready",
            "provider_count": len(provider_status),
            "enabled_model_count": len(enabled_models),
            "routing_policy_count": len(policies),
            "credential_ready": credential_ready,
            "model_ready": model_ready,
            "routing_ready": routing_ready,
            "providers": provider_status,
            "models": [
                {
                    "id": model.get("id"),
                    "provider_id": model.get("provider_id"),
                    "model_key": model.get("model_key"),
                    "model_identifier": model.get("model_identifier"),
                    "display_name": model.get("display_name"),
                    "context_window_tokens": model.get("context_window_tokens"),
                    "max_output_tokens": model.get("max_output_tokens"),
                    "capabilities": model.get("capabilities") or [],
                }
                for model in enabled_models
            ],
            "routing_policies": [
                {
                    "id": policy.get("id"),
                    "policy_key": policy.get("policy_key"),
                    "scope_type": policy.get("scope_type"),
                    "priority": policy.get("priority"),
                    "max_context_tokens": policy.get("max_context_tokens"),
                    "max_output_tokens": policy.get("max_output_tokens"),
                    "max_cost_usd": policy.get("max_cost_usd"),
                    "timeout_ms": policy.get("timeout_ms"),
                    "max_retries": policy.get("max_retries"),
                    "safety_policy": policy.get("safety_policy") or {},
                }
                for policy in policies
            ],
        }
    }


@router.get("/usage")
async def get_usage(limit: int = Query(default=50, ge=1, le=200), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    return {"data": await select(context["user"], "ai_usage_events", {
        "select": "id,request_id,agent_id,provider_id,model_id,event_type,input_tokens,output_tokens,total_tokens,estimated_cost_usd,latency_ms,metadata,created_at",
        "order": "created_at.desc",
        "limit": str(limit),
    })}


@router.get("/requests")
async def get_requests(limit: int = Query(default=50, ge=1, le=200), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    return {"data": await select(context["user"], "ai_gateway_requests", {
        "select": "id,agent_id,requested_capabilities,selected_model_id,selected_policy_id,status,safety_status,input_tokens,output_tokens,total_tokens,estimated_cost_usd,latency_ms,error_code,metadata,created_at,completed_at",
        "order": "created_at.desc",
        "limit": str(limit),
    })}


@router.post("/generate")
async def generate_text(payload: GenerateRequest, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    for message in payload.messages:
        if message.role == "user":
            try:
                require_safe_prompt(message.content)
            except SecurityViolation as exc:
                raise HTTPException(status_code=400, detail={"code": exc.code, "message": "Prompt rejected by Allpha security policy."}) from exc
    try:
        result = await generate(
            context["user"],
            [GatewayMessage(role=message.role, content=message.content) for message in payload.messages],
            agent_id=str(payload.agent_id) if payload.agent_id else None,
            capabilities=payload.capabilities,
            idempotency_key=payload.idempotency_key,
            metadata=payload.metadata,
        )
    except AIGatewayError as exc:
        raise _error(exc) from exc
    return {"data": {
        "text": result.text,
        "provider_id": result.provider_id,
        "model_id": result.model_id,
        "model_identifier": result.model_identifier,
        "input_tokens": result.input_tokens,
        "output_tokens": result.output_tokens,
        "total_tokens": result.total_tokens,
        "estimated_cost_usd": result.estimated_cost_usd,
        "latency_ms": result.latency_ms,
        "attempt_no": result.attempt_no,
    }}
