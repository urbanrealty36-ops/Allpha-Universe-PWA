from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/agents", tags=["Agents"])


class AgentCommandRequest(BaseModel):
    command: str


@router.post("/{agent_id}/command", status_code=501)
async def command(agent_id: str, payload: AgentCommandRequest) -> None:
    raise HTTPException(
        status_code=501,
        detail={
            "code": "AGENT_RUNTIME_NOT_ACTIVATED",
            "agent_id": agent_id,
            "message": "Agent runtime, policy, risk, approval and execution workflow will be activated in its implementation phase.",
        },
    )
