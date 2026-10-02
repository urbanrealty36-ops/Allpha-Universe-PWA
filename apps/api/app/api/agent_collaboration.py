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


class NegotiationMessage(BaseModel):
    sender_agent_id: UUID
    body: str = Field(min_length=1, max_length=20000)
    reply_to: UUID | None = None
    client_message_id: str | None = Field(default=None, max_length=255)

@router.get("/negotiations")
async def negotiations(limit:int=Query(50,ge=1,le=100),context:dict=Depends(get_auth_context))->dict[str,Any]:
    return {"data":await select(context["user"],"agent_collaboration_negotiations",{"select":"id,collaboration_request_id,conversation_id,state,negotiation_version,opened_at,closed_at,created_at,updated_at","order":"updated_at.desc","limit":str(limit)})}

@router.get("/negotiations/{negotiation_id}/events")
async def negotiation_events(negotiation_id:UUID,limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context))->dict[str,Any]:
    return {"data":await select(context["user"],"agent_collaboration_negotiation_events",{"select":"id,negotiation_id,actor_agent_id,event_type,message_id,payload,created_at","negotiation_id":f"eq.{negotiation_id}","order":"created_at.asc","limit":str(limit)})}

@router.post("/negotiations/{negotiation_id}/messages",status_code=201)
async def negotiation_message(negotiation_id:UUID,payload:NegotiationMessage,context:dict=Depends(get_auth_context))->Any:
    try:
        return await rpc(context["user"],"send_agent_collaboration_negotiation_message",{"p_negotiation_id":str(negotiation_id),"p_sender_agent_id":str(payload.sender_agent_id),"p_body":payload.body,"p_reply_to":str(payload.reply_to) if payload.reply_to else None,"p_client_message_id":payload.client_message_id})
    except SupabaseRestError as exc:
        status=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
        raise HTTPException(status_code=status,detail={"code":"NEGOTIATION_MESSAGE_FAILED","message":exc.message}) from exc


class AgreementCreate(BaseModel):
    negotiation_id: UUID
    purpose: str = Field(min_length=1, max_length=5000)
    requested_capabilities: list[str] = Field(default_factory=list, max_length=32)
    agreed_scope: dict[str, Any] = Field(default_factory=dict)
    constraints: dict[str, Any] = Field(default_factory=dict)
    terms: dict[str, Any] = Field(default_factory=dict)
    expires_at: str | None = None


class AgreementApprovalDecision(BaseModel):
    decision: str = Field(pattern="^(approved|rejected)$")
    reason: str | None = Field(default=None, max_length=2000)


class AgreementCancel(BaseModel):
    reason: str | None = Field(default=None, max_length=2000)


@router.get("/agreements")
async def agreements(limit:int=Query(50,ge=1,le=100),context:dict=Depends(get_auth_context))->dict[str,Any]:
    return {"data":await select(context["user"],"agent_collaboration_agreements",{
        "select":"id,collaboration_request_id,negotiation_id,requester_agent_id,target_agent_id,requester_owner_user_id,target_owner_user_id,version,state,purpose,requested_capabilities,agreed_scope,constraints,terms,requester_policy_version,target_policy_version,risk_level,expires_at,created_by_user_id,created_at,updated_at,approved_at,rejected_at,closed_at",
        "order":"updated_at.desc","limit":str(limit)
    })}


@router.get("/agreements/{agreement_id}")
async def agreement(agreement_id:UUID,context:dict=Depends(get_auth_context))->dict[str,Any]:
    rows=await select(context["user"],"agent_collaboration_agreements",{"select":"*","id":f"eq.{agreement_id}","limit":"1"})
    if not rows:
        raise HTTPException(status_code=404,detail={"code":"AGREEMENT_NOT_FOUND","message":"Agreement was not found."})
    return {"data":rows[0]}


@router.get("/agreements/{agreement_id}/events")
async def agreement_events(agreement_id:UUID,limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context))->dict[str,Any]:
    return {"data":await select(context["user"],"agent_collaboration_agreement_events",{
        "select":"id,agreement_id,actor_user_id,actor_agent_id,event_type,approval_request_id,risk_assessment_id,payload,created_at",
        "agreement_id":f"eq.{agreement_id}","order":"created_at.asc","limit":str(limit)
    })}


@router.post("/agreements",status_code=201)
async def create_agreement(payload:AgreementCreate,context:dict=Depends(get_auth_context))->Any:
    try:
        return await rpc(context["user"],"create_agent_collaboration_agreement",{
            "p_negotiation_id":str(payload.negotiation_id),
            "p_purpose":payload.purpose,
            "p_requested_capabilities":payload.requested_capabilities,
            "p_agreed_scope":payload.agreed_scope,
            "p_constraints":payload.constraints,
            "p_terms":payload.terms,
            "p_expires_at":payload.expires_at,
        })
    except SupabaseRestError as exc:
        status=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
        raise HTTPException(status_code=status,detail={"code":"AGREEMENT_CREATE_FAILED","message":exc.message}) from exc


@router.post("/agreements/{agreement_id}/approval")
async def decide_agreement_approval(agreement_id:UUID,payload:AgreementApprovalDecision,context:dict=Depends(get_auth_context))->Any:
    try:
        return await rpc(context["user"],"decide_agent_collaboration_agreement_approval",{
            "p_agreement_id":str(agreement_id),"p_decision":payload.decision,"p_reason":payload.reason
        })
    except SupabaseRestError as exc:
        status=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
        raise HTTPException(status_code=status,detail={"code":"AGREEMENT_APPROVAL_FAILED","message":exc.message}) from exc


@router.post("/agreements/{agreement_id}/cancel")
async def cancel_agreement(agreement_id:UUID,payload:AgreementCancel,context:dict=Depends(get_auth_context))->Any:
    try:
        return await rpc(context["user"],"cancel_agent_collaboration_agreement",{
            "p_agreement_id":str(agreement_id),"p_reason":payload.reason
        })
    except SupabaseRestError as exc:
        status=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
        raise HTTPException(status_code=status,detail={"code":"AGREEMENT_CANCEL_FAILED","message":exc.message}) from exc
