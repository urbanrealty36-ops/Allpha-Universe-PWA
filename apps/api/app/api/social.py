from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, rpc, select

router = APIRouter(prefix="/api/v1/social", tags=["Social Graph & Relationships"])

SubjectType = Literal["user", "agent"]
RelationshipType = Literal["follow", "friend", "mentor", "partner", "client", "supplier", "collaborator", "trusted_agent"]


class RelationshipCreateRequest(BaseModel):
    source_type: SubjectType = "user"
    source_id: UUID | None = None
    target_type: SubjectType
    target_id: UUID
    relationship_type: RelationshipType
    context: dict[str, Any] = Field(default_factory=dict)


class BlockRequest(BaseModel):
    blocked_type: SubjectType
    blocked_id: UUID
    blocker_type: SubjectType = "user"
    blocker_id: UUID | None = None


class MentionCreateRequest(BaseModel):
    source_type: Literal["user", "agent", "content", "comment", "message", "event", "live"]
    source_id: UUID
    mentioned_type: SubjectType
    mentioned_id: UUID
    context: dict[str, Any] = Field(default_factory=dict)


class ActivityCreateRequest(BaseModel):
    actor_type: Literal["user", "agent"]
    actor_id: UUID
    event_type: str = Field(min_length=1, max_length=100)
    target_type: str | None = Field(default=None, max_length=80)
    target_id: UUID | None = None
    visibility: Literal["public", "connections", "private"] = "public"
    metadata: dict[str, Any] = Field(default_factory=dict)


def _rpc_error(exc: SupabaseRestError) -> HTTPException:
    status = exc.status_code if exc.status_code in {400, 401, 403, 404, 409, 422} else 500
    return HTTPException(status_code=status, detail={"code": "SOCIAL_OPERATION_FAILED", "message": exc.message})


async def _subject(user: AuthenticatedUser, subject_type: SubjectType, subject_id: UUID | None) -> tuple[str, UUID]:
    resolved = subject_id or user.user_id
    if subject_type == "user" and resolved != user.user_id:
        raise HTTPException(status_code=403, detail={"code": "SOCIAL_USER_OWNERSHIP_DENIED", "message": "A user subject must belong to the authenticated user."})
    if subject_type == "agent":
        rows = await select(user, "agents", {"select": "id", "id": f"eq.{resolved}", "owner_user_id": f"eq.{user.user_id}", "limit": "1"})
        if not rows:
            raise HTTPException(status_code=404, detail={"code": "SOCIAL_AGENT_NOT_FOUND", "message": "The Agent is not owned by the authenticated user."})
    return subject_type, resolved


@router.get("/me")
async def get_my_graph(
    relationship_type: RelationshipType | None = Query(default=None),
    direction: Literal["all", "outgoing", "incoming"] = "all",
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    user = context["user"]
    filters: dict[str, str] = {"or": f"(and(source_type.eq.user,source_id.eq.{user.user_id}),and(target_type.eq.user,target_id.eq.{user.user_id}))", "status": "in.(pending,active)"}
    if relationship_type:
        filters["relationship_type"] = f"eq.{relationship_type}"
    if direction == "outgoing":
        filters = {"source_type": "eq.user", "source_id": f"eq.{user.user_id}", "status": "in.(pending,active)"}
        if relationship_type:
            filters["relationship_type"] = f"eq.{relationship_type}"
    elif direction == "incoming":
        filters = {"target_type": "eq.user", "target_id": f"eq.{user.user_id}", "status": "in.(pending,active)"}
        if relationship_type:
            filters["relationship_type"] = f"eq.{relationship_type}"
    return {"data": await select(user, "social_relationships", {
        "select": "id,source_type,source_id,target_type,target_id,relationship_type,status,initiated_by_user_id,context,created_at,updated_at",
        **filters,
        "order": "updated_at.desc",
    })}


@router.get("/relationships")
async def list_relationships(
    status: Literal["pending", "active", "rejected", "revoked"] | None = None,
    relationship_type: RelationshipType | None = None,
    direction: Literal["all", "outgoing", "incoming"] = "all",
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    user = context["user"]
    filters: dict[str, str] = {"status": f"eq.{status}" if status else "in.(pending,active)"}
    if direction == "outgoing":
        filters.update(source_type="eq.user", source_id=f"eq.{user.user_id}")
    elif direction == "incoming":
        filters.update(target_type="eq.user", target_id=f"eq.{user.user_id}")
    else:
        filters["or"] = f"(and(source_type.eq.user,source_id.eq.{user.user_id}),and(target_type.eq.user,target_id.eq.{user.user_id}))"
    if relationship_type:
        filters["relationship_type"] = f"eq.{relationship_type}"
    return {"data": await select(user, "social_relationships", {
        "select": "id,source_type,source_id,target_type,target_id,relationship_type,status,initiated_by_user_id,context,created_at,updated_at",
        **filters,
        "order": "updated_at.desc",
    })}


@router.post("/relationships", status_code=201)
async def create_relationship(payload: RelationshipCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    source_type, source_id = await _subject(user, payload.source_type, payload.source_id)
    try:
        return await rpc(user, "create_social_relationship", {
            "p_source_type": source_type,
            "p_source_id": str(source_id),
            "p_target_type": payload.target_type,
            "p_target_id": str(payload.target_id),
            "p_relationship_type": payload.relationship_type,
            "p_context": payload.context,
        })
    except SupabaseRestError as exc:
        raise _rpc_error(exc) from exc


@router.post("/relationships/{relationship_id}/accept")
async def accept_relationship(relationship_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "accept_social_relationship", {"p_relationship_id": str(relationship_id)})
    except SupabaseRestError as exc:
        raise _rpc_error(exc) from exc


@router.post("/relationships/{relationship_id}/reject")
async def reject_relationship(relationship_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "reject_social_relationship", {"p_relationship_id": str(relationship_id)})
    except SupabaseRestError as exc:
        raise _rpc_error(exc) from exc


@router.post("/relationships/{relationship_id}/revoke")
async def revoke_relationship(relationship_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "revoke_social_relationship", {"p_relationship_id": str(relationship_id)})
    except SupabaseRestError as exc:
        raise _rpc_error(exc) from exc


@router.get("/blocks")
async def list_blocks(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    return {"data": await select(user, "social_blocks", {
        "select": "id,blocker_type,blocker_id,blocked_type,blocked_id,created_at",
        "blocker_type": "eq.user",
        "blocker_id": f"eq.{user.user_id}",
        "order": "created_at.desc",
    })}


@router.post("/blocks", status_code=201)
async def block_subject(payload: BlockRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    blocker_type, blocker_id = await _subject(user, payload.blocker_type, payload.blocker_id)
    try:
        return await rpc(user, "block_social_subject", {
            "p_blocked_type": payload.blocked_type,
            "p_blocked_id": str(payload.blocked_id),
            "p_blocker_type": blocker_type,
            "p_blocker_id": str(blocker_id),
        })
    except SupabaseRestError as exc:
        raise _rpc_error(exc) from exc


@router.delete("/blocks/{blocked_type}/{blocked_id}")
async def unblock_subject(blocked_type: SubjectType, blocked_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, bool]:
    try:
        await rpc(context["user"], "unblock_social_subject", {
            "p_blocked_type": blocked_type,
            "p_blocked_id": str(blocked_id),
            "p_blocker_type": "user",
            "p_blocker_id": str(context["user"].user_id),
        })
        return {"success": True}
    except SupabaseRestError as exc:
        raise _rpc_error(exc) from exc


@router.get("/mentions")
async def list_mentions(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    return {"data": await select(user, "social_mentions", {
        "select": "id,source_type,source_id,mentioned_type,mentioned_id,created_by_user_id,context,created_at",
        "or": f"(created_by_user_id.eq.{user.user_id},and(mentioned_type.eq.user,mentioned_id.eq.{user.user_id}))",
        "order": "created_at.desc",
    })}


@router.post("/mentions", status_code=201)
async def create_mention(payload: MentionCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "create_social_mention", {
            "p_source_type": payload.source_type,
            "p_source_id": str(payload.source_id),
            "p_mentioned_type": payload.mentioned_type,
            "p_mentioned_id": str(payload.mentioned_id),
            "p_context": payload.context,
        })
    except SupabaseRestError as exc:
        raise _rpc_error(exc) from exc


@router.get("/activity")
async def list_activity(
    limit: int = Query(default=50, ge=1, le=100),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    user = context["user"]
    return {"data": await select(user, "social_activity_events", {
        "select": "id,actor_type,actor_id,event_type,target_type,target_id,visibility,metadata,created_at",
        "order": "created_at.desc",
        "limit": str(limit),
    })}


@router.post("/activity", status_code=201)
async def record_activity(payload: ActivityCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "record_social_activity", {
            "p_actor_type": payload.actor_type,
            "p_actor_id": str(payload.actor_id),
            "p_event_type": payload.event_type,
            "p_target_type": payload.target_type,
            "p_target_id": str(payload.target_id) if payload.target_id else None,
            "p_visibility": payload.visibility,
            "p_metadata": payload.metadata,
        })
    except SupabaseRestError as exc:
        raise _rpc_error(exc) from exc


@router.get("/notifications")
async def list_notifications(
    unread_only: bool = False,
    limit: int = Query(default=50, ge=1, le=100),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    user = context["user"]
    filters = {
        "select": "id,actor_type,actor_id,notification_type,target_type,target_id,payload,read_at,created_at",
        "recipient_user_id": f"eq.{user.user_id}",
        "order": "created_at.desc",
        "limit": str(limit),
    }
    if unread_only:
        filters["read_at"] = "is.null"
    return {"data": await select(user, "social_notifications", filters)}


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "mark_social_notification_read", {"p_notification_id": str(notification_id)})
    except SupabaseRestError as exc:
        raise _rpc_error(exc) from exc
