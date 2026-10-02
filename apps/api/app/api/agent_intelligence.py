from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.services.agent_intelligence import AgentIntelligenceError, agent_intelligence_on_content


router = APIRouter(prefix="/api/v1/discovery", tags=["Allpha Universe Discovery"])


class AgentIntelligenceRequest(BaseModel):
    agent_id: UUID
    focus: str | None = Field(default=None, max_length=4000)
    query_embedding: str | None = Field(default=None, min_length=3)
    rag_limit: int = Field(default=5, ge=1, le=20)
    action_request: str | None = Field(default=None, max_length=4000)


def _error(exc: AgentIntelligenceError) -> HTTPException:
    status = exc.status_code if exc.status_code in {400, 403, 404, 409, 422, 502, 503, 504} else 500
    return HTTPException(status_code=status, detail={"code": exc.code, "message": str(exc)})


@router.post("/content/{content_id}/agent-intelligence")
async def agent_intelligence_endpoint(
    content_id: UUID,
    payload: AgentIntelligenceRequest,
    context: dict[str, Any] = Depends(get_auth_context),
) -> dict[str, Any]:
    try:
        result = await agent_intelligence_on_content(
            context["user"],
            content_id=content_id,
            agent_id=payload.agent_id,
            focus=payload.focus,
            query_embedding=payload.query_embedding,
            rag_limit=payload.rag_limit,
            action_request=payload.action_request,
        )
        return {"data": result}
    except AgentIntelligenceError as exc:
        raise _error(exc) from exc
