from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, rpc, select

router=APIRouter(prefix="/api/v1/spatial-runtime",tags=["Agent Simulation & Spatial Runtime"])

MovementState=Literal["idle","moving","exploring","interacting","collaborating","shopping","negotiating","awaiting_approval","sleeping"]
InteractionType=Literal["proximity","conversation","collaboration","shopping","negotiation","handoff","custom"]
SubjectType=Literal["user","agent"]

class EnterSimulation(BaseModel):
    agent_id:UUID
    position:dict[str,Any]=Field(default_factory=lambda:{"x":0,"y":0,"z":0})
    rotation:dict[str,Any]=Field(default_factory=lambda:{"x":0,"y":0,"z":0})
    zone_key:str|None=None

class SpatialUpdate(BaseModel):
    agent_id:UUID
    movement_state:MovementState
    position:dict[str,Any]|None=None
    rotation:dict[str,Any]|None=None
    zone_key:str|None=None
    target_position:dict[str,Any]|None=None
    speed:float=Field(default=0,ge=0)
    metadata:dict[str,Any]=Field(default_factory=dict)

class InteractionCreate(BaseModel):
    initiator_type:SubjectType
    initiator_id:UUID
    target_type:SubjectType
    target_id:UUID
    interaction_type:InteractionType
    payload:dict[str,Any]=Field(default_factory=dict)

class InteractionResolve(BaseModel):
    status:Literal["accepted","declined","completed","cancelled"]
    result:dict[str,Any]=Field(default_factory=dict)

class SimulationStart(BaseModel):
    tick_rate_hz:float=Field(default=10,gt=0,le=60)
    metadata:dict[str,Any]=Field(default_factory=dict)

class Tick(BaseModel):
    tick_number:int=Field(ge=1)
    event_count:int=Field(default=0,ge=0)
    state_hash:str|None=None
    metadata:dict[str,Any]=Field(default_factory=dict)

def err(e:SupabaseRestError,code:str)->HTTPException:
    return HTTPException(status_code=e.status_code if e.status_code in {400,401,403,404,409,422} else 500,detail={"code":code,"message":e.message})

@router.get("/worlds/{world_id}/agents/{agent_id}/context")
async def spatial_agent_context(world_id:UUID,agent_id:UUID,context:dict=Depends(get_auth_context)):
    """Authoritative spatial context adapter; presentation never grants authority."""
    try:
        state=await select(context["user"],"agent_spatial_states",{"select":"*","world_id":f"eq.{world_id}","agent_id":f"eq.{agent_id}","limit":"1"})
        if not state:
            raise HTTPException(404,detail={"code":"SPATIAL_STATE_NOT_FOUND"})
        s=state[0]
        zones=await select(context["user"],"district_zones",{"select":"id,district_id,zone_key,name,zone_type,spatial_config","zone_key":f"eq.{s.get('zone_key')}","limit":"1"}) if s.get("zone_key") else []
        district=None
        booths=[]
        if zones:
            district_rows=await select(context["user"],"districts",{"select":"id,world_id,name,theme_key,spatial_config","id":f"eq.{zones[0].get('district_id')}","world_id":f"eq.{world_id}","limit":"1"})
            district=district_rows[0] if district_rows else None
            if district:
                booths=await select(context["user"],"booths",{"select":"id,name,theme_key,district_zone_id,scene_config,display_config","district_id":f"eq.{district['id']}","district_zone_id":f"eq.{zones[0]['id']}","limit":"50"})
        return {"data":{"spatial_state":s,"zone":zones[0] if zones else None,"district":district,"booths":booths,"authority":{"source":"existing_agent_policy_and_domain_rls","spatial_context_grants_permission":False}}}
    except SupabaseRestError as e:
        raise err(e,"SPATIAL_CONTEXT_BUILD_FAILED")

@router.get("/worlds/{world_id}/states")
async def states(world_id:UUID,limit:int=Query(200,ge=1,le=500),context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"agent_spatial_states",{"select":"*","world_id":f"eq.{world_id}","order":"updated_at.desc","limit":str(limit)})}

@router.post("/worlds/{world_id}/agents/enter",status_code=201)
async def enter(world_id:UUID,p:EnterSimulation,context:dict=Depends(get_auth_context)):
    try:
        return await rpc(context["user"],"enter_agent_simulation",{"p_world_id":str(world_id),"p_agent_id":str(p.agent_id),"p_position":p.position,"p_rotation":p.rotation,"p_zone_key":p.zone_key})
    except SupabaseRestError as e: raise err(e,"SPATIAL_AGENT_ENTER_FAILED")

@router.patch("/worlds/{world_id}/agents/{agent_id}/state")
async def update_state(world_id:UUID,agent_id:UUID,p:SpatialUpdate,context:dict=Depends(get_auth_context)):
    if p.agent_id!=agent_id: raise HTTPException(422,detail={"code":"SPATIAL_AGENT_ID_MISMATCH"})
    try:
        return await rpc(context["user"],"update_agent_spatial_state",{"p_world_id":str(world_id),"p_agent_id":str(agent_id),"p_movement_state":p.movement_state,"p_position":p.position,"p_rotation":p.rotation,"p_zone_key":p.zone_key,"p_target_position":p.target_position,"p_speed":p.speed,"p_metadata":p.metadata})
    except SupabaseRestError as e: raise err(e,"SPATIAL_STATE_UPDATE_FAILED")

@router.delete("/worlds/{world_id}/agents/{agent_id}")
async def exit(world_id:UUID,agent_id:UUID,context:dict=Depends(get_auth_context)):
    try: return await rpc(context["user"],"exit_agent_simulation",{"p_world_id":str(world_id),"p_agent_id":str(agent_id)})
    except SupabaseRestError as e: raise err(e,"SPATIAL_AGENT_EXIT_FAILED")

@router.get("/worlds/{world_id}/interactions")
async def interactions(world_id:UUID,status:str|None=None,limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context)):
    q={"select":"*","world_id":f"eq.{world_id}","order":"created_at.desc","limit":str(limit)}
    if status:q["status"]=f"eq.{status}"
    return {"data":await select(context["user"],"spatial_interactions",q)}

@router.post("/worlds/{world_id}/interactions",status_code=201)
async def create_interaction(world_id:UUID,p:InteractionCreate,context:dict=Depends(get_auth_context)):
    try:
        return await rpc(context["user"],"create_spatial_interaction",{"p_world_id":str(world_id),"p_initiator_type":p.initiator_type,"p_initiator_id":str(p.initiator_id),"p_target_type":p.target_type,"p_target_id":str(p.target_id),"p_interaction_type":p.interaction_type,"p_payload":p.payload})
    except SupabaseRestError as e: raise err(e,"SPATIAL_INTERACTION_CREATE_FAILED")

@router.post("/interactions/{interaction_id}/resolve")
async def resolve_interaction(interaction_id:UUID,p:InteractionResolve,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"resolve_spatial_interaction",{"p_interaction_id":str(interaction_id),"p_status":p.status,"p_result":p.result})
    except SupabaseRestError as e: raise err(e,"SPATIAL_INTERACTION_RESOLVE_FAILED")

@router.get("/worlds/{world_id}/sessions")
async def sessions(world_id:UUID,limit:int=Query(20,ge=1,le=100),context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"simulation_sessions",{"select":"*","world_id":f"eq.{world_id}","order":"created_at.desc","limit":str(limit)})}

@router.post("/worlds/{world_id}/sessions",status_code=201)
async def start_session(world_id:UUID,p:SimulationStart,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"start_world_simulation",{"p_world_id":str(world_id),"p_tick_rate_hz":p.tick_rate_hz,"p_metadata":p.metadata})
    except SupabaseRestError as e: raise err(e,"SIMULATION_START_FAILED")

@router.post("/sessions/{session_id}/pause")
async def pause(session_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"pause_world_simulation",{"p_session_id":str(session_id)})
    except SupabaseRestError as e: raise err(e,"SIMULATION_PAUSE_FAILED")

@router.post("/sessions/{session_id}/resume")
async def resume(session_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"resume_world_simulation",{"p_session_id":str(session_id)})
    except SupabaseRestError as e: raise err(e,"SIMULATION_RESUME_FAILED")

@router.post("/sessions/{session_id}/stop")
async def stop(session_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"stop_world_simulation",{"p_session_id":str(session_id)})
    except SupabaseRestError as e: raise err(e,"SIMULATION_STOP_FAILED")

@router.post("/sessions/{session_id}/advance")
async def advance(session_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"advance_world_simulation_tick",{"p_session_id":str(session_id)})
    except SupabaseRestError as e: raise err(e,"SIMULATION_ADVANCE_TICK_FAILED")

@router.get("/sessions/{session_id}/ticks")
async def ticks(session_id:UUID,limit:int=Query(100,ge=1,le=500),context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"simulation_ticks",{"select":"*","session_id":f"eq.{session_id}","order":"tick_number.desc","limit":str(limit)})}

@router.post("/sessions/{session_id}/ticks")
async def record_tick(session_id:UUID,p:Tick,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"record_simulation_tick",{"p_session_id":str(session_id),"p_tick_number":p.tick_number,"p_event_count":p.event_count,"p_state_hash":p.state_hash,"p_metadata":p.metadata})
    except SupabaseRestError as e: raise err(e,"SIMULATION_TICK_FAILED")

@router.get("/worlds/{world_id}/events")
async def events(world_id:UUID,limit:int=Query(100,ge=1,le=500),context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"spatial_runtime_events",{"select":"*","world_id":f"eq.{world_id}","order":"occurred_at.desc","limit":str(limit)})}
