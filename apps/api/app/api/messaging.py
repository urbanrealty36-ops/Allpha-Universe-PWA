from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.ai_gateway import AIGatewayError, GatewayMessage, generate
from app.core.agent_runtime import AgentRuntimeError, execute_command, plan_command
from app.core.supabase_rest import SupabaseRestError, rpc, select

router = APIRouter(prefix="/api/v1/messaging", tags=["Messaging & Social Communication"])
SubjectType = Literal["user", "agent"]


class Subject(BaseModel):
    subject_type: SubjectType = "user"
    subject_id: UUID | None = None


class PreferenceUpdate(BaseModel):
    subject_type: SubjectType = "user"
    subject_id: UUID | None = None
    dm_policy: Literal["open","relationships","approval","invite_only"] = "open"
    allow_human_messages: bool = True
    allow_agent_messages: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)


class DirectCreate(BaseModel):
    source_type: SubjectType = "user"
    source_id: UUID | None = None
    target_type: SubjectType
    target_id: UUID
    message: str | None = Field(default=None, max_length=20000)
    client_message_id: str | None = Field(default=None, max_length=255)


class RequestResponse(BaseModel):
    action: Literal["accept","reject"]


class MessageCreate(BaseModel):
    sender_type: SubjectType = "user"
    sender_id: UUID | None = None
    body: str = Field(min_length=1, max_length=20000)
    reply_to: UUID | None = None
    client_message_id: str | None = Field(default=None, max_length=255)
    metadata: dict[str, Any] = Field(default_factory=dict)


class DeliveryUpdate(BaseModel):
    recipient_type: SubjectType = "user"
    recipient_id: UUID | None = None
    state: Literal["delivered","read"]


class MessageEdit(BaseModel):
    sender_type: SubjectType = "user"
    sender_id: UUID | None = None
    body: str = Field(min_length=1, max_length=20000)


class MessageDelete(BaseModel):
    sender_type: SubjectType = "user"
    sender_id: UUID | None = None


class ReactionCreate(BaseModel):
    reactor_type: SubjectType = "user"
    reactor_id: UUID | None = None
    reaction: str = Field(min_length=1, max_length=64)


class ReportCreate(BaseModel):
    message_id: UUID | None = None
    reason_code: str = Field(min_length=1, max_length=100)
    notes: str | None = Field(default=None, max_length=5000)


def _error(exc: SupabaseRestError) -> HTTPException:
    status = exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
    return HTTPException(status_code=status, detail={"code":"MESSAGING_OPERATION_FAILED","message":exc.message})


async def _subject(user: AuthenticatedUser, kind: SubjectType, subject_id: UUID | None) -> tuple[str,UUID]:
    resolved=subject_id or user.user_id
    if kind=="user" and resolved!=user.user_id:
        raise HTTPException(status_code=403,detail={"code":"MESSAGING_USER_OWNERSHIP_DENIED","message":"The user subject must be the authenticated user."})
    if kind=="agent":
        rows=await select(user,"agents",{"select":"id","id":f"eq.{resolved}","owner_user_id":f"eq.{user.user_id}","status":"neq.archived","limit":"1"})
        if not rows: raise HTTPException(status_code=404,detail={"code":"MESSAGING_AGENT_NOT_FOUND","message":"The Agent is not owned by the authenticated user."})
    return kind,resolved


@router.get("/preferences")
async def preferences(context:dict=Depends(get_auth_context))->dict[str,Any]:
    u=context["user"]
    agents=await select(u,"agents",{"select":"id","owner_user_id":f"eq.{u.user_id}","status":"neq.archived"})
    ids=[str(u.user_id)]+[str(a["id"]) for a in agents]
    return {"data":await select(u,"communication_preferences",{"select":"id,subject_type,subject_id,dm_policy,allow_human_messages,allow_agent_messages,metadata,created_at,updated_at","or":f"(and(subject_type.eq.user,subject_id.eq.{u.user_id}),and(subject_type.eq.agent,subject_id.in.({','.join(ids[1:])})) )" if len(ids)>1 else f"subject_id.eq.{u.user_id}"})}


@router.put("/preferences")
async def update_preferences(payload:PreferenceUpdate,context:dict=Depends(get_auth_context))->Any:
    kind,sid=await _subject(context["user"],payload.subject_type,payload.subject_id)
    try:return await rpc(context["user"],"set_communication_preferences",{"p_subject_type":kind,"p_subject_id":str(sid),"p_dm_policy":payload.dm_policy,"p_allow_human":payload.allow_human_messages,"p_allow_agent":payload.allow_agent_messages,"p_metadata":payload.metadata})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.get("/conversations")
async def conversations(limit:int=Query(default=50,ge=1,le=100),context:dict=Depends(get_auth_context))->dict[str,Any]:
    u=context["user"]
    rows=await select(u,"conversations",{"select":"id,conversation_type,status,created_by_type,created_by_id,title,metadata,created_at,updated_at","order":"updated_at.desc","limit":str(limit)})
    return {"data":rows}


@router.post("/conversations/direct",status_code=201)
async def create_direct(payload:DirectCreate,context:dict=Depends(get_auth_context))->Any:
    source_type,source_id=await _subject(context["user"],payload.source_type,payload.source_id)
    try:return await rpc(context["user"],"create_direct_conversation",{"p_source_type":source_type,"p_source_id":str(source_id),"p_target_type":payload.target_type,"p_target_id":str(payload.target_id),"p_message":payload.message,"p_client_message_id":payload.client_message_id})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.get("/requests")
async def requests(limit:int=Query(default=50,ge=1,le=100),context:dict=Depends(get_auth_context))->dict[str,Any]:
    return {"data":await select(context["user"],"conversation_requests",{"select":"id,conversation_id,requester_type,requester_id,recipient_type,recipient_id,status,requested_at,responded_at,metadata","order":"requested_at.desc","limit":str(limit)})}


@router.post("/requests/{request_id}/respond")
async def respond(request_id:UUID,payload:RequestResponse,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"respond_conversation_request",{"p_request_id":str(request_id),"p_action":payload.action})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.get("/conversations/{conversation_id:uuid}/control")
async def conversation_control(conversation_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_agent_conversation_control", {"p_conversation_id": str(conversation_id)})}
    except SupabaseRestError as exc:
        raise _error(exc) from exc


class TakeoverUpdate(BaseModel):
    active: bool


@router.post("/conversations/{conversation_id:uuid}/takeover")
async def set_conversation_takeover(
    conversation_id: UUID,
    payload: TakeoverUpdate,
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(
            context["user"],
            "set_agent_conversation_takeover",
            {"p_conversation_id": str(conversation_id), "p_active": payload.active},
        )}
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.get("/conversations/{conversation_id:uuid}/participants")
async def participants(conversation_id:UUID,context:dict=Depends(get_auth_context))->dict[str,Any]:
    return {"data":await select(context["user"],"conversation_participants",{"select":"id,conversation_id,subject_type,subject_id,role,status,joined_at,last_read_at,notification_mode,created_at,updated_at","conversation_id":f"eq.{conversation_id}"})}


@router.get("/conversations/{conversation_id:uuid}/messages")
async def messages(conversation_id:UUID,limit:int=Query(default=50,ge=1,le=100),before:UUID|None=None,context:dict=Depends(get_auth_context))->dict[str,Any]:
    filters={"select":"id,conversation_id,sender_type,sender_id,body,message_type,reply_to_message_id,status,client_message_id,metadata,created_at,updated_at","conversation_id":f"eq.{conversation_id}","order":"created_at.desc","limit":str(limit)}
    if before: filters["id"]=f"lt.{before}"
    return {"data":await select(context["user"],"messages",filters)}


@router.post("/conversations/{conversation_id:uuid}/messages",status_code=201)
async def send(conversation_id:UUID,payload:MessageCreate,context:dict=Depends(get_auth_context))->Any:
    kind,sid=await _subject(context["user"],payload.sender_type,payload.sender_id)
    try:return await rpc(context["user"],"send_message",{"p_conversation_id":str(conversation_id),"p_sender_type":kind,"p_sender_id":str(sid),"p_body":payload.body,"p_reply_to":str(payload.reply_to) if payload.reply_to else None,"p_client_message_id":payload.client_message_id,"p_metadata":payload.metadata})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.post("/messages/{message_id}/delivery")
async def delivery(message_id:UUID,payload:DeliveryUpdate,context:dict=Depends(get_auth_context))->Any:
    kind,sid=await _subject(context["user"],payload.recipient_type,payload.recipient_id)
    try:return await rpc(context["user"],"update_message_delivery",{"p_message_id":str(message_id),"p_recipient_type":kind,"p_recipient_id":str(sid),"p_state":payload.state})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.patch("/messages/{message_id}")
async def edit(message_id:UUID,payload:MessageEdit,context:dict=Depends(get_auth_context))->Any:
    kind,sid=await _subject(context["user"],payload.sender_type,payload.sender_id)
    try:return await rpc(context["user"],"edit_message",{"p_message_id":str(message_id),"p_sender_type":kind,"p_sender_id":str(sid),"p_body":payload.body})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.delete("/messages/{message_id}")
async def delete(message_id:UUID,payload:MessageDelete,context:dict=Depends(get_auth_context))->Any:
    kind,sid=await _subject(context["user"],payload.sender_type,payload.sender_id)
    try:return await rpc(context["user"],"delete_message",{"p_message_id":str(message_id),"p_sender_type":kind,"p_sender_id":str(sid)})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.post("/messages/{message_id}/reactions",status_code=201)
async def react(message_id:UUID,payload:ReactionCreate,context:dict=Depends(get_auth_context))->Any:
    kind,sid=await _subject(context["user"],payload.reactor_type,payload.reactor_id)
    try:return await rpc(context["user"],"react_to_message",{"p_message_id":str(message_id),"p_reactor_type":kind,"p_reactor_id":str(sid),"p_reaction":payload.reaction})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.post("/conversations/{conversation_id:uuid}/reports",status_code=201)
async def report(conversation_id:UUID,payload:ReportCreate,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"report_message",{"p_conversation_id":str(conversation_id),"p_message_id":str(payload.message_id) if payload.message_id else None,"p_reason_code":payload.reason_code,"p_notes":payload.notes})
    except SupabaseRestError as exc: raise _error(exc) from exc


class AgentServiceRequest(BaseModel):
    agent_id: UUID
    skill_name: str = Field(min_length=1, max_length=200)
    prompt: str = Field(min_length=1, max_length=20000)
    credit_cost: int | None = Field(default=None, ge=1, le=10000)
    conversation_id: UUID | None = None
    source_content_id: UUID | None = None
    source_context: dict[str, Any] = Field(default_factory=dict)
    mode: Literal["answer","generate_content"] = "answer"
    idempotency_key: str | None = Field(default=None, max_length=255)


@router.get("/agent-services")
async def agent_services(skill: str | None = None, limit: int = Query(default=30, ge=1, le=100), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    try:
        data = await rpc(context["user"], "list_public_agent_services", {"p_skill_name": skill, "p_limit": limit})
    except SupabaseRestError as exc:
        raise _error(exc) from exc
    return {"data": data}


@router.get("/credits")
async def credits(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    try:
        balance = await rpc(context["user"], "get_ai_credit_balance", {})
        entries = await select(context["user"], "ai_credit_ledger", {
            "select": "id,entry_type,amount,status,source_type,source_id,counterparty_user_id,agent_id,service_request_id,metadata,created_at,posted_at",
            "order": "created_at.desc",
            "limit": "50",
        })
        return {"data": {"balance": int(balance or 0), "ledger": entries}}
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/agent-services/{service_request_id}/resume")
async def resume_agent_service(service_request_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    rows = await select(user, "agent_service_requests", {
        "select": "id,status,conversation_id,skill_name,service_type,credit_cost,source_content_id,agent_id,generated_content_id",
        "id": f"eq.{service_request_id}", "limit": "1"
    })
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "SERVICE_REQUEST_NOT_FOUND", "message": "Service request was not found."})
    request = rows[0]
    if request["status"] == "completed":
        return {"data": request}
    commands = await select(user, "agent_commands", {
        "select": "id,status,service_request_id",
        "service_request_id": f"eq.{service_request_id}",
        "order": "created_at.desc",
        "limit": "1"
    })
    if not commands:
        raise HTTPException(status_code=409, detail={"code": "SERVICE_COMMAND_NOT_FOUND", "message": "The Agent Runtime command does not exist yet."})
    command_id = UUID(str(commands[0]["id"]))
    try:
        execution = await execute_command(user, command_id)
        if execution.get("status") == "waiting_approval":
            return {"data": {"request_id": str(service_request_id), "command_id": str(command_id), **execution}}
        if execution.get("status") != "completed":
            raise AgentRuntimeError("AGENT_SERVICE_RUNTIME_NOT_COMPLETED", "Agent Runtime did not complete the service request.", 409)
        steps = await select(user, "agent_task_steps", {
            "select": "id,tool_key,status,result",
            "command_id": f"eq.{command_id}",
            "status": "eq.completed",
            "order": "sequence_no.asc"
        })
        gateway_request_id = next((str((step.get("result") or {}).get("request_id")) for step in steps if isinstance(step.get("result"), dict) and (step.get("result") or {}).get("request_id")), None)
        result_text = next((str((step.get("result") or {}).get("text")) for step in steps if isinstance(step.get("result"), dict) and (step.get("result") or {}).get("text")), None)
        if not result_text:
            raise AgentRuntimeError("AGENT_SERVICE_EMPTY_RESULT", "Agent Runtime completed without a textual result.", 502)
        message = await rpc(user, "append_agent_service_message", {
            "p_service_request_id": str(service_request_id),
            "p_conversation_id": str(request["conversation_id"]),
            "p_body": result_text,
            "p_metadata": {"agent_service_request_id": str(service_request_id), "skill_name": request["skill_name"], "agent_runtime_command_id": str(command_id), "resumed_after_approval": True}
        })
        settlement = await rpc(user, "complete_agent_service_request", {
            "p_request_id": str(service_request_id),
            "p_ai_gateway_request_id": gateway_request_id,
            "p_result_message_id": message.get("id") if isinstance(message, dict) else None,
            "p_metadata": {
                "agent_runtime_command_id": str(command_id),
                "resumed_after_approval": True,
                "generated_content": {
                    "enabled": request.get("service_type") == "generate_content",
                    "content_type": "article",
                    "title": f"AI-generated {request['skill_name']}",
                    "body": result_text,
                    "excerpt": result_text[:500],
                    "visibility": "public",
                    "metadata": {
                        "mode": "generate_content",
                        "resumed_after_approval": True,
                    },
                } if request.get("service_type") == "generate_content" else {"enabled": False},
            }
        })
        return {"data": {"request_id": str(service_request_id), "command_id": str(command_id), "status": "completed", "message": message, "generation": {"text": result_text}, "settlement": settlement,
            "content": {"id": settlement.get("generated_content_id"), "status": "draft"} if request.get("service_type") == "generate_content" and settlement.get("generated_content_id") else None,
        }}
    except (SupabaseRestError, AIGatewayError, AgentRuntimeError) as exc:
        try:
            await rpc(user, "release_agent_service_request", {"p_request_id": str(service_request_id), "p_reason": getattr(exc, "code", "agent_service_resume_failed")})
        except Exception:
            pass
        if isinstance(exc, SupabaseRestError):
            raise _error(exc) from exc
        raise HTTPException(status_code=getattr(exc, "status_code", 502), detail={"code": getattr(exc, "code", "AGENT_SERVICE_RESUME_FAILED"), "message": str(exc)}) from exc


@router.post("/agent-services/generate", status_code=201)
async def generate_agent_service(payload: AgentServiceRequest, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    services = await rpc(user, "list_public_agent_services", {"p_skill_name": payload.skill_name, "p_limit": 100})
    service = next((row for row in (services or []) if str(row.get("agent_id")) == str(payload.agent_id)), None)
    if not service:
        raise HTTPException(status_code=404, detail={"code": "AGENT_SKILL_NOT_AVAILABLE", "message": "The selected Agent does not expose the requested Skill."})
    configuration = service.get("skill_configuration") or {}
    configured_cost = configuration.get("credit_cost") if isinstance(configuration, dict) else None
    credit_cost = int(configured_cost) if isinstance(configured_cost, int) and configured_cost > 0 else 1
    request_id: str | None = None
    try:
        reservation = await rpc(user, "reserve_agent_service_request", {
            "p_agent_id": str(payload.agent_id),
            "p_skill_name": payload.skill_name,
            "p_prompt": payload.prompt,
            "p_credit_cost": credit_cost,
            "p_idempotency_key": payload.idempotency_key,
            "p_conversation_id": str(payload.conversation_id) if payload.conversation_id else None,
            "p_source_content_id": str(payload.source_content_id) if payload.source_content_id else None,
            "p_source_context": payload.source_context | {
                "skill_name": payload.skill_name,
                "mode": payload.mode,
                "agent_owner_user_id": str(service.get("owner_user_id")),
            },
        })
        request_id = str(reservation["id"])
        if reservation.get("reused"):
            existing = await select(user, "agent_service_requests", {
                "select": "id,status,conversation_id,result_message_id,generated_content_id,credit_cost,service_type,skill_name,agent_id,agent_owner_user_id",
                "id": f"eq.{request_id}", "limit": "1"
            })
            return {"data": {"request": existing[0] if existing else reservation, "reused": True}}

        conversation_id = payload.conversation_id
        if not conversation_id:
            conversation = await rpc(user, "create_contextual_direct_conversation", {
                "p_target_type": "agent",
                "p_target_id": str(payload.agent_id),
                "p_message": None,
                "p_context_type": "content" if payload.source_content_id else "agent_service",
                "p_context_id": str(payload.source_content_id) if payload.source_content_id else request_id,
                "p_context": payload.source_context | {
                    "service_request_id": request_id,
                    "skill_name": payload.skill_name,
                    "mode": payload.mode,
                },
            })
            conversation_id = UUID(str(conversation["conversation_id"]))

        service_context = await rpc(user, "get_agent_service_context", {"p_service_request_id": request_id, "p_limit": 8})
        system_scope = (
            f"You are the Allpha AI Agent {service.get('agent_name')}. "
            f"Your published Skill for this service is {payload.skill_name}. "
            "Stay within this Skill and the Agent's configured capabilities and policy. "
            "Do not claim credentials, actions, facts, tools, permissions, purchases, or authority that were not actually provided. "
            "For health/medical topics, provide general educational information only and recommend qualified professional care "
            "for diagnosis, emergencies, prescriptions, or individualized treatment."
        )
        user_prompt = payload.prompt if payload.mode == "answer" else (
            "Generate the requested Content in a usable format while staying within the published Agent Skill and source context.\n\n"
            f"Source context: {payload.source_context}\n\nREQUEST:\n{payload.prompt}"
        )
        command_text = (
            f"Agent Service request. Published Skill: {payload.skill_name}. Mode: {payload.mode}. "
            "Use the canonical ai.generate tool only. "
            "The final output must be the direct answer/generation requested by the Human. "
            f"SYSTEM SCOPE:\n{system_scope}\n\nAUTHORIZED AGENT SERVICE CONTEXT (public knowledge + explicitly service-visible memory only):\n{service_context}\n\nUSER REQUEST:\n{user_prompt}"
        )
        command = await rpc(user, "create_agent_service_command", {
            "p_service_request_id": request_id,
            "p_command_text": command_text,
            "p_requested_capabilities": ["ai.generate"],
            "p_idempotency_key": f"runtime:{request_id}",
        })
        command_id = UUID(str(command["id"]))

        planned = await plan_command(user, command_id)
        if planned.get("status") == "waiting_approval":
            return {"data": {
                "request_id": request_id,
                "conversation_id": str(conversation_id),
                "command_id": str(command_id),
                "status": "waiting_approval",
                "approval_id": planned.get("approval_id"),
                "credit_cost": credit_cost,
                "message": "The Agent Owner's policy requires approval before this service can execute.",
            }}

        execution = await execute_command(user, command_id)
        if execution.get("status") == "waiting_approval":
            return {"data": {
                "request_id": request_id,
                "conversation_id": str(conversation_id),
                "command_id": str(command_id),
                "status": "waiting_approval",
                "approval_id": execution.get("approval_id"),
                "credit_cost": credit_cost,
            }}
        if execution.get("status") != "completed":
            raise AgentRuntimeError("AGENT_SERVICE_RUNTIME_NOT_COMPLETED", "Agent Runtime did not complete the service request.", 409)

        steps = await select(user, "agent_task_steps", {
            "select": "id,tool_key,status,result,error_code,error_message,completed_at",
            "command_id": f"eq.{command_id}",
            "status": "eq.completed",
            "order": "sequence_no.asc",
        })
        result_text = None
        gateway_request_id = None
        for step in steps:
            candidate = (step.get("result") or {}).get("text") if isinstance(step.get("result"), dict) else None
            if candidate:
                result_text = str(candidate)
                gateway_request_id = (step.get("result") or {}).get("request_id") if isinstance(step.get("result"), dict) else gateway_request_id
        if not result_text:
            raise AgentRuntimeError("AGENT_SERVICE_EMPTY_RESULT", "Agent Runtime completed without a textual result.", 502)

        message = await rpc(user, "append_agent_service_message", {
            "p_service_request_id": request_id,
            "p_conversation_id": str(conversation_id),
            "p_body": result_text,
            "p_metadata": {
                "agent_service_request_id": request_id,
                "skill_name": payload.skill_name,
                "mode": payload.mode,
                "agent_runtime_command_id": str(command_id),
                "source_content_id": str(payload.source_content_id) if payload.source_content_id else None,
            },
        })
        settlement = await rpc(user, "complete_agent_service_request", {
            "p_request_id": request_id,
            "p_ai_gateway_request_id": gateway_request_id,
            "p_result_message_id": message.get("id") if isinstance(message, dict) else None,
            "p_metadata": {
                "mode": payload.mode,
                "agent_runtime_command_id": str(command_id),
                "generated_content": {
                    "enabled": payload.mode == "generate_content",
                    "content_type": "article",
                    "title": f"AI-generated {payload.skill_name}",
                    "body": result_text,
                    "excerpt": result_text[:500],
                    "visibility": "public",
                    "metadata": {
                        "mode": payload.mode,
                        "source_content_id": str(payload.source_content_id) if payload.source_content_id else None,
                    },
                } if payload.mode == "generate_content" else {"enabled": False},
            },
        })
        return {"data": {
            "request_id": request_id,
            "conversation_id": str(conversation_id),
            "command_id": str(command_id),
            "status": "completed",
            "message": message,
            "generation": {"text": result_text},
            "settlement": settlement,
            "content": {"id": settlement.get("generated_content_id"), "status": "draft"} if payload.mode == "generate_content" and settlement.get("generated_content_id") else None,
        }}
    except (SupabaseRestError, AIGatewayError, AgentRuntimeError) as exc:
        if request_id:
            try:
                await rpc(user, "release_agent_service_request", {
                    "p_request_id": request_id,
                    "p_reason": getattr(exc, "code", "agent_service_failed"),
                })
            except Exception:
                pass
        if isinstance(exc, SupabaseRestError):
            raise _error(exc) from exc
        raise HTTPException(status_code=getattr(exc, "status_code", 502), detail={
            "code": getattr(exc, "code", "AGENT_SERVICE_FAILED"),
            "message": str(exc),
        }) from exc

