from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.agent_runtime import AgentRuntimeError, begin_execution, execute_command
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, rpc, select

router = APIRouter(prefix="/api/v1/workflows", tags=["Workflow & Mission Engine"])

OwnerType = Literal["user", "agent"]
Risk = Literal["low", "medium", "high", "critical"]

class WorkflowCreate(BaseModel):
    owner_type: OwnerType = "user"
    owner_id: UUID | None = None
    name: str = Field(min_length=1, max_length=160)
    slug: str = Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=5000)
    trigger_type: Literal["manual", "event", "schedule", "webhook"] = "manual"
    metadata: dict[str, Any] = Field(default_factory=dict)

class VersionCreate(BaseModel):
    input_schema: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)

class StepCreate(BaseModel):
    step_key: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=5000)
    sequence_no: int = Field(gt=0)
    tool_key: str = Field(min_length=1, max_length=160)
    arguments: dict[str, Any] = Field(default_factory=dict)
    input_schema: dict[str, Any] = Field(default_factory=dict)
    condition: dict[str, Any] = Field(default_factory=dict)
    retry_policy: dict[str, Any] = Field(default_factory=dict)
    risk_level: Risk = "low"
    requires_approval: bool = False

class WorkflowRunCreate(BaseModel):
    workflow_version_id: UUID
    agent_id: UUID
    input: dict[str, Any] = Field(default_factory=dict)

class MissionCreate(BaseModel):
    owner_type: OwnerType = "user"
    owner_id: UUID | None = None
    workflow_id: UUID
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    visibility: Literal["public", "private", "restricted"] = "public"
    join_policy: Literal["open", "approval", "invite_only"] = "open"
    max_participants: int | None = Field(default=None, gt=0)
    metadata: dict[str, Any] = Field(default_factory=dict)

class MissionJoin(BaseModel):
    subject_type: Literal["user", "agent"] = "user"
    subject_id: UUID | None = None

class MissionDecision(BaseModel):
    decision: Literal["approve", "reject"]

class MissionRunCreate(BaseModel):
    participant_id: UUID
    agent_id: UUID
    input: dict[str, Any] = Field(default_factory=dict)

def _error(exc: SupabaseRestError, code: str) -> HTTPException:
    status = exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
    return HTTPException(status_code=status, detail={"code": code, "message": exc.message})

def _runtime_error(exc: AgentRuntimeError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)})

def _subject(user: AuthenticatedUser, subject_type: str, subject_id: UUID | None) -> tuple[str, UUID]:
    resolved = subject_id or user.user_id
    if subject_type == "user" and resolved != user.user_id:
        raise HTTPException(status_code=403, detail={"code":"WORKFLOW_SUBJECT_DENIED","message":"The user subject must be the authenticated user."})
    return subject_type, resolved

@router.get("")
async def list_workflows(status: Literal["draft","active","archived"] | None = None, limit: int = Query(50, ge=1, le=100), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    q={"select":"*","order":"updated_at.desc","limit":str(limit)}
    if status: q["status"]=f"eq.{status}"
    return {"data": await select(context["user"], "workflows", q)}

@router.post("", status_code=201)
async def create_workflow(payload: WorkflowCreate, context: dict = Depends(get_auth_context)) -> Any:
    owner_id=payload.owner_id or context["user"].user_id
    try:
        return await rpc(context["user"], "create_workflow", {"p_owner_type":payload.owner_type,"p_owner_id":str(owner_id),"p_name":payload.name,"p_slug":payload.slug,"p_description":payload.description,"p_trigger_type":payload.trigger_type,"p_metadata":payload.metadata})
    except SupabaseRestError as exc: raise _error(exc,"WORKFLOW_CREATE_FAILED") from exc

@router.post("/{workflow_id}/versions", status_code=201)
async def create_version(workflow_id: UUID, payload: VersionCreate, context: dict = Depends(get_auth_context)) -> Any:
    try: return await rpc(context["user"],"create_workflow_version",{"p_workflow_id":str(workflow_id),"p_input_schema":payload.input_schema,"p_metadata":payload.metadata})
    except SupabaseRestError as exc: raise _error(exc,"WORKFLOW_VERSION_CREATE_FAILED") from exc

@router.post("/versions/{version_id}/steps", status_code=201)
async def add_step(version_id: UUID, payload: StepCreate, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"],"add_workflow_step",{"p_workflow_version_id":str(version_id),"p_step_key":payload.step_key,"p_title":payload.title,"p_description":payload.description,"p_sequence_no":payload.sequence_no,"p_tool_key":payload.tool_key,"p_arguments":payload.arguments,"p_input_schema":payload.input_schema,"p_condition":payload.condition,"p_retry_policy":payload.retry_policy,"p_risk_level":payload.risk_level,"p_requires_approval":payload.requires_approval})
    except SupabaseRestError as exc: raise _error(exc,"WORKFLOW_STEP_CREATE_FAILED") from exc

@router.post("/versions/{version_id}/publish")
async def publish_version(version_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try: return await rpc(context["user"],"publish_workflow_version",{"p_workflow_version_id":str(version_id)})
    except SupabaseRestError as exc: raise _error(exc,"WORKFLOW_PUBLISH_FAILED") from exc

@router.get("/versions/{version_id}/steps")
async def list_steps(version_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    return {"data":await select(context["user"],"workflow_steps",{"select":"*","workflow_version_id":f"eq.{version_id}","enabled":"eq.true","order":"sequence_no.asc"})}

@router.get("/runs")
async def list_runs(limit: int = Query(50, ge=1, le=100), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    return {"data":await select(context["user"],"workflow_runs",{"select":"*","order":"created_at.desc","limit":str(limit)})}

@router.get("/runs/{run_id}")
async def get_run(run_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    rows=await select(context["user"],"workflow_runs",{"select":"*","id":f"eq.{run_id}","limit":"1"})
    if not rows: raise HTTPException(status_code=404,detail={"code":"WORKFLOW_RUN_NOT_FOUND","message":"Workflow run is not available."})
    steps=await select(context["user"],"workflow_run_steps",{"select":"*","workflow_run_id":f"eq.{run_id}","order":"created_at.asc"})
    events=await select(context["user"],"workflow_events",{"select":"*","workflow_run_id":f"eq.{run_id}","order":"created_at.desc","limit":"100"})
    return {"data":{"run":rows[0],"steps":steps,"events":events}}

@router.post("/runs", status_code=201)
async def create_run(payload: WorkflowRunCreate, context: dict = Depends(get_auth_context)) -> Any:
    try: return await rpc(context["user"],"create_workflow_run",{"p_workflow_version_id":str(payload.workflow_version_id),"p_agent_id":str(payload.agent_id),"p_input":payload.input})
    except SupabaseRestError as exc: raise _error(exc,"WORKFLOW_RUN_CREATE_FAILED") from exc

@router.post("/runs/{run_id}/prepare")
async def prepare_run(run_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try: return await rpc(context["user"],"prepare_workflow_run",{"p_workflow_run_id":str(run_id)})
    except SupabaseRestError as exc: raise _error(exc,"WORKFLOW_RUN_PREPARE_FAILED") from exc

@router.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: UUID, payload: dict[str, str | None] | None = None, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return {"data": await rpc(context["user"], "cancel_workflow_run", {"p_workflow_run_id": str(run_id), "p_reason": (payload or {}).get("reason")})}
    except SupabaseRestError as exc:
        raise _error(exc, "WORKFLOW_RUN_CANCEL_FAILED") from exc

@router.post("/runs/{run_id}/execute")
async def execute_run(run_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user=context["user"]
    try:
        rows=await select(user,"workflow_runs",{"select":"id,command_id,status","id":f"eq.{run_id}","limit":"1"})
        if not rows: raise HTTPException(status_code=404,detail={"code":"WORKFLOW_RUN_NOT_FOUND","message":"Workflow run is not available."})
        run=rows[0]
        if not run.get("command_id"):
            prepared=await rpc(user,"prepare_workflow_run",{"p_workflow_run_id":str(run_id)})
            run=prepared.get("workflow_run",run)
        command_id=UUID(str(run["command_id"]))
        state=await begin_execution(user,command_id) if run.get("status") in {"ready","preparing","created"} else {"status":run.get("status")}
        if state.get("status") == "waiting_approval":
            synced=await rpc(user,"sync_workflow_run",{"p_workflow_run_id":str(run_id)})
            return {"data":synced}
        if state.get("status") == "running" or run.get("status") in {"running","waiting_approval"}:
            try: await execute_command(user,command_id)
            except AgentRuntimeError as exc:
                if exc.code not in {"AGENT_APPROVAL_REQUIRED","AGENT_EXECUTION_START_FAILED"}: raise
        synced=await rpc(user,"sync_workflow_run",{"p_workflow_run_id":str(run_id)})
        return {"data":synced}
    except HTTPException: raise
    except AgentRuntimeError as exc: raise _runtime_error(exc) from exc
    except SupabaseRestError as exc: raise _error(exc,"WORKFLOW_RUN_EXECUTION_FAILED") from exc

@router.get("/missions")
async def list_missions(status: Literal["draft","open","active","completed","cancelled","archived"] | None = None, limit: int = Query(50, ge=1, le=100), context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    q={"select":"*","order":"created_at.desc","limit":str(limit)}
    if status: q["status"]=f"eq.{status}"
    return {"data":await select(context["user"],"missions",q)}

@router.post("/missions", status_code=201)
async def create_mission(payload: MissionCreate, context: dict = Depends(get_auth_context)) -> Any:
    owner_id=payload.owner_id or context["user"].user_id
    try:return await rpc(context["user"],"create_mission",{"p_owner_type":payload.owner_type,"p_owner_id":str(owner_id),"p_workflow_id":str(payload.workflow_id),"p_name":payload.name,"p_description":payload.description,"p_visibility":payload.visibility,"p_join_policy":payload.join_policy,"p_max_participants":payload.max_participants,"p_metadata":payload.metadata})
    except SupabaseRestError as exc:raise _error(exc,"MISSION_CREATE_FAILED") from exc

@router.post("/missions/{mission_id}/publish")
async def publish_mission(mission_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    try: return await rpc(context["user"],"publish_mission",{"p_mission_id":str(mission_id)})
    except SupabaseRestError as exc: raise _error(exc,"MISSION_PUBLISH_FAILED") from exc

@router.post("/missions/{mission_id}/join", status_code=201)
async def join_mission(mission_id: UUID,payload: MissionJoin,context:dict=Depends(get_auth_context)) -> Any:
    subject_type,subject_id=_subject(context["user"],payload.subject_type,payload.subject_id)
    try:return await rpc(context["user"],"join_mission",{"p_mission_id":str(mission_id),"p_subject_type":subject_type,"p_subject_id":str(subject_id)})
    except SupabaseRestError as exc:raise _error(exc,"MISSION_JOIN_FAILED") from exc

@router.post("/missions/participants/{participant_id}/decision")
async def decide_participant(participant_id: UUID, payload: MissionDecision, context: dict = Depends(get_auth_context)) -> Any:
    try: return await rpc(context["user"],"decide_mission_participant",{"p_participant_id":str(participant_id),"p_decision":payload.decision})
    except SupabaseRestError as exc: raise _error(exc,"MISSION_PARTICIPANT_DECISION_FAILED") from exc

@router.get("/missions/{mission_id}/participants")
async def mission_participants(mission_id:UUID,context:dict=Depends(get_auth_context))->dict[str,Any]:
    return {"data":await select(context["user"],"mission_participants",{"select":"*","mission_id":f"eq.{mission_id}","order":"created_at.asc"})}

@router.post("/missions/{mission_id}/runs", status_code=201)
async def start_mission(mission_id:UUID,payload:MissionRunCreate,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"start_mission_run",{"p_mission_id":str(mission_id),"p_participant_id":str(payload.participant_id),"p_agent_id":str(payload.agent_id),"p_input":payload.input})
    except SupabaseRestError as exc:raise _error(exc,"MISSION_RUN_START_FAILED") from exc

@router.post("/missions/runs/{mission_run_id}/cancel")
async def cancel_mission_run(mission_run_id: UUID, payload: dict[str, str | None] | None = None, context: dict = Depends(get_auth_context)) -> Any:
    try:
        return {"data": await rpc(context["user"], "cancel_mission_run", {"p_mission_run_id": str(mission_run_id), "p_reason": (payload or {}).get("reason")})}
    except SupabaseRestError as exc:
        raise _error(exc, "MISSION_RUN_CANCEL_FAILED") from exc

@router.post("/missions/runs/{mission_run_id}/execute")
async def execute_mission(mission_run_id:UUID,context:dict=Depends(get_auth_context))->Any:
    try:
        rows=await select(context["user"],"mission_runs",{"select":"id,workflow_run_id,status","id":f"eq.{mission_run_id}","limit":"1"})
        if not rows: raise HTTPException(status_code=404,detail={"code":"MISSION_RUN_NOT_FOUND","message":"Mission run is not available."})
        wr=rows[0].get("workflow_run_id")
        if not wr: raise HTTPException(status_code=409,detail={"code":"MISSION_RUN_NOT_READY","message":"Mission run has no workflow run."})
        result=await execute_run(wr,context)
        synced=await rpc(context["user"],"sync_mission_run",{"p_mission_run_id":str(mission_run_id)})
        return {"data":synced,"workflow":result}
    except HTTPException: raise
    except SupabaseRestError as exc:raise _error(exc,"MISSION_RUN_EXECUTION_FAILED") from exc

@router.get("/missions/runs")
async def list_mission_runs(limit:int=Query(50,ge=1,le=100),context:dict=Depends(get_auth_context))->dict[str,Any]:
    return {"data":await select(context["user"],"mission_runs",{"select":"*","order":"created_at.desc","limit":str(limit)})}
