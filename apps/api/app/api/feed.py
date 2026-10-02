from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, rpc

router = APIRouter(prefix="/api/v1/feed", tags=["Feed, Reels & Discovery"])

Surface = Literal["home", "following", "for_you", "reels", "explore", "live_now", "agent", "knowledge", "world", "context"]
Interaction = Literal[
    "impression", "watch_start", "watch_progress", "watch_complete", "replay", "pause", "skip",
    "like", "react", "comment", "share", "save", "follow", "profile_visit", "community_join",
    "search_after_view", "catalog_interaction", "event_interaction", "collaboration",
    "not_interested", "mute_creator", "hide_topic", "report",
]
Feedback = Literal["not_interested", "mute_creator", "hide_topic", "report"]


class FeedFeedbackRequest(BaseModel):
    content_id: UUID | None = None
    owner_type: Literal["user", "agent"] | None = None
    owner_id: UUID | None = None
    topic_id: UUID | None = None
    feedback_type: Feedback = "not_interested"
    reason: str | None = Field(default=None, max_length=500)
    metadata: dict[str, Any] = Field(default_factory=dict)


class FeedInteractionRequest(BaseModel):
    content_id: UUID
    surface: Surface
    event_type: Interaction
    position: int | None = Field(default=None, ge=0)
    watch_duration_ms: int | None = Field(default=None, ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


def _error(exc: SupabaseRestError) -> HTTPException:
    status = exc.status_code if exc.status_code in {400, 401, 403, 404, 409, 422} else 500
    return HTTPException(status_code=status, detail={"code": "FEED_OPERATION_FAILED", "message": exc.message})


@router.get("")
async def get_feed(
    surface: Surface = "home",
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, max_length=160),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    try:
        return await rpc(context["user"], "get_feed", {
            "p_surface": surface,
            "p_limit": limit,
            "p_offset": offset,
            "p_query": q,
        })
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/interactions", status_code=201)
async def record_interaction(
    payload: FeedInteractionRequest,
    context: dict = Depends(get_auth_context),
) -> Any:
    try:
        return await rpc(context["user"], "record_feed_interaction", {
            "p_content_id": str(payload.content_id),
            "p_surface": payload.surface,
            "p_event_type": payload.event_type,
            "p_position": payload.position,
            "p_watch_duration_ms": payload.watch_duration_ms,
            "p_metadata": payload.metadata,
        })
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/feedback", status_code=201)
async def record_feedback(
    payload: FeedFeedbackRequest,
    context: dict = Depends(get_auth_context),
) -> Any:
    try:
        return await rpc(context["user"], "record_feed_feedback", {
            "p_content_id": str(payload.content_id) if payload.content_id else None,
            "p_owner_type": payload.owner_type,
            "p_owner_id": str(payload.owner_id) if payload.owner_id else None,
            "p_topic_id": str(payload.topic_id) if payload.topic_id else None,
            "p_feedback_type": payload.feedback_type,
            "p_reason": payload.reason,
            "p_metadata": payload.metadata,
        })
    except SupabaseRestError as exc:
        raise _error(exc) from exc
