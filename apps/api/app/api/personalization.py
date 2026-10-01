from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import rpc, select


router = APIRouter(prefix="/api/v1/personalization", tags=["Personalization Intelligence"])

SubjectType = Literal["user", "agent"]


class SubjectRef(BaseModel):
    subject_type: SubjectType = "user"
    subject_id: UUID | None = None


class InterestMutationRequest(BaseModel):
    interest_id: UUID
    score: float = Field(default=1, ge=-1, le=1)
    confidence: float = Field(default=1, ge=0, le=1)


class SignalRequest(BaseModel):
    subject_type: SubjectType = "user"
    subject_id: UUID | None = None
    signal_type: str = Field(min_length=1, max_length=64)
    interest_id: UUID | None = None
    entity_type: str | None = Field(default=None, max_length=80)
    entity_id: UUID | None = None
    strength: float = Field(default=1, ge=0, le=1)
    occurred_at: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class GoalCreateRequest(BaseModel):
    subject_type: SubjectType = "user"
    subject_id: UUID | None = None
    title: str = Field(min_length=1, max_length=240)
    description: str | None = None
    goal_type: str | None = Field(default=None, max_length=80)
    priority: int = 0
    target_at: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class GoalUpdateRequest(BaseModel):
    status: str | None = None
    title: str | None = Field(default=None, max_length=240)
    description: str | None = None
    priority: int | None = None
    target_at: str | None = None
    context: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None


async def _resolve_subject(user: AuthenticatedUser, ref: SubjectRef | SignalRequest | GoalCreateRequest) -> tuple[str, UUID]:
    subject_id = ref.subject_id or user.user_id
    if ref.subject_type == "user":
        if subject_id != user.user_id:
            raise HTTPException(status_code=403, detail={"code": "USER_OWNERSHIP_DENIED", "message": "The authenticated user may only access their own personalization graph."})
        return "user", subject_id
    rows = await select(user, "agents", {
        "select": "id",
        "id": f"eq.{subject_id}",
        "owner_user_id": f"eq.{user.user_id}",
        "limit": "1",
    })
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "AGENT_NOT_FOUND", "message": "Agent was not found or is not owned by the authenticated user."})
    return "agent", subject_id


def _subject_filter(subject_type: str, subject_id: UUID) -> dict[str, str]:
    return {"user_id": f"eq.{subject_id}"} if subject_type == "user" else {"agent_id": f"eq.{subject_id}"}


@router.get("/ontology/interests")
async def list_interests(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    return {"data": await select(user, "interest_nodes", {
        "select": "id,parent_id,canonical_key,name,description,ontology_type,status,localization,metadata,version",
        "status": "eq.active",
        "order": "name.asc",
    })}


@router.get("/me")
async def get_my_personalization(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    return await _snapshot(user, "user", user.user_id)


@router.get("/agents/{agent_id}")
async def get_agent_personalization(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    await _resolve_subject(user, SubjectRef(subject_type="agent", subject_id=agent_id))
    return await _snapshot(user, "agent", agent_id)


async def _snapshot(user: AuthenticatedUser, subject_type: str, subject_id: UUID) -> dict[str, Any]:
    filters = _subject_filter(subject_type, subject_id)
    affinities = await select(user, "subject_interest_affinities", {
        "select": "id,interest_id,score,confidence,evidence_count,positive_evidence,negative_evidence,first_observed_at,last_observed_at,updated_at",
        **filters,
        "order": "score.desc",
    })
    interest_ids = [row["interest_id"] for row in affinities]
    nodes: list[dict[str, Any]] = []
    if interest_ids:
        nodes = await select(user, "interest_nodes", {
            "select": "id,parent_id,canonical_key,name,description,ontology_type",
            "id": "in.(" + ",".join(interest_ids) + ")",
            "status": "eq.active",
        })
    node_by_id = {row["id"]: row for row in nodes}
    for row in affinities:
        row["interest"] = node_by_id.get(row["interest_id"])
    return {
        "subject": {"type": subject_type, "id": str(subject_id)},
        "interests": affinities,
        "passions": await select(user, "passion_clusters", {
            "select": "id,name,status,confidence,evidence_count,first_observed_at,last_observed_at,metadata,updated_at",
            **filters,
            "order": "confidence.desc",
        }),
        "habits": await select(user, "habit_patterns", {
            "select": "id,pattern_type,pattern_key,pattern,confidence,evidence_count,first_observed_at,last_observed_at,status,updated_at",
            **filters,
            "order": "confidence.desc",
        }),
        "goals": await select(user, "personalization_goals", {
            "select": "id,title,description,goal_type,status,priority,target_at,context,metadata,created_at,updated_at",
            **filters,
            "order": "updated_at.desc",
        }),
    }


@router.post("/interests")
async def set_interest(payload: InterestMutationRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    return await rpc(user, "set_subject_interest", {
        "p_subject_type": "user",
        "p_subject_id": str(user.user_id),
        "p_interest_id": str(payload.interest_id),
        "p_score": payload.score,
        "p_confidence": payload.confidence,
    })


@router.delete("/interests/{interest_id}")
async def remove_interest(interest_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    return await rpc(user, "remove_subject_interest", {
        "p_subject_type": "user",
        "p_subject_id": str(user.user_id),
        "p_interest_id": str(interest_id),
    })


@router.post("/signals", status_code=201)
async def record_signal(payload: SignalRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    subject_type, subject_id = await _resolve_subject(user, payload)
    return await rpc(user, "record_personalization_signal", {
        "p_subject_type": subject_type,
        "p_subject_id": str(subject_id),
        "p_signal_type": payload.signal_type,
        "p_interest_id": str(payload.interest_id) if payload.interest_id else None,
        "p_entity_type": payload.entity_type,
        "p_entity_id": str(payload.entity_id) if payload.entity_id else None,
        "p_strength": payload.strength,
        "p_occurred_at": payload.occurred_at,
        "p_context": payload.context,
        "p_metadata": payload.metadata,
    })


@router.post("/refresh")
async def refresh(payload: SubjectRef = SubjectRef(), context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    subject_type, subject_id = await _resolve_subject(user, payload)
    return await rpc(user, "refresh_subject_personalization", {
        "p_subject_type": subject_type,
        "p_subject_id": str(subject_id),
    })


@router.post("/goals", status_code=201)
async def create_goal(payload: GoalCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    subject_type, subject_id = await _resolve_subject(user, payload)
    return await rpc(user, "create_personalization_goal", {
        "p_subject_type": subject_type,
        "p_subject_id": str(subject_id),
        "p_title": payload.title,
        "p_description": payload.description,
        "p_goal_type": payload.goal_type,
        "p_priority": payload.priority,
        "p_target_at": payload.target_at,
        "p_context": payload.context,
        "p_metadata": payload.metadata,
    })


@router.patch("/goals/{goal_id}")
async def update_goal(goal_id: UUID, payload: GoalUpdateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    return await rpc(user, "update_personalization_goal", {
        "p_goal_id": str(goal_id),
        "p_status": payload.status,
        "p_title": payload.title,
        "p_description": payload.description,
        "p_priority": payload.priority,
        "p_target_at": payload.target_at,
        "p_context": payload.context,
        "p_metadata": payload.metadata,
    })
