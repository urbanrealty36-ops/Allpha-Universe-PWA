from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, rpc, select

router = APIRouter(prefix="/api/v1/agent-collaboration", tags=["AI-to-AI Collaboration"])

class RequestCreate(BaseModel):
    requester_agent_id: UUID
    target_agent_id: UUID
    purpose: str = Field(min_length=1, max_length=5000)
    requested_capabilities: list[str] = Field(default_factory=list, max_length=20)
    proposed_scope: dict[str, Any] = Field(default_factory=dict)
    expires_at: str | None = None

class RequestDecision(BaseModel):
    decision: str = Field(pattern="^(accepted|rejected|cancelled)$")

@router.get("/discover")
async def discover(capability: str | None = None, q: str | None = None, limit: int = Query(50, ge=1, le=100), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    try:
        rows = await rpc(context["user"], "discover_collaboration_agents", {"p_capability": capability, "p_query": q, "p_limit": limit})
        return {"data": rows if isinstance(rows, list) else rows.get("data", rows)}
    except SupabaseRestError as exc:
        raise HTTPException(status_code=exc.status_code if exc.status_code in {400,401,403,422} else 500, detail={"code":"COLLABORATION_DISCOVERY_FAILED","message":exc.message}) from exc

@router.get("/requests")
async def requests(status: str | None = None, limit: int = Query(50, ge=1, le=100), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    filters={"select":"id,requester_agent_id,target_agent_id,purpose,requested_capabilities,proposed_scope,status,expires_at,responded_at,created_at,updated_at","order":"created_at.desc","limit":str(limit)}
    if status: filters["status"]=f"eq.{status}"
    return {"data":await select(context["user"],"agent_collaboration_requests",filters)}

@router.post("/requests", status_code=201)
async def create_request(payload: RequestCreate, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"],"create_agent_collaboration_request",{
            "p_requester_agent_id":str(payload.requester_agent_id),
            "p_target_agent_id":str(payload.target_agent_id),
            "p_purpose":payload.purpose,
            "p_requested_capabilities":payload.requested_capabilities,
            "p_proposed_scope":payload.proposed_scope,
            "p_expires_at":payload.expires_at,
        })
    except SupabaseRestError as exc:
        raise HTTPException(status_code=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500, detail={"code":"COLLABORATION_REQUEST_FAILED","message":exc.message}) from exc

@router.post("/requests/{request_id}/decision")
async def decide(request_id: UUID, payload: RequestDecision, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"],"respond_agent_collaboration_request",{"p_request_id":str(request_id),"p_decision":payload.decision})
    except SupabaseRestError as exc:
        raise HTTPException(status_code=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500, detail={"code":"COLLABORATION_REQUEST_DECISION_FAILED","message":exc.message}) from exc
