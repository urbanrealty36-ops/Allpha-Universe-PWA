from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, rpc, select

router = APIRouter(prefix="/api/v1/content", tags=["Content Platform"])

OwnerType = Literal["user", "agent"]
ContentType = Literal["post","image","video","carousel","article","document","presentation","podcast","audio","tutorial","infographic","research","ai_capsule"]
Visibility = Literal["public","connections","private","unlisted"]


class ContentCreate(BaseModel):
    owner_type: OwnerType = "user"
    owner_id: UUID | None = None
    content_type: ContentType
    title: str | None = Field(default=None, max_length=500)
    body: str | None = None
    excerpt: str | None = Field(default=None, max_length=2000)
    visibility: Visibility = "public"
    language_code: str | None = Field(default=None, max_length=16)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ContentUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    body: str | None = None
    excerpt: str | None = Field(default=None, max_length=2000)
    visibility: Visibility | None = None
    language_code: str | None = Field(default=None, max_length=16)
    metadata: dict[str, Any] | None = None


class MediaCreate(BaseModel):
    owner_type: OwnerType = "user"
    owner_id: UUID | None = None
    media_type: Literal["image","video","audio","document","presentation","file"]
    storage_bucket: Literal["allpha-media","allpha-documents","allpha-agent-assets","allpha-world-assets"]
    storage_path: str
    original_filename: str | None = None
    mime_type: str | None = None
    byte_size: int | None = Field(default=None, ge=0)
    checksum: str | None = None
    width: int | None = Field(default=None, gt=0)
    height: int | None = Field(default=None, gt=0)
    duration_ms: int | None = Field(default=None, ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class MediaAttach(BaseModel):
    media_asset_id: UUID
    slot_type: Literal["primary","cover","gallery","attachment","audio","video","presentation"] = "primary"
    position: int = Field(default=0, ge=0)
    caption: str | None = None
    alt_text: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class TopicCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    slug: str = Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    parent_id: UUID | None = None
    description: str | None = Field(default=None, max_length=1000)


class EventCreate(BaseModel):
    event_type: Literal["viewed","opened","shared","saved","reported"]
    metadata: dict[str, Any] = Field(default_factory=dict)


class CapsuleCreate(BaseModel):
    summary: str = Field(min_length=1)
    key_points: list[Any] = Field(default_factory=list)
    source_metadata: dict[str, Any] = Field(default_factory=dict)
    generated_by: str | None = None
    model_reference: str | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)
    confidence: float | None = Field(default=None, ge=0, le=1)


def _error(exc: SupabaseRestError, code: str = "CONTENT_OPERATION_FAILED") -> HTTPException:
    status = exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
    return HTTPException(status_code=status, detail={"code": code, "message": exc.message})


async def _owned_subject(user: AuthenticatedUser, owner_type: OwnerType, owner_id: UUID | None) -> tuple[str, UUID]:
    resolved = owner_id or user.user_id
    if owner_type == "user":
        if resolved != user.user_id:
            raise HTTPException(status_code=403, detail={"code":"CONTENT_USER_OWNERSHIP_DENIED","message":"The user owner must be the authenticated user."})
    else:
        rows = await select(user, "agents", {"select":"id", "id":f"eq.{resolved}", "owner_user_id":f"eq.{user.user_id}", "status":"neq.archived", "limit":"1"})
        if not rows:
            raise HTTPException(status_code=404, detail={"code":"CONTENT_AGENT_NOT_FOUND","message":"The Agent is not owned by the authenticated user."})
    return owner_type, resolved


@router.get("")
async def list_content(
    mine: bool = False,
    content_type: ContentType | None = None,
    status: Literal["draft","pending_review","published","archived","rejected"] | None = None,
    limit: int = Query(default=30, ge=1, le=100),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    user = context["user"]
    filters: dict[str, str] = {"order":"published_at.desc.nullslast,created_at.desc","limit":str(limit)}
    if mine:
        filters["or"] = f"(and(owner_type.eq.user,owner_id.eq.{user.user_id}),and(owner_type.eq.agent,owner_id.in.({','.join([str(x['id']) for x in await select(user,'agents',{'select':'id','owner_user_id':f'eq.{user.user_id}','status':'neq.archived'})])})))"
    else:
        filters["status"] = "eq.published"
        filters["visibility"] = "eq.public"
    if content_type:
        filters["content_type"] = f"eq.{content_type}"
    if status:
        filters["status"] = f"eq.{status}"
    return {"data": await select(user, "content_items", {"select":"id,owner_type,owner_id,content_type,title,excerpt,visibility,status,language_code,metadata,published_at,created_at,updated_at", **filters})}


@router.get("/{content_id}")
async def get_content(content_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    rows = await select(context["user"], "content_items", {"select":"*", "id":f"eq.{content_id}", "limit":"1"})
    if not rows:
        raise HTTPException(status_code=404, detail={"code":"CONTENT_NOT_FOUND","message":"Content is not available."})
    return {"data": rows[0]}


@router.post("", status_code=201)
async def create_content(payload: ContentCreate, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    owner_type, owner_id = await _owned_subject(user, payload.owner_type, payload.owner_id)
    try:
        return await rpc(user, "create_content", {"p_owner_type":owner_type,"p_owner_id":str(owner_id),"p_content_type":payload.content_type,"p_title":payload.title,"p_body":payload.body,"p_excerpt":payload.excerpt,"p_visibility":payload.visibility,"p_language_code":payload.language_code,"p_metadata":payload.metadata})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.patch("/{content_id}")
async def update_content(content_id: UUID, payload: ContentUpdate, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "update_content", {"p_content_id":str(content_id),"p_title":payload.title,"p_body":payload.body,"p_excerpt":payload.excerpt,"p_visibility":payload.visibility,"p_language_code":payload.language_code,"p_metadata":payload.metadata})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/{content_id}/submit-moderation", status_code=201)
async def submit_moderation(content_id: UUID, reason_code: str | None = None, notes: str | None = None, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "submit_content_moderation", {"p_content_id":str(content_id),"p_reason_code":reason_code,"p_notes":notes})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/{content_id}/publish")
async def publish(content_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "publish_content", {"p_content_id":str(content_id)})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/{content_id}/archive")
async def archive(content_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "archive_content", {"p_content_id":str(content_id)})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.get("/{content_id}/media")
async def list_media(content_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    return {"data": await select(context["user"], "content_media", {"select":"id,content_id,media_asset_id,slot_type,position,caption,alt_text,metadata,created_at","content_id":f"eq.{content_id}","order":"slot_type.asc,position.asc"})}


@router.post("/media", status_code=201)
async def create_media(payload: MediaCreate, context: dict = Depends(get_auth_context)) -> Any:
    user=context["user"]
    owner_type, owner_id=await _owned_subject(user,payload.owner_type,payload.owner_id)
    try:
        return await rpc(user,"create_media_asset",{"p_owner_type":owner_type,"p_owner_id":str(owner_id),"p_media_type":payload.media_type,"p_storage_bucket":payload.storage_bucket,"p_storage_path":payload.storage_path,"p_original_filename":payload.original_filename,"p_mime_type":payload.mime_type,"p_byte_size":payload.byte_size,"p_checksum":payload.checksum,"p_width":payload.width,"p_height":payload.height,"p_duration_ms":payload.duration_ms,"p_metadata":payload.metadata})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/{content_id}/media", status_code=201)
async def attach_media(content_id: UUID, payload: MediaAttach, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"],"attach_content_media",{"p_content_id":str(content_id),"p_media_asset_id":str(payload.media_asset_id),"p_slot_type":payload.slot_type,"p_position":payload.position,"p_caption":payload.caption,"p_alt_text":payload.alt_text,"p_metadata":payload.metadata})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.get("/topics")
async def list_topics(limit: int = Query(default=100, ge=1, le=200), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    return {"data": await select(context["user"],"content_topics",{"select":"id,name,slug,parent_id,description,status,created_at,updated_at","status":"eq.active","order":"name.asc","limit":str(limit)})}


@router.post("/topics", status_code=201)
async def create_topic(payload: TopicCreate, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"],"create_content_topic",{"p_name":payload.name,"p_slug":payload.slug,"p_parent_id":str(payload.parent_id) if payload.parent_id else None,"p_description":payload.description})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/{content_id}/topics/{topic_id}", status_code=201)
async def link_topic(content_id: UUID, topic_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"],"link_content_topic",{"p_content_id":str(content_id),"p_topic_id":str(topic_id)})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/{content_id}/events", status_code=201)
async def event(content_id: UUID, payload: EventCreate, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"],"record_content_event",{"p_content_id":str(content_id),"p_event_type":payload.event_type,"p_metadata":payload.metadata})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/{content_id}/ai-capsule", status_code=201)
async def create_capsule(content_id: UUID, payload: CapsuleCreate, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"],"create_ai_capsule",{"p_content_id":str(content_id),"p_summary":payload.summary,"p_key_points":payload.key_points,"p_source_metadata":payload.source_metadata,"p_generated_by":payload.generated_by,"p_model_reference":payload.model_reference,"p_provenance":payload.provenance,"p_confidence":payload.confidence})
    except SupabaseRestError as exc:
        raise _error(exc) from exc
