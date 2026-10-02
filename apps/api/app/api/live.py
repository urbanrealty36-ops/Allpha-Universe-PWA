from datetime import datetime, timezone
from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, insert, select, update

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
    if payload.scheduled_at is not None and payload.scheduled_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail={"code": "LIVE_SCHEDULE_TIME_MUST_BE_FUTURE"})

    values = {
        "host_user_id": str(context["user"].user_id),
        "experience_template_id": str(payload.experience_template_id),
        "experience_template_version_id": str(payload.experience_template_version_id),
        "source_type": payload.source_type,
        "title": payload.title.strip(),
        "status": "draft",
        "visibility": payload.visibility,
        "scheduled_at": payload.scheduled_at.isoformat() if payload.scheduled_at else None,
        "district_id": str(payload.district_id) if payload.district_id else None,
        "booth_id": str(payload.booth_id) if payload.booth_id else None,
        "metadata": payload.metadata,
    }
    try:
        rows = await insert(context["user"], "live_sessions", values)
    except SupabaseRestError as exc:
        raise err(exc, "LIVE_SESSION_CREATE_FAILED") from exc
    return {"data": rows[0] if rows else None}


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
        if values["scheduled_at"] <= datetime.now(timezone.utc):
            raise HTTPException(status_code=422, detail={"code": "LIVE_SCHEDULE_TIME_MUST_BE_FUTURE"})
        values["scheduled_at"] = values["scheduled_at"].isoformat()
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
    return await _transition(session_id, "draft", "cancelled", context)
