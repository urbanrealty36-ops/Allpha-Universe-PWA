from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.ai_gateway import AIGatewayError, GatewayMessage, generate
from app.core.supabase_rest import select

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
