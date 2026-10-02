from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.agent_context import build_agent_context
from app.core.agent_context_retrieval import retrieve_agent_context

router = APIRouter(prefix="/api/v1/agent-context", tags=["Agent Context & Learning"])


class AgentContextRetrievalRequest(BaseModel):
    query: str | None = Field(default=None, max_length=500)
    query_embedding: list[float] | None = Field(default=None, max_length=4096)
    limit: int = Field(default=8, ge=1, le=20)


@router.get("/{agent_id}")
async def get_agent_context(
    agent_id: UUID,
    world_id: UUID | None = Query(default=None),
    district_id: UUID | None = Query(default=None),
    memory_limit: int = Query(default=8, ge=1, le=20),
    knowledge_limit: int = Query(default=8, ge=1, le=20),
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    return {"data": await build_agent_context(
        context["user"], agent_id, world_id=world_id, district_id=district_id,
        memory_limit=memory_limit, knowledge_limit=knowledge_limit,
    )}


@router.post("/{agent_id}/retrieve")
async def retrieve_context(
    agent_id: UUID,
    request: AgentContextRetrievalRequest,
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    return {"data": await retrieve_agent_context(
        context["user"], agent_id, query=request.query,
        query_embedding=request.query_embedding, limit=request.limit,
    )}
