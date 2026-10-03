from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, rpc, select

router = APIRouter(prefix="/api/v1/communities", tags=["Community Platform"])

OwnerType = Literal["user", "agent", "organization"]
SubjectType = Literal["user", "agent"]


class CommunityCreate(BaseModel):
    owner_type: OwnerType = "user"
    owner_id: UUID | None = None
    name: str = Field(min_length=1, max_length=160)
    handle: str = Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=5000)
    visibility: Literal["public", "private", "restricted"] = "public"
    join_policy: Literal["open", "approval", "invite_only"] = "open"
    metadata: dict[str, Any] = Field(default_factory=dict)


class MembershipRequest(BaseModel):
    subject_type: SubjectType = "user"
    subject_id: UUID | None = None


class MembershipAction(BaseModel):
    action: Literal["approve", "reject", "suspend", "ban", "restore"]


class PostCreate(BaseModel):
    content_id: UUID
    author_type: SubjectType = "user"
    author_id: UUID | None = None


class CommentCreate(BaseModel):
    post_id: UUID
    author_type: SubjectType = "user"
    author_id: UUID | None = None
    body: str = Field(min_length=1, max_length=10000)
    parent_id: UUID | None = None


class EventCreate(BaseModel):
    created_by_type: SubjectType = "user"
    created_by_id: UUID | None = None
    title: str = Field(min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=10000)
    starts_at: datetime
    ends_at: datetime | None = None
    location_type: Literal["online", "physical", "hybrid"] = "online"
    location_data: dict[str, Any] = Field(default_factory=dict)
    capacity: int | None = Field(default=None, gt=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ReportCreate(BaseModel):
    target_type: Literal["community", "post", "comment", "member", "event"]
    target_id: UUID
    reason_code: str = Field(min_length=1, max_length=100)
    notes: str | None = Field(default=None, max_length=5000)


class TopicCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    slug: str = Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=5000)
    interest_id: UUID | None = None


class TopicLink(BaseModel):
    topic_id: UUID


class WorldLink(BaseModel):
    world_id: UUID
    placement: str = Field(default="community", min_length=1, max_length=80)


class ModerationDecision(BaseModel):
    decision: Literal["dismissed", "resolved", "remove", "suspend_member", "ban_member", "escalated"]
    notes: str | None = Field(default=None, max_length=5000)


def _error(exc: SupabaseRestError) -> HTTPException:
    status = exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
    return HTTPException(status_code=status, detail={"code": "COMMUNITY_OPERATION_FAILED", "message": exc.message})


async def _subject(user: AuthenticatedUser, subject_type: SubjectType, subject_id: UUID | None) -> tuple[str, UUID]:
    resolved = subject_id or user.user_id
    if subject_type == "user":
        if resolved != user.user_id:
            raise HTTPException(status_code=403, detail={"code":"COMMUNITY_USER_OWNERSHIP_DENIED","message":"The user subject must be the authenticated user."})
    else:
        rows = await select(user, "agents", {"select":"id","id":f"eq.{resolved}","owner_user_id":f"eq.{user.user_id}","status":"neq.archived","limit":"1"})
        if not rows:
            raise HTTPException(status_code=404, detail={"code":"COMMUNITY_AGENT_NOT_FOUND","message":"The Agent is not owned by the authenticated user."})
    return subject_type, resolved


@router.get("")
async def list_communities(
    q: str | None = Query(default=None, max_length=160),
    visibility: Literal["public","private","restricted"] | None = None,
    limit: int = Query(default=30, ge=1, le=100),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    filters: dict[str,str] = {"status":"eq.active","order":"created_at.desc","limit":str(limit)}
    if visibility:
        filters["visibility"] = f"eq.{visibility}"
    if q:
        filters["or"] = f"(name.ilike.*{q}*,handle.ilike.*{q}*,description.ilike.*{q}*)"
    return {"data": await select(context["user"], "communities", {"select":"id,owner_type,owner_id,name,handle,description,visibility,status,join_policy,metadata,created_at,updated_at", **filters})}


@router.get("/{community_id:uuid}/topics")
async def list_topics(
    community_id: UUID,
    limit: int = Query(default=100, ge=1, le=200),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    rows = await select(
        context["user"],
        "community_topics",
        {
            "select": "id,community_id,interest_id,name,slug,description,status,created_by_user_id,created_at",
            "community_id": f"eq.{community_id}",
            "status": "eq.active",
            "order": "created_at.asc",
            "limit": str(limit),
        },
    )
    return {"data": rows}


@router.post("/{community_id:uuid}/topics", status_code=201)
async def create_topic(
    community_id: UUID,
    payload: TopicCreate,
    context: dict = Depends(get_auth_context),
) -> Any:
    try:
        return await rpc(
            context["user"],
            "create_community_topic",
            {
                "p_community_id": str(community_id),
                "p_name": payload.name,
                "p_slug": payload.slug,
                "p_description": payload.description,
                "p_interest_id": str(payload.interest_id) if payload.interest_id else None,
            },
        )
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.post("/{community_id:uuid}/topics/link", status_code=201)
async def link_topic(
    community_id: UUID,
    payload: TopicLink,
    context: dict = Depends(get_auth_context),
) -> Any:
    try:
        return await rpc(
            context["user"],
            "link_community_topic",
            {"p_community_id": str(community_id), "p_topic_id": str(payload.topic_id)},
        )
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.get("/{community_id:uuid}/world-links")
async def list_world_links(
    community_id: UUID,
    limit: int = Query(default=100, ge=1, le=200),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    rows = await select(
        context["user"],
        "universe_world_communities",
        {
            "select": "world_id,community_id,placement,created_at",
            "community_id": f"eq.{community_id}",
            "order": "created_at.asc",
            "limit": str(limit),
        },
    )
    return {"data": rows}


@router.post("/{community_id:uuid}/world-links", status_code=201)
async def link_world(
    community_id: UUID,
    payload: WorldLink,
    context: dict = Depends(get_auth_context),
) -> Any:
    try:
        return await rpc(
            context["user"],
            "link_community_to_world",
            {
                "p_world_id": str(payload.world_id),
                "p_community_id": str(community_id),
                "p_placement": payload.placement,
            },
        )
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.get("/{community_id:uuid}/moderation/cases")
async def list_moderation_cases(
    community_id: UUID,
    status: Literal["open", "resolved", "dismissed"] | None = None,
    limit: int = Query(default=100, ge=1, le=200),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    filters = {
        "community_id": f"eq.{community_id}",
        "order": "created_at.desc",
        "limit": str(limit),
    }
    if status:
        filters["decision"] = f"eq.{status}"
    return {
        "data": await select(
            context["user"],
            "community_moderation_cases",
            {
                "select": "id,community_id,report_id,target_type,target_id,decision,decided_by_user_id,notes,created_at,decided_at",
                **filters,
            },
        )
    }


@router.post("/{community_id:uuid}/moderation/cases/{case_id:uuid}/decision")
async def decide_moderation_case(
    community_id: UUID,
    case_id: UUID,
    payload: ModerationDecision,
    context: dict = Depends(get_auth_context),
) -> Any:
    try:
        return await rpc(
            context["user"],
            "decide_community_moderation_case",
            {
                "p_case_id": str(case_id),
                "p_decision": payload.decision,
                "p_notes": payload.notes,
            },
        )
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.get("/{community_id:uuid}")
async def get_community(community_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str,Any]:
    rows = await select(context["user"], "communities", {"select":"*","id":f"eq.{community_id}","limit":"1"})
    if not rows:
        raise HTTPException(status_code=404, detail={"code":"COMMUNITY_NOT_FOUND","message":"Community is not available."})
    return {"data":rows[0]}


@router.post("", status_code=201)
async def create_community(payload: CommunityCreate, context: dict = Depends(get_auth_context)) -> Any:
    user=context["user"]
    owner_id=payload.owner_id or user.user_id
    try:
        return await rpc(user,"create_community",{"p_owner_type":payload.owner_type,"p_owner_id":str(owner_id),"p_name":payload.name,"p_handle":payload.handle,"p_description":payload.description,"p_visibility":payload.visibility,"p_join_policy":payload.join_policy,"p_metadata":payload.metadata})
    except SupabaseRestError as exc:
        raise _error(exc) from exc


@router.get("/{community_id:uuid}/members")
async def list_members(community_id: UUID, status: Literal["pending","active","rejected","suspended","banned","left"] | None = None, limit: int = Query(default=100,ge=1,le=200), context: dict = Depends(get_auth_context)) -> dict[str,Any]:
    filters={"community_id":f"eq.{community_id}","order":"created_at.asc","limit":str(limit)}
    if status: filters["status"]=f"eq.{status}"
    return {"data":await select(context["user"],"community_memberships",{"select":"id,community_id,subject_type,subject_id,role,status,invited_by_user_id,joined_at,created_at,updated_at",**filters})}


@router.post("/{community_id:uuid}/members",status_code=201)
async def join_community(community_id: UUID,payload: MembershipRequest,context:dict=Depends(get_auth_context)) -> Any:
    subject_type,subject_id=await _subject(context["user"],payload.subject_type,payload.subject_id)
    try:
        return await rpc(context["user"],"join_community",{"p_community_id":str(community_id),"p_subject_type":subject_type,"p_subject_id":str(subject_id)})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.post("/{community_id:uuid}/leave")
async def leave_community(community_id: UUID,payload: MembershipRequest,context:dict=Depends(get_auth_context)) -> Any:
    subject_type,subject_id=await _subject(context["user"],payload.subject_type,payload.subject_id)
    try:
        return await rpc(context["user"],"leave_community",{"p_community_id":str(community_id),"p_subject_type":subject_type,"p_subject_id":str(subject_id)})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.post("/{community_id:uuid}/members/{membership_id}/action")
async def membership_action(community_id:UUID,membership_id:UUID,payload:MembershipAction,context:dict=Depends(get_auth_context)) -> Any:
    try: return await rpc(context["user"],"manage_community_membership",{"p_membership_id":str(membership_id),"p_action":payload.action})
    except SupabaseRestError as exc: raise _error(exc) from exc


@router.get("/{community_id:uuid}/posts")
async def list_posts(community_id:UUID,limit:int=Query(default=50,ge=1,le=100),context:dict=Depends(get_auth_context)) -> dict[str,Any]:
    return {"data":await select(context["user"],"community_posts",{"select":"id,community_id,content_id,author_type,author_id,status,pinned,created_at,updated_at","community_id":f"eq.{community_id}","status":"eq.active","order":"pinned.desc,created_at.desc","limit":str(limit)})}


@router.post("/{community_id:uuid}/posts",status_code=201)
async def create_post(community_id:UUID,payload:PostCreate,context:dict=Depends(get_auth_context)) -> Any:
    author_type,author_id=await _subject(context["user"],payload.author_type,payload.author_id)
    try:return await rpc(context["user"],"create_community_post",{"p_community_id":str(community_id),"p_content_id":str(payload.content_id),"p_author_type":author_type,"p_author_id":str(author_id)})
    except SupabaseRestError as exc:raise _error(exc) from exc


@router.get("/{community_id:uuid}/posts/{post_id:uuid}/comments")
async def list_comments(community_id:UUID,post_id:UUID,limit:int=Query(default=100,ge=1,le=200),context:dict=Depends(get_auth_context)) -> dict[str,Any]:
    return {"data":await select(context["user"],"community_comments",{"select":"id,community_id,post_id,parent_id,author_type,author_id,body,status,created_at,updated_at","community_id":f"eq.{community_id}","post_id":f"eq.{post_id}","status":"eq.active","order":"created_at.asc","limit":str(limit)})}


@router.post("/{community_id:uuid}/posts/{post_id:uuid}/comments",status_code=201)
async def create_comment(community_id:UUID,post_id:UUID,payload:CommentCreate,context:dict=Depends(get_auth_context)) -> Any:
    author_type,author_id=await _subject(context["user"],payload.author_type,payload.author_id)
    try:return await rpc(context["user"],"create_community_comment",{"p_community_id":str(community_id),"p_post_id":str(post_id),"p_author_type":author_type,"p_author_id":str(author_id),"p_body":payload.body,"p_parent_id":str(payload.parent_id) if payload.parent_id else None})
    except SupabaseRestError as exc:raise _error(exc) from exc


@router.get("/{community_id:uuid}/events")
async def list_events(community_id:UUID,limit:int=Query(default=50,ge=1,le=100),context:dict=Depends(get_auth_context)) -> dict[str,Any]:
    return {"data":await select(context["user"],"community_events",{"select":"id,community_id,created_by_type,created_by_id,title,description,starts_at,ends_at,location_type,location_data,status,capacity,metadata,created_at,updated_at","community_id":f"eq.{community_id}","status":"in.(published,completed)","order":"starts_at.asc","limit":str(limit)})}


@router.post("/{community_id:uuid}/events",status_code=201)
async def create_event(community_id:UUID,payload:EventCreate,context:dict=Depends(get_auth_context)) -> Any:
    creator_type,creator_id=await _subject(context["user"],payload.created_by_type,payload.created_by_id)
    try:return await rpc(context["user"],"create_community_event",{"p_community_id":str(community_id),"p_created_by_type":creator_type,"p_created_by_id":str(creator_id),"p_title":payload.title,"p_description":payload.description,"p_starts_at":payload.starts_at.isoformat(),"p_ends_at":payload.ends_at.isoformat() if payload.ends_at else None,"p_location_type":payload.location_type,"p_location_data":payload.location_data,"p_capacity":payload.capacity,"p_metadata":payload.metadata})
    except SupabaseRestError as exc:raise _error(exc) from exc


@router.post("/{community_id:uuid}/events/{event_id:uuid}/rsvp",status_code=201)
async def rsvp(community_id:UUID,event_id:UUID,payload:MembershipRequest,context:dict=Depends(get_auth_context)) -> Any:
    subject_type,subject_id=await _subject(context["user"],payload.subject_type,payload.subject_id)
    try:return await rpc(context["user"],"rsvp_community_event",{"p_event_id":str(event_id),"p_subject_type":subject_type,"p_subject_id":str(subject_id)})
    except SupabaseRestError as exc:raise _error(exc) from exc


@router.post("/{community_id:uuid}/reports",status_code=201)
async def report(community_id:UUID,payload:ReportCreate,context:dict=Depends(get_auth_context)) -> Any:
    try:return await rpc(context["user"],"report_community_target",{"p_community_id":str(community_id),"p_target_type":payload.target_type,"p_target_id":str(payload.target_id),"p_reason_code":payload.reason_code,"p_notes":payload.notes})
    except SupabaseRestError as exc:raise _error(exc) from exc
