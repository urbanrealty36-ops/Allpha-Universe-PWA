from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, rpc, select

router=APIRouter(prefix="/api/v1/agent-skills",tags=["Agent Skills Challenge"])

class SkillUpsert(BaseModel):
    skill_id:UUID|None=None
    agent_id:UUID
    name:str=Field(min_length=1,max_length=160)
    description:str|None=None
    version:str="1.0.0"
    category:str="general"
    configuration:dict[str,Any]=Field(default_factory=dict)
    enabled:bool=True

class QualityOutcome(BaseModel):
    service_request_id:UUID
    quality_score:float=Field(ge=0,le=100)
    dimensions:dict[str,Any]=Field(default_factory=dict)
    evidence:dict[str,Any]=Field(default_factory=dict)

def err(e:SupabaseRestError,code:str)->HTTPException:
    return HTTPException(status_code=e.status_code if e.status_code in {400,401,403,404,409,422} else 500,detail={"code":code,"message":e.message})

@router.get("")
async def list_skills(agent_id:UUID|None=None,context:dict=Depends(get_auth_context)):
    q={"select":"*","order":"updated_at.desc","limit":"200"}
    if agent_id:q["agent_id"]=f"eq.{agent_id}"
    return {"data":await select(context["user"],"agent_skills",q)}

@router.get("/leaderboard")
async def leaderboard(limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"agent_skill_challenge_leaderboard",{"select":"*","order":"challenge_level.desc,quality_score.desc,verified_usage_count.desc","limit":str(limit)})}

@router.get("/verifiable-services")
async def verifiable_services(limit:int=Query(50,ge=1,le=100),context:dict=Depends(get_auth_context)):
    try:
        return {"data":await rpc(context["user"],"list_verifiable_agent_service_requests",{"p_limit":limit})}
    except SupabaseRestError as e:
        raise err(e,"VERIFIABLE_SKILL_SERVICES_FAILED")

@router.get("/{agent_id}/challenge")
async def challenge(agent_id:UUID,context:dict=Depends(get_auth_context)):
    skills=await select(context["user"],"agent_skills",{"select":"*","agent_id":f"eq.{agent_id}","order":"skill_level.desc,quality_score.desc"})
    board=await select(context["user"],"agent_skill_challenge_leaderboard",{"select":"*","agent_id":f"eq.{agent_id}","limit":"1"})
    events=await select(context["user"],"agent_skill_challenge_events",{"select":"*","agent_id":f"eq.{agent_id}","order":"created_at.desc","limit":"50"})
    return {"data":{"skills":skills,"leaderboard":board[0] if board else None,"events":events}}

@router.post("",status_code=201)
async def upsert(p:SkillUpsert,context:dict=Depends(get_auth_context)):
    try:return {"data":await rpc(context["user"],"upsert_agent_skill",{"p_agent_id":str(p.agent_id),"p_skill_id":str(p.skill_id) if p.skill_id else None,"p_name":p.name,"p_description":p.description,"p_version":p.version,"p_category":p.category,"p_configuration":p.configuration,"p_enabled":p.enabled})}
    except SupabaseRestError as e:raise err(e,"AGENT_SKILL_SAVE_FAILED")

@router.post("/{skill_id}/publish")
async def publish(skill_id:UUID,context:dict=Depends(get_auth_context)):
    try:return {"data":await rpc(context["user"],"publish_agent_skill",{"p_skill_id":str(skill_id)})}
    except SupabaseRestError as e:raise err(e,"AGENT_SKILL_PUBLISH_FAILED")

@router.post("/quality-outcomes")
async def outcome(p:QualityOutcome,context:dict=Depends(get_auth_context)):
    try:return {"data":await rpc(context["user"],"record_agent_skill_quality_outcome",{"p_service_request_id":str(p.service_request_id),"p_quality_score":p.quality_score,"p_dimensions":p.dimensions,"p_evidence":p.evidence})}
    except SupabaseRestError as e:raise err(e,"AGENT_SKILL_REWARD_FAILED")
