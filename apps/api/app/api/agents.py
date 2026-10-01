from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.auth import AuthenticatedUser, require_auth


class AgentCommandRequest(BaseModel):
    command: str


router = APIRouter(prefix="/api/v1/agents", tags=["Agents"])


@router.post("/{agent_id}/command", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def command_agent(
    agent_id: UUID,
    payload: AgentCommandRequest,
    user: AuthenticatedUser = Depends(require_auth),
) -> None:
    if not payload.command.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "AGENT_COMMAND_EMPTY",
                "message": "Agent command must not be empty.",
            },
        )
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "code": "AGENT_RUNTIME_NOT_ACTIVATED",
            "agent_id": str(agent_id),
            "owner_user_id": str(user.user_id),
            "message": "Agent runtime, policy, risk and workflow execution are not activated yet.",
        },
    )
