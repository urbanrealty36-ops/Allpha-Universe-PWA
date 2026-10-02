from datetime import datetime, timezone
from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, insert, select, update, rpc
from app.core.agent_runtime import AgentRuntimeError, create_command, plan_command, execute_command, run_live_conversation_turn

router = APIRouter(prefix="/api/v1/live", tags=["Live Stories & Streaming"])

Source = Literal["creator", "platform"]
SessionSource = Literal["story", "live", "event", "booth", "agent_world"]
SessionStatus = Literal["draft", "scheduled", "live", "ended", "cancelled"]
Visibility = Literal["public", "followers", "community", "enterprise", "private"]


def err(e: SupabaseRestError, code: str) -> HTTPException:
    return HTTPException(
        status_code=e.status_code if e.status_code in {400, 401, 403, 404, 409, 422} else 500,
        detail={"code": code, "message": e.message},
    )


class LiveSessionCreate(BaseModel):
    experience_template_id: UUID
    experience_template_version_id: UUID
    source_type: SessionSource = "live"
    title: str = Field(min_length=1, max_length=200)
    visibility: Visibility = "public"
    scheduled_at: datetime | None = None
    district_id: UUID | None = None
    booth_id: UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class LiveSessionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    visibility: Visibility | None = None
    scheduled_at: datetime | None = None
    metadata: dict[str, Any] | None = None

def _future_schedule(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        raise HTTPException(status_code=422, detail={"code": "LIVE_SCHEDULE_TIMEZONE_REQUIRED"})
    normalized = value.astimezone(timezone.utc)
    if normalized <= datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail={"code": "LIVE_SCHEDULE_TIME_MUST_BE_FUTURE"})
    return normalized.isoformat()


@router.get("/templates")
async def live_templates(
    category: str | None = None,
    source: Source | None = None,
    limit: int = Query(100, ge=1, le=100),
    context: dict = Depends(get_auth_context),
):
    q = {"select": "*", "order": "catalog_order.asc.nullslast,updated_at.desc", "limit": str(limit)}
    q["status"] = "eq.published"
    if category:
        q["category"] = f"eq.{category}"
    if source:
        q["source"] = f"eq.{source}"
    return {"data": await select(context["user"], "live_experience_templates", q)}


@router.get("/templates/{template_id}/versions")
async def live_template_versions(
    template_id: UUID,
    context: dict = Depends(get_auth_context),
):
    rows = await select(
        context["user"],
        "live_experience_template_versions",
        {
            "select": "*",
            "template_id": f"eq.{template_id}",
            "status": "eq.published",
            "moderation_status": "eq.approved",
            "order": "version.desc",
        },
    )
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "LIVE_TEMPLATE_NOT_FOUND"})
    return {"data": rows}


@router.get("/sessions")
async def live_sessions(
    status: SessionStatus | None = None,
    limit: int = Query(50, ge=1, le=100),
    context: dict = Depends(get_auth_context),
):
    q = {
        "select": "*,live_experience_templates(name,slug,category),live_experience_template_versions(version)",
        "order": "updated_at.desc",
        "limit": str(limit),
        "host_user_id": f"eq.{context['user'].user_id}",
    }
    if status:
        q["status"] = f"eq.{status}"
    return {"data": await select(context["user"], "live_sessions", q)}


@router.post("/sessions", status_code=201)
async def create_live_session(
    payload: LiveSessionCreate,
    context: dict = Depends(get_auth_context),
):
    scheduled_at = _future_schedule(payload.scheduled_at)

    values = {
        "host_user_id": str(context["user"].user_id),
        "experience_template_id": str(payload.experience_template_id),
        "experience_template_version_id": str(payload.experience_template_version_id),
        "source_type": payload.source_type,
        "title": payload.title.strip(),
        "status": "draft",
        "visibility": payload.visibility,
        "scheduled_at": scheduled_at,
        "district_id": str(payload.district_id) if payload.district_id else None,
        "booth_id": str(payload.booth_id) if payload.booth_id else None,
        "metadata": payload.metadata,
    }
    try:
        rows = await insert(context["user"], "live_sessions", values)
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_SESSION_CREATE_FAILED") from exc
    return {"data": rows[0] if rows else None}



class LiveCollaborationCreate(BaseModel):
    agent_id: UUID
    mode: Literal["cohost", "interactive", "sales", "podcast", "talkshow", "presentation", "moderation"] = "cohost"
    required_capability: str = Field(min_length=1, max_length=200)
    authority_policy: dict[str, Any] = Field(default_factory=dict)
    interaction_policy: dict[str, Any] = Field(default_factory=dict)


class LiveCollaborationConsent(BaseModel):
    approved: bool

class LiveConversationMessage(BaseModel):
    content: str = Field(min_length=1, max_length=20000)


class LiveAudienceInteraction(BaseModel):
    viewer_id: UUID
    interaction_type: Literal["reaction", "question", "raise_hand", "poll_response", "share", "report"]
    payload: dict[str, Any] = Field(default_factory=dict)




@router.get("/sessions/{session_id}/collaborations")
async def list_live_collaborations(session_id: UUID, context: dict = Depends(get_auth_context)):
    rows = await select(
        context["user"], "live_agent_collaborations",
        {"select": "*", "live_session_id": f"eq.{session_id}", "order": "created_at.desc"},
    )
    return {"data": rows}


@router.post("/sessions/{session_id}/collaborations", status_code=201)
async def request_live_collaboration(
    session_id: UUID,
    payload: LiveCollaborationCreate,
    context: dict = Depends(get_auth_context),
):
    try:
        result = await rpc(
            context["user"],
            "request_live_agent_collaboration",
            {
                "p_live_session_id": str(session_id),
                "p_agent_id": str(payload.agent_id),
                "p_mode": payload.mode,
                "p_required_capability": payload.required_capability.strip(),
                "p_authority_policy": payload.authority_policy,
                "p_interaction_policy": payload.interaction_policy,
            },
        )
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_COLLAB_REQUEST_FAILED") from exc


@router.post("/collaborations/{collaboration_id}/consent")
async def consent_live_collaboration(
    collaboration_id: UUID,
    payload: LiveCollaborationConsent,
    context: dict = Depends(get_auth_context),
):
    try:
        result = await rpc(
            context["user"],
            "set_live_agent_consent",
            {"p_collaboration_id": str(collaboration_id), "p_approved": payload.approved},
        )
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_COLLAB_CONSENT_FAILED") from exc


@router.post("/collaborations/{collaboration_id}/activate")
async def activate_live_collaboration(collaboration_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(
            context["user"], "activate_live_agent_collaboration",
            {"p_collaboration_id": str(collaboration_id)},
        )
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_COLLAB_ACTIVATION_FAILED") from exc


@router.post("/collaborations/{collaboration_id}/pause")
async def pause_live_collaboration(collaboration_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(
            context["user"], "transition_live_agent_collaboration",
            {"p_collaboration_id": str(collaboration_id), "p_target": "paused"},
        )
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_COLLAB_PAUSE_FAILED") from exc


@router.post("/collaborations/{collaboration_id}/end")
async def end_live_collaboration(collaboration_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(
            context["user"], "transition_live_agent_collaboration",
            {"p_collaboration_id": str(collaboration_id), "p_target": "ended"},
        )
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_COLLAB_END_FAILED") from exc
\n
class LiveRuntimeCommandCreate(BaseModel):
    command: str = Field(min_length=1, max_length=20000)
    capabilities: list[str] = Field(default_factory=lambda: ["ai.generate"], max_length=32)
    idempotency_key: str | None = Field(default=None, max_length=255)


@router.post("/collaborations/{collaboration_id}/runtime/commands", status_code=201)
async def create_live_runtime_command(
    collaboration_id: UUID,
    payload: LiveRuntimeCommandCreate,
    context: dict = Depends(get_auth_context),
):
    try:
        result = await rpc(context["user"], "create_live_agent_command", {
            "p_collaboration_id": str(collaboration_id),
            "p_command_text": payload.command.strip(),
            "p_requested_capabilities": payload.capabilities,
            "p_idempotency_key": payload.idempotency_key,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_RUNTIME_COMMAND_CREATE_FAILED") from exc


@router.post("/collaborations/{collaboration_id}/runtime/commands/{command_id}/plan")
async def plan_live_runtime_command(
    collaboration_id: UUID,
    command_id: UUID,
    context: dict = Depends(get_auth_context),
):
    try:
        rows = await select(context["user"], "agent_commands", {
            "select": "id,live_collaboration_id,owner_user_id",
            "id": f"eq.{command_id}",
            "live_collaboration_id": f"eq.{collaboration_id}",
            "owner_user_id": f"eq.{context['user'].user_id}",
            "limit": "1",
        })
        if not rows:
            raise HTTPException(status_code=404, detail={"code": "LIVE_RUNTIME_COMMAND_NOT_FOUND"})
        return {"data": await plan_command(context["user"], command_id)}
    except AgentRuntimeError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc


@router.post("/collaborations/{collaboration_id}/runtime/commands/{command_id}/execute")
async def execute_live_runtime_command(
    collaboration_id: UUID,
    command_id: UUID,
    context: dict = Depends(get_auth_context),
):
    try:
        rows = await select(context["user"], "agent_commands", {
            "select": "id,live_collaboration_id,owner_user_id",
            "id": f"eq.{command_id}",
            "live_collaboration_id": f"eq.{collaboration_id}",
            "owner_user_id": f"eq.{context['user'].user_id}",
            "limit": "1",
        })
        if not rows:
            raise HTTPException(status_code=404, detail={"code": "LIVE_RUNTIME_COMMAND_NOT_FOUND"})
        return {"data": await execute_command(context["user"], command_id)}
    except AgentRuntimeError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc



@router.get("/sessions/{session_id}/messages")
async def list_live_messages(session_id: UUID, limit: int = Query(100, ge=1, le=200), context: dict = Depends(get_auth_context)):
    rows = await select(context["user"], "live_session_messages", {
        "select": "id,live_session_id,live_collaboration_id,viewer_id,sender_type,sender_user_id,sender_agent_id,role,message_type,content,created_at",
        "live_session_id": f"eq.{session_id}",
        "order": "created_at.asc",
        "limit": str(limit),
    })
    return {"data": rows}


@router.post("/sessions/{session_id}/conversation", status_code=201)
async def send_live_conversation(session_id: UUID, payload: LiveConversationMessage, collaboration_id: UUID = Query(...), context: dict = Depends(get_auth_context)):
    try:
        await rpc(context["user"], "create_live_session_message", {
            "p_live_session_id": str(session_id),
            "p_sender_type": "owner",
            "p_content": payload.content.strip(),
            "p_live_collaboration_id": str(collaboration_id),
            "p_viewer_id": None,
        })
        return {"data": await run_live_conversation_turn(context["user"], session_id, collaboration_id)}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_CONVERSATION_MESSAGE_FAILED") from exc
    except AgentRuntimeError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc


@router.post("/sessions/{session_id}/audience/join")
async def join_live_audience(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "join_live_session", {"p_live_session_id": str(session_id)})
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_AUDIENCE_JOIN_FAILED") from exc


@router.post("/sessions/{session_id}/audience/leave")
async def leave_live_audience(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "leave_live_session", {"p_live_session_id": str(session_id)})
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_AUDIENCE_LEAVE_FAILED") from exc


@router.post("/sessions/{session_id}/audience/interactions", status_code=201)
async def create_live_audience_interaction(session_id: UUID, payload: LiveAudienceInteraction, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "create_live_audience_interaction", {
            "p_live_session_id": str(session_id),
            "p_viewer_id": str(payload.viewer_id),
            "p_interaction_type": payload.interaction_type,
            "p_payload": payload.payload,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_AUDIENCE_INTERACTION_FAILED") from exc

@router.get("/sessions/{session_id}")
async def get_live_session(session_id: UUID, context: dict = Depends(get_auth_context)):
    rows = await select(
        context["user"],
        "live_sessions",
        {
            "select": "*,live_experience_templates(name,slug,category),live_experience_template_versions(version)",
            "id": f"eq.{session_id}",
            "limit": "1",
        },
    )
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "LIVE_SESSION_NOT_FOUND"})
    return {"data": rows[0]}


@router.patch("/sessions/{session_id}")
async def update_live_session(
    session_id: UUID,
    payload: LiveSessionUpdate,
    context: dict = Depends(get_auth_context),
):
    current_rows = await select(
        context["user"],
        "live_sessions",
        {"select": "id,status,host_user_id", "id": f"eq.{session_id}", "host_user_id": f"eq.{context['user'].user_id}", "limit": "1"},
    )
    if not current_rows:
        raise HTTPException(status_code=404, detail={"code": "LIVE_SESSION_NOT_FOUND"})
    if current_rows[0]["status"] not in {"draft", "scheduled"}:
        raise HTTPException(status_code=409, detail={"code": "LIVE_SESSION_NOT_EDITABLE"})
    values = payload.model_dump(exclude_unset=True)
    if "title" in values and values["title"] is not None:
        values["title"] = values["title"].strip()
    if "scheduled_at" in values and values["scheduled_at"] is not None:
        values["scheduled_at"] = _future_schedule(values["scheduled_at"])
    try:
        rows = await update(context["user"], "live_sessions", {"id": f"eq.{session_id}", "host_user_id": f"eq.{context['user'].user_id}"}, values)
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_SESSION_UPDATE_FAILED") from exc
    return {"data": rows[0] if rows else None}


async def _transition(session_id: UUID, expected: str, target: str, context: dict):
    rows = await select(
        context["user"],
        "live_sessions",
        {"select": "id,status,scheduled_at,host_user_id", "id": f"eq.{session_id}", "host_user_id": f"eq.{context['user'].user_id}", "limit": "1"},
    )
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "LIVE_SESSION_NOT_FOUND"})
    current = rows[0]
    if current["status"] != expected:
        raise HTTPException(
            status_code=409,
            detail={"code": "LIVE_INVALID_STATUS_TRANSITION", "from": current["status"], "to": target},
        )
    if target == "scheduled" and not current.get("scheduled_at"):
        raise HTTPException(status_code=422, detail={"code": "LIVE_SCHEDULE_TIME_REQUIRED"})
    if target == "live" and current.get("scheduled_at"):
        scheduled = datetime.fromisoformat(current["scheduled_at"].replace("Z", "+00:00"))
        if scheduled > datetime.now(timezone.utc):
            raise HTTPException(status_code=409, detail={"code": "LIVE_SCHEDULED_TIME_NOT_REACHED"})
    try:
        result = await update(
            context["user"],
            "live_sessions",
            {"id": f"eq.{session_id}", "host_user_id": f"eq.{context['user'].user_id}", "status": f"eq.{expected}"},
            {"status": target},
        )
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_SESSION_TRANSITION_FAILED") from exc
    if not result:
        raise HTTPException(status_code=409, detail={"code": "LIVE_SESSION_TRANSITION_CONFLICT"})
    return {"data": result[0]}


@router.post("/sessions/{session_id}/schedule")
async def schedule_live_session(session_id: UUID, context: dict = Depends(get_auth_context)):
    return await _transition(session_id, "draft", "scheduled", context)


@router.post("/sessions/{session_id}/start")
async def start_live_session(session_id: UUID, context: dict = Depends(get_auth_context)):
    return await _transition(session_id, "scheduled", "live", context)


@router.post("/sessions/{session_id}/end")
async def end_live_session(session_id: UUID, context: dict = Depends(get_auth_context)):
    return await _transition(session_id, "live", "ended", context)


@router.post("/sessions/{session_id}/cancel")
async def cancel_live_session(session_id: UUID, context: dict = Depends(get_auth_context)):
    rows = await select(
        context["user"],
        "live_sessions",
        {"select": "id,status,host_user_id", "id": f"eq.{session_id}", "host_user_id": f"eq.{context['user'].user_id}", "limit": "1"},
    )
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "LIVE_SESSION_NOT_FOUND"})
    if rows[0]["status"] not in {"draft", "scheduled"}:
        raise HTTPException(status_code=409, detail={"code": "LIVE_INVALID_STATUS_TRANSITION", "from": rows[0]["status"], "to": "cancelled"})
    try:
        result = await update(
            context["user"],
            "live_sessions",
            {"id": f"eq.{session_id}", "host_user_id": f"eq.{context['user'].user_id}", "status": f"in.(draft,scheduled)"},
            {"status": "cancelled"},
        )
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_SESSION_CANCEL_FAILED") from exc
    if not result:
        raise HTTPException(status_code=409, detail={"code": "LIVE_SESSION_CANCEL_CONFLICT"})
    return {"data": result[0]}
