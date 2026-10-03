from datetime import datetime, timezone
from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, insert, select, update, rpc
from app.core.storage import SupabaseStorageError, create_signed_upload_url, create_signed_download_url
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


class LiveTransportStart(BaseModel):
    stream_provider: str = Field(min_length=1, max_length=100)
    stream_reference: str = Field(min_length=1, max_length=1000)


@router.post("/sessions/{session_id}/start")
async def start_live_session(session_id: UUID, payload: LiveTransportStart, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "start_live_session", {
            "p_session_id": str(session_id),
            "p_stream_provider": payload.stream_provider.strip(),
            "p_stream_reference": payload.stream_reference.strip(),
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_SESSION_START_FAILED") from exc


@router.post("/sessions/{session_id}/end")
async def end_live_session(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "end_live_session", {"p_session_id": str(session_id)})
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_SESSION_END_FAILED") from exc


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


class LiveCharacterSelect(BaseModel):
    asset_id: UUID
    collaboration_id: UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)



@router.get("/character-assets")
async def list_live_character_assets(
    agent_id: UUID | None = None,
    asset_type: str | None = None,
    context: dict = Depends(get_auth_context),
):
    q = {
        "select": "id,owner_user_id,agent_id,asset_type,name,storage_path,mime_type,metadata,moderation_status,status,content_size_bytes,checksum_sha256,uploaded_at,updated_at",
        "status": "eq.active",
        "moderation_status": "eq.approved",
        "order": "updated_at.desc",
        "limit": "100",
    }
    if agent_id:
        q["agent_id"] = f"eq.{agent_id}"
    if asset_type:
        q["asset_type"] = f"eq.{asset_type}"
    try:
        rows = await select(context["user"], "live_character_assets", q)
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_CHARACTER_ASSET_LIST_FAILED") from exc
    return {"data": rows}


@router.get("/sessions/{session_id}/characters")
async def list_live_characters(session_id: UUID, context: dict = Depends(get_auth_context)):
    rows = await select(
        context["user"],
        "live_session_character_bindings",
        {
            "select": "id,live_session_id,live_agent_collaboration_id,asset_id,selected_by_user_id,status,selected_at,removed_at,metadata",
            "live_session_id": f"eq.{session_id}",
            "order": "selected_at.desc",
        },
    )
    return {"data": rows}


@router.post("/sessions/{session_id}/characters", status_code=201)
async def select_live_character(session_id: UUID, payload: LiveCharacterSelect, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "select_live_character", {
            "p_live_session_id": str(session_id),
            "p_asset_id": str(payload.asset_id),
            "p_collaboration_id": str(payload.collaboration_id) if payload.collaboration_id else None,
            "p_metadata": payload.metadata,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_CHARACTER_SELECT_FAILED") from exc


@router.post("/sessions/{session_id}/characters/remove")
async def remove_live_character(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "remove_live_character", {"p_live_session_id": str(session_id)})
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_CHARACTER_REMOVE_FAILED") from exc


@router.post("/sessions/{session_id}/audience/ask", status_code=201)
async def ask_live_agent_from_audience(
    session_id: UUID,
    payload: LiveConversationMessage,
    viewer_id: UUID = Query(...),
    collaboration_id: UUID = Query(...),
    context: dict = Depends(get_auth_context),
):
    try:
        await rpc(context["user"], "create_live_session_message", {
            "p_live_session_id": str(session_id),
            "p_sender_type": "audience",
            "p_content": payload.content.strip(),
            "p_live_collaboration_id": str(collaboration_id),
            "p_viewer_id": str(viewer_id),
        })
        return {"data": await run_live_conversation_turn(context["user"], session_id, collaboration_id)}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_AUDIENCE_ASK_FAILED") from exc
    except AgentRuntimeError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc


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



class LiveStageBinding(BaseModel):
    theme_id: UUID
    stage_asset_id: UUID | None = None
    composition: dict[str, Any] = Field(default_factory=dict)


class LiveCameraSourceCreate(BaseModel):
    source_type: Literal["webcam", "mobile_camera", "virtual_camera"] = "webcam"
    device_key: str | None = Field(default=None, max_length=255)
    facing_mode: Literal["user", "environment", "unknown"] = "user"
    width: int | None = Field(default=None, ge=320, le=7680)
    height: int | None = Field(default=None, ge=240, le=4320)
    fps: float | None = Field(default=None, ge=1, le=120)
    permission_status: Literal["prompt", "granted", "denied", "unknown"] = "granted"
    metadata: dict[str, Any] = Field(default_factory=dict)


class LivePresenceCheck(BaseModel):
    camera_source_id: UUID
    verification_method: str = Field(min_length=1, max_length=120)
    consent: bool
    face_present: bool
    body_present: bool
    liveness_passed: bool
    face_quality: float | None = Field(default=None, ge=0, le=100)
    body_quality: float | None = Field(default=None, ge=0, le=100)
    evidence_metadata: dict[str, Any] = Field(default_factory=dict)


class LiveHumanPresentation(BaseModel):
    camera_source_id: UUID
    presence_verification_id: UUID
    uniform_id: UUID | None = None
    user_uniform_id: UUID | None = None
    custom_costume_id: UUID | None = None
    appearance_config: dict[str, Any] = Field(default_factory=dict)


class LiveCustomCostumeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: Literal["superhero","business_shirt","suit_tie","formal","nusantara","traditional","cultural","uniform","fantasy","sci_fi","creator","custom"]
    mime_type: str = "model/gltf-binary"
    metadata: dict[str, Any] = Field(default_factory=dict)


class LiveCustomCostumeFinalize(BaseModel):
    checksum_sha256: str | None = None


@router.post("/sessions/{session_id}/stage")
async def bind_live_stage(session_id: UUID, payload: LiveStageBinding, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "bind_live_stage", {
            "p_live_session_id": str(session_id),
            "p_theme_id": str(payload.theme_id),
            "p_stage_asset_id": str(payload.stage_asset_id) if payload.stage_asset_id else None,
            "p_composition": payload.composition,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_STAGE_BIND_FAILED") from exc


@router.get("/sessions/{session_id}/stage-runtime")
async def live_stage_runtime(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        sessions = await select(context["user"], "live_sessions", {
            "select": "id,host_user_id,experience_template_id,experience_template_version_id,status,title",
            "id": f"eq.{session_id}", "limit": "1",
        })
        if not sessions:
            raise HTTPException(status_code=404, detail={"code": "LIVE_SESSION_NOT_FOUND"})
        bindings = await select(context["user"], "live_session_stage_bindings", {
            "select": "*", "live_session_id": f"eq.{session_id}", "status": "eq.active", "limit": "1",
        })
        if not bindings:
            return {"data": {"active": False, "stage": None}}
        b = bindings[0]
        asset = None
        if b.get("stage_source") == "dedicated_stage_asset" and b.get("stage_asset_id"):
            rows = await select(context["user"], "live_experience_stage_assets", {
                "select": "id,template_version_id,storage_bucket,storage_path,mime_type,metadata,status,moderation_status,content_size_bytes,checksum_sha256",
                "id": f"eq.{b['stage_asset_id']}", "status": "eq.active", "moderation_status": "eq.approved", "limit": "1",
            })
            asset = rows[0] if rows else None
        else:
            rows = await select(context["user"], "theme_assets", {
                "select": "id,theme_id,theme_version_id,storage_bucket,storage_path,mime_type,metadata,status,moderation_status,safety_status,performance_status,content_size_bytes,checksum_sha256,live_stage_component",
                "theme_id": f"eq.{b['theme_id']}", "asset_type": "eq.3d_scene", "status": "eq.active",
                "moderation_status": "eq.approved", "safety_status": "eq.passed", "performance_status": "eq.passed",
                "live_stage_component": "eq.LiveExperienceStage", "limit": "1",
            })
            asset = rows[0] if rows else None
        if not asset:
            return {"data": {"active": False, "stage": None, "reason": "LIVE_STAGE_ASSET_NOT_AVAILABLE"}}
        try:
            signed_url = await create_signed_download_url(context["user"], asset["storage_bucket"], asset["storage_path"], 900)
        except SupabaseStorageError:
            signed_url = None
        return {"data": {
            "active": True,
            "stage": {
                "binding": b,
                "asset": asset,
                "signed_url": signed_url,
                "renderer": "AllphaWorldRenderer",
                "component": "LiveExperienceStage",
                "presentation_only": True,
                "authority_boundary": "unchanged",
            },
        }}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_STAGE_RUNTIME_LOAD_FAILED") from exc


@router.post("/sessions/{session_id}/camera")
async def register_live_camera(session_id: UUID, payload: LiveCameraSourceCreate, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "register_live_camera_source", {
            "p_live_session_id": str(session_id),
            "p_source_type": payload.source_type,
            "p_device_key": payload.device_key,
            "p_facing_mode": payload.facing_mode,
            "p_width": payload.width,
            "p_height": payload.height,
            "p_fps": payload.fps,
            "p_permission_status": payload.permission_status,
            "p_metadata": payload.metadata,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_CAMERA_REGISTER_FAILED") from exc


@router.get("/sessions/{session_id}/camera")
async def get_live_camera(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        rows = await select(context["user"], "live_session_camera_sources", {
            "select": "id,live_session_id,owner_user_id,source_type,device_key,facing_mode,width,height,fps,permission_status,status,metadata,created_at,updated_at",
            "live_session_id": f"eq.{session_id}", "owner_user_id": f"eq.{context['user'].user_id}",
            "status": "eq.active", "limit": "1",
        })
        return {"data": rows[0] if rows else None}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_CAMERA_LOAD_FAILED") from exc


@router.post("/sessions/{session_id}/presence-check")
async def submit_live_presence_check(session_id: UUID, payload: LivePresenceCheck, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "submit_live_human_presence_check", {
            "p_live_session_id": str(session_id),
            "p_camera_source_id": str(payload.camera_source_id),
            "p_verification_method": payload.verification_method,
            "p_consent": payload.consent,
            "p_face_present": payload.face_present,
            "p_body_present": payload.body_present,
            "p_liveness_passed": payload.liveness_passed,
            "p_face_quality": payload.face_quality,
            "p_body_quality": payload.body_quality,
            "p_evidence_metadata": payload.evidence_metadata,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_PRESENCE_CHECK_FAILED") from exc


@router.get("/sessions/{session_id}/presence-check")
async def get_live_presence_check(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        rows = await select(context["user"], "live_human_presence_verifications", {
            "select": "id,live_session_id,owner_user_id,camera_source_id,verification_method,consent_at,face_present,body_present,liveness_passed,face_quality,body_quality,verification_status,verified_at,expires_at,evidence_metadata",
            "live_session_id": f"eq.{session_id}", "owner_user_id": f"eq.{context['user'].user_id}",
            "order": "created_at.desc", "limit": "1",
        })
        return {"data": rows[0] if rows else None}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_PRESENCE_CHECK_LOAD_FAILED") from exc


@router.post("/sessions/{session_id}/human-presentation")
async def bind_live_human_presentation(session_id: UUID, payload: LiveHumanPresentation, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "bind_live_human_presentation", {
            "p_live_session_id": str(session_id),
            "p_camera_source_id": str(payload.camera_source_id),
            "p_presence_verification_id": str(payload.presence_verification_id),
            "p_uniform_id": str(payload.uniform_id) if payload.uniform_id else None,
            "p_user_uniform_id": str(payload.user_uniform_id) if payload.user_uniform_id else None,
            "p_custom_costume_id": str(payload.custom_costume_id) if payload.custom_costume_id else None,
            "p_appearance_config": payload.appearance_config,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_HUMAN_PRESENTATION_BIND_FAILED") from exc


@router.get("/sessions/{session_id}/human-presentation")
async def get_live_human_presentation(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        rows = await select(context["user"], "live_session_human_presentations", {
            "select": "*", "live_session_id": f"eq.{session_id}", "owner_user_id": f"eq.{context['user'].user_id}", "limit": "1",
        })
        return {"data": rows[0] if rows else None}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_HUMAN_PRESENTATION_LOAD_FAILED") from exc


@router.get("/costumes/catalog")
async def live_costume_catalog(context: dict = Depends(get_auth_context)):
    try:
        uniforms = await select(context["user"], "uniform_catalog", {
            "select": "id,uniform_key,name,description,asset_type,storage_bucket,storage_path,mime_type,checksum_sha256,theme_compatibility,metadata",
            "status": "eq.published", "moderation_status": "eq.approved", "order": "name.asc", "limit": "200",
        })
        owned = await select(context["user"], "user_uniforms", {
            "select": "id,user_id,uniform_id,acquired_via,entitlement_ref,metadata,status,equipped",
            "user_id": f"eq.{context['user'].user_id}", "status": "eq.owned", "order": "updated_at.desc", "limit": "200",
        })
        custom = await select(context["user"], "live_human_costume_templates", {
            "select": "id,name,category,asset_type,storage_bucket,storage_path,mime_type,metadata,moderation_status,status",
            "owner_user_id": f"eq.{context['user'].user_id}", "status": "eq.active", "moderation_status": "eq.approved",
            "order": "updated_at.desc", "limit": "200",
        })
        return {"data": {"platform_uniforms": uniforms, "owned_uniforms": owned, "custom_costumes": custom}}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_COSTUME_CATALOG_LOAD_FAILED") from exc


@router.post("/costumes/custom", status_code=201)
async def prepare_live_custom_costume(payload: LiveCustomCostumeCreate, context: dict = Depends(get_auth_context)):
    try:
        record = await rpc(context["user"], "prepare_live_custom_costume", {
            "p_name": payload.name.strip(), "p_category": payload.category,
            "p_mime_type": payload.mime_type, "p_metadata": payload.metadata,
        })
        upload = await create_signed_upload_url(context["user"], record["storage_bucket"], record["storage_path"])
        return {"data": {**record, "upload": upload}}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_COSTUME_PREPARE_FAILED") from exc
    except SupabaseStorageError as exc:
        raise HTTPException(status_code=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 502, detail={"code": "LIVE_COSTUME_UPLOAD_URL_FAILED", "message": exc.message})


@router.post("/costumes/custom/{costume_id}/finalize")
async def finalize_live_custom_costume(costume_id: UUID, payload: LiveCustomCostumeFinalize, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "finalize_live_custom_costume", {
            "p_costume_id": str(costume_id), "p_checksum_sha256": payload.checksum_sha256,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_COSTUME_FINALIZE_FAILED") from exc


@router.post("/sessions/{session_id}/activate-experience")
async def activate_live_experience(session_id: UUID, collaboration_id: UUID | None = Query(default=None), context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "activate_live_experience", {
            "p_live_session_id": str(session_id),
            "p_collaboration_id": str(collaboration_id) if collaboration_id else None,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_EXPERIENCE_ACTIVATION_FAILED") from exc



class LiveStageAssetPrepare(BaseModel):
    mime_type: str = "model/gltf-binary"
    metadata: dict[str, Any] = Field(default_factory=dict)


class LiveStageAssetFinalize(BaseModel):
    checksum_sha256: str | None = None


@router.post("/templates/{template_version_id}/stage-assets/upload-url", status_code=201)
async def prepare_live_stage_asset(template_version_id: UUID, payload: LiveStageAssetPrepare, context: dict = Depends(get_auth_context)):
    try:
        record = await rpc(context["user"], "prepare_live_stage_3d_asset", {
            "p_template_version_id": str(template_version_id),
            "p_mime_type": payload.mime_type,
            "p_metadata": payload.metadata,
        })
        upload = await create_signed_upload_url(context["user"], record["storage_bucket"], record["storage_path"])
        return {"data": {**record, "upload": upload}}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_STAGE_ASSET_PREPARE_FAILED") from exc
    except SupabaseStorageError as exc:
        raise HTTPException(status_code=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 502, detail={"code": "LIVE_STAGE_ASSET_UPLOAD_URL_FAILED", "message": exc.message})


@router.post("/stage-assets/{asset_id}/finalize")
async def finalize_live_stage_asset(asset_id: UUID, payload: LiveStageAssetFinalize, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "finalize_live_stage_3d_asset", {
            "p_asset_id": str(asset_id),
            "p_checksum_sha256": payload.checksum_sha256,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_STAGE_ASSET_FINALIZE_FAILED") from exc


@router.get("/templates/{template_version_id}/stage-assets")
async def list_live_stage_assets(template_version_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        rows = await select(context["user"], "live_experience_stage_assets", {
            "select": "id,template_version_id,asset_type,storage_bucket,storage_path,mime_type,metadata,status,moderation_status,content_size_bytes,checksum_sha256,uploaded_at,created_at,updated_at",
            "template_version_id": f"eq.{template_version_id}",
            "status": "eq.active", "moderation_status": "eq.approved",
            "order": "updated_at.desc",
        })
        result = []
        for row in rows:
            item = dict(row)
            try:
                item["signed_url"] = await create_signed_download_url(context["user"], row["storage_bucket"], row["storage_path"], 900)
            except SupabaseStorageError:
                item["signed_url"] = None
            result.append(item)
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_STAGE_ASSET_LIST_FAILED") from exc



@router.get("/sessions/{session_id}/human-presentation-runtime")
async def get_live_human_presentation_runtime(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        presentations = await select(context["user"], "live_session_human_presentations", {
            "select": "*",
            "live_session_id": f"eq.{session_id}",
            "owner_user_id": f"eq.{context['user'].user_id}",
            "limit": "1",
        })
        if not presentations:
            return {"data": {"active": False, "presentation": None, "costume_asset": None}}
        presentation = presentations[0]
        costume = None
        if presentation.get("custom_costume_id"):
            rows = await select(context["user"], "live_human_costume_templates", {
                "select": "id,name,category,storage_bucket,storage_path,mime_type,metadata,status,moderation_status",
                "id": f"eq.{presentation['custom_costume_id']}",
                "owner_user_id": f"eq.{context['user'].user_id}",
                "status": "eq.active", "moderation_status": "eq.approved", "limit": "1",
            })
            costume = rows[0] if rows else None
        else:
            uniform_id = presentation.get("uniform_id")
            if not uniform_id and presentation.get("user_uniform_id"):
                owned = await select(context["user"], "user_uniforms", {
                    "select": "uniform_id",
                    "id": f"eq.{presentation['user_uniform_id']}",
                    "user_id": f"eq.{context['user'].user_id}",
                    "status": "eq.owned", "limit": "1",
                })
                uniform_id = owned[0].get("uniform_id") if owned else None
            if uniform_id:
                rows = await select(context["user"], "uniform_catalog", {
                    "select": "id,name,uniform_key,asset_type,storage_bucket,storage_path,mime_type,metadata,status,moderation_status",
                    "id": f"eq.{uniform_id}", "status": "eq.published", "moderation_status": "eq.approved", "limit": "1",
                })
                costume = rows[0] if rows else None
        signed_url = None
        if costume and costume.get("storage_bucket") and costume.get("storage_path"):
            try:
                signed_url = await create_signed_download_url(context["user"], costume["storage_bucket"], costume["storage_path"], 900)
            except SupabaseStorageError:
                signed_url = None
        return {"data": {
            "active": presentation.get("status") == "active",
            "presentation": presentation,
            "costume_asset": {**costume, "signed_url": signed_url} if costume else None,
            "camera_source_id": presentation.get("camera_source_id"),
            "presence_verification_id": presentation.get("presence_verification_id"),
            "presentation_only": True,
        }}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_HUMAN_PRESENTATION_RUNTIME_LOAD_FAILED") from exc



class LiveCustomCostumeModerate(BaseModel):
    decision: Literal["approved", "restricted", "removed"]


@router.post("/costumes/custom/{costume_id}/moderate")
async def moderate_live_custom_costume(costume_id: UUID, payload: LiveCustomCostumeModerate, context: dict = Depends(get_auth_context)):
    try:
        result = await rpc(context["user"], "moderate_live_custom_costume", {
            "p_costume_id": str(costume_id),
            "p_decision": payload.decision,
        })
        return {"data": result}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_COSTUME_MODERATION_FAILED") from exc



@router.get("/sessions/{session_id}/human-presentation-public")
async def get_public_live_human_presentation(session_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        payload = await rpc(context["user"], "get_public_live_human_presentation", {
            "p_live_session_id": str(session_id),
        })
        if not payload.get("active"):
            return {"data": payload}
        costume = None
        if payload.get("custom_costume_id"):
            rows = await select(context["user"], "live_human_costume_templates", {
                "select": "id,name,category,storage_bucket,storage_path,mime_type,metadata",
                "id": f"eq.{payload['custom_costume_id']}",
                "status": "eq.active", "moderation_status": "eq.approved", "limit": "1",
            })
            costume = rows[0] if rows else None
        elif payload.get("uniform_id"):
            rows = await select(context["user"], "uniform_catalog", {
                "select": "id,name,uniform_key,asset_type,storage_bucket,storage_path,mime_type,metadata",
                "id": f"eq.{payload['uniform_id']}",
                "status": "eq.published", "moderation_status": "eq.approved", "limit": "1",
            })
            costume = rows[0] if rows else None
        elif payload.get("user_uniform_id"):
            owned = await select(context["user"], "user_uniforms", {
                "select": "uniform_id",
                "id": f"eq.{payload['user_uniform_id']}",
                "status": "eq.owned", "limit": "1",
            })
            if owned:
                rows = await select(context["user"], "uniform_catalog", {
                    "select": "id,name,uniform_key,asset_type,storage_bucket,storage_path,mime_type,metadata",
                    "id": f"eq.{owned[0]['uniform_id']}",
                    "status": "eq.published", "moderation_status": "eq.approved", "limit": "1",
                })
                costume = rows[0] if rows else None
        signed_url = None
        if costume and costume.get("storage_bucket") and costume.get("storage_path"):
            try:
                signed_url = await create_signed_download_url(context["user"], costume["storage_bucket"], costume["storage_path"], 900)
            except SupabaseStorageError:
                signed_url = None
        return {"data": {**payload, "costume_asset": {**costume, "signed_url": signed_url} if costume else None}}
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_PUBLIC_HUMAN_PRESENTATION_LOAD_FAILED") from exc
