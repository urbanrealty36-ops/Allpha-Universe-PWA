from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
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
