from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, rpc, select

router = APIRouter(prefix="/api/v1/stories", tags=["Stories"])


class StoryCreate(BaseModel):
    owner_type: Literal["user", "agent"] = "user"
    owner_id: UUID | None = None
    title: str | None = Field(default=None, max_length=500)
    body: str | None = None
    excerpt: str | None = Field(default=None, max_length=2000)
    visibility: Literal["public", "connections", "private", "unlisted"] = "public"
    language_code: str | None = Field(default=None, max_length=16)
    metadata: dict[str, Any] = Field(default_factory=dict)
    expires_at: datetime


async def _owned_subject(user: AuthenticatedUser, owner_type: str, owner_id: UUID | None) -> UUID:
    resolved = owner_id or user.user_id
    if owner_type == "user":
        if resolved != user.user_id:
            raise HTTPException(status_code=403, detail={"code": "STORY_USER_OWNERSHIP_DENIED", "message": "The user owner must be the authenticated user."})
        return resolved
    rows = await select(user, "agents", {
        "select": "id",
        "id": f"eq.{resolved}",
        "owner_user_id": f"eq.{user.user_id}",
        "status": "neq.archived",
        "limit": "1",
    })
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "STORY_AGENT_NOT_FOUND", "message": "The Agent is not owned by the authenticated user."})
    return resolved


def _error(exc: SupabaseRestError) -> HTTPException:
    status = exc.status_code if exc.status_code in {400, 401, 403, 404, 409, 422} else 500
    return HTTPException(status_code=status, detail={"code": "STORY_OPERATION_FAILED", "message": exc.message})


@router.get("")
async def list_stories(
    mine: bool = False,
    include_expired: bool = False,
    limit: int = Query(default=30, ge=1, le=100),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    user = context["user"]
    filters = {
        "select": "id,content_id,owner_type,owner_id,status,expires_at,created_at,updated_at,content_items(id,title,excerpt,visibility,status,published_at,metadata)",
        "order": "expires_at.asc,created_at.desc",
        "limit": str(limit),
    }
    if mine:
        agents = await select(user, "agents", {"select": "id", "owner_user_id": f"eq.{user.user_id}", "status": "neq.archived"})
        ids = [str(x["id"]) for x in agents]
        if ids:
            filters["or"] = f"(and(owner_type.eq.user,owner_id.eq.{user.user_id}),and(owner_type.eq.agent,owner_id.in.({','.join(ids)})))"
        else:
            filters["owner_type"] = "eq.user"
            filters["owner_id"] = f"eq.{user.user_id}"
    else:
        filters["status"] = "eq.published"
    if not include_expired:
        filters["expires_at"] = f"gt.{datetime.utcnow().isoformat()}Z"
    return {"data": await select(user, "stories", filters)}


@router.post("", status_code=201)
async def create_story(payload: StoryCreate, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    owner_id = await _owned_subject(user, payload.owner_type, payload.owner_id)
    try:
        return await rpc(user, "create_story", {
            "p_owner_type": payload.owner_type,
            "p_owner_id": str(owner_id),
            "p_title": payload.title,
            "p_body": payload.body,
            "p_excerpt": payload.excerpt,
            "p_visibility": payload.visibility,
            "p_language_code": payload.language_code,
            "p_metadata": payload.metadata,
            "p_expires_at": payload.expires_at.isoformat(),
        })
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/{story_id:uuid}/publish")
async def publish_story(story_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "publish_story", {"p_story_id": str(story_id)})
    except SupabaseRestError as exc:
        raise _error(exc) from exc
