from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, rpc, select, service_select

router=APIRouter(prefix="/api/v1/universe",tags=["AI Universe"])
OwnerType=Literal["user","agent"]

class GalaxyCreate(BaseModel):
    owner_type: OwnerType="user"; owner_id: UUID|None=None
    name:str=Field(min_length=1,max_length=160); slug:str=Field(min_length=1,max_length=180,pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description:str|None=None; visibility:Literal["private","connections","community","public"]="public"; metadata:dict[str,Any]=Field(default_factory=dict)
class WorldCreate(BaseModel):
    galaxy_id:UUID; owner_type:OwnerType="user"; owner_id:UUID|None=None
    name:str=Field(min_length=1,max_length=160); slug:str=Field(min_length=1,max_length=180,pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description:str|None=None; world_type:Literal["social","interest","community","creator","enterprise","event","private"]="social"
    visibility:Literal["private","connections","community","public"]="public"; theme_key:str|None=None; spatial_config:dict[str,Any]=Field(default_factory=dict); metadata:dict[str,Any]=Field(default_factory=dict)
class JoinWorld(BaseModel):
    subject_type:Literal["user","agent"]="user"; subject_id:UUID|None=None
class InterestLink(BaseModel):
    interest_id:UUID; relevance:float=Field(default=1,ge=0,le=1)
class ContentLink(BaseModel):
    content_id:UUID; placement:Literal["feed","featured","spatial","portal"]="feed"; sort_order:int=0
class CommunityLink(BaseModel):
    community_id:UUID; placement:Literal["community","featured","portal"]="community"
class AgentLink(BaseModel):
    agent_id:UUID; presence_role:Literal["owner","host","resident","visitor"]="resident"
class PortalCreate(BaseModel):
    target_world_id:UUID; name:str=Field(min_length=1,max_length=160); access_policy:Literal["public","membership","owner","enterprise"]="public"; metadata:dict[str,Any]=Field(default_factory=dict)
class Presence(BaseModel):
    agent_id:UUID; state:Literal["present","exploring","creating","collaborating","negotiating","awaiting_approval","sleeping"]="present"; activity:str|None=None; context:dict[str,Any]=Field(default_factory=dict)

def err(e:SupabaseRestError,code:str)->HTTPException:
    return HTTPException(status_code=e.status_code if e.status_code in {400,401,403,404,409,422} else 500,detail={"code":code,"message":e.message})

@router.get("/galaxies")
async def galaxies(context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"universe_galaxies",{"select":"*","order":"updated_at.desc"})}

@router.post("/galaxies",status_code=201)
async def create_galaxy(p:GalaxyCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_universe_galaxy",{"p_owner_type":p.owner_type,"p_owner_id":str(p.owner_id or context["user"].user_id),"p_name":p.name,"p_slug":p.slug,"p_description":p.description,"p_visibility":p.visibility,"p_metadata":p.metadata})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_GALAXY_CREATE_FAILED")

@router.get("/worlds")
async def worlds(galaxy_id:UUID|None=None,limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context)):
    q={"select":"*","order":"updated_at.desc","limit":str(limit)}
    if galaxy_id:q["galaxy_id"]=f"eq.{galaxy_id}"
    return {"data":await select(context["user"],"universe_worlds",q)}

@router.get("/public/worlds/{world_id}/runtime")
async def public_world_runtime(world_id:UUID):
    """Public read-only runtime projection for active public Worlds.

    Presentation reads only; mutations remain behind authenticated endpoints.
    """
    try:
        worlds=await service_select("universe_worlds",{"select":"id,galaxy_id,name,slug,description,world_type,visibility,status,theme_key,spatial_config,metadata","id":f"eq.{world_id}","visibility":"eq.public","status":"eq.active","limit":"1"})
        if not worlds:
            raise HTTPException(404,detail={"code":"PUBLIC_WORLD_NOT_FOUND"})
        world=worlds[0]
        districts=await service_select("districts",{"select":"id,world_id,name,slug,description,district_type,visibility,status,theme_key,spatial_config,metadata","world_id":f"eq.{world_id}","visibility":"eq.public","status":"eq.active","order":"updated_at.desc","limit":"100"})
        agents=await service_select("universe_world_agents",{"select":"world_id,agent_id,presence_role,status","world_id":f"eq.{world_id}","status":"eq.active","limit":"100"})
        content=await service_select("universe_world_content",{"select":"world_id,content_id,placement,sort_order","world_id":f"eq.{world_id}","order":"sort_order.asc","limit":"100"})
        portals=await service_select("universe_world_portals",{"select":"id,source_world_id,target_world_id,name,access_policy,status,metadata","source_world_id":f"eq.{world_id}","access_policy":"eq.public","status":"eq.active","order":"created_at.asc","limit":"100"})
        presence_rows=await service_select("universe_agent_presences",{"select":"id,world_id,agent_id,state,activity,entered_at,last_seen_at","world_id":f"eq.{world_id}","exited_at":"is.null","limit":"100"})
        themes=await service_select("themes",{"select":"id,name,slug,description,category,catalog_key","source":"eq.platform","status":"eq.published","catalog_key":f"eq.{world.get('theme_key')}","limit":"1"})
        theme_items=[]
        if themes:
            versions=await service_select("theme_versions",{"select":"id,theme_id,version,tokens,world_schema,component_config,status","theme_id":f"eq.{themes[0]['id']}","status":"eq.published","order":"version.desc","limit":"1"})
            version=versions[0] if versions else None
            theme_items=[{**themes[0],"theme_version_id":version.get("id") if version else None,"theme_version":version.get("version") if version else None,"tokens":version.get("tokens") if version else {},"world_schema":version.get("world_schema") if version else None,"component_config":version.get("component_config") if version else {}}]
        return {"data":{"world":world,"districts":districts,"agents":agents,"content":content,"portals":portals,"presence":presence_rows,"themes":theme_items,"public":True,"presentation_only":True}}
    except SupabaseRestError as e:
        raise err(e,"PUBLIC_WORLD_RUNTIME_LOAD_FAILED")

@router.post("/worlds",status_code=201)
async def create_world(p:WorldCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_universe_world",{"p_galaxy_id":str(p.galaxy_id),"p_owner_type":p.owner_type,"p_owner_id":str(p.owner_id or context["user"].user_id),"p_name":p.name,"p_slug":p.slug,"p_description":p.description,"p_world_type":p.world_type,"p_visibility":p.visibility,"p_theme_key":p.theme_key,"p_spatial_config":p.spatial_config,"p_metadata":p.metadata})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_WORLD_CREATE_FAILED")

@router.post("/worlds/{world_id}/publish")
async def publish_world(world_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"publish_universe_world",{"p_world_id":str(world_id)})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_WORLD_PUBLISH_FAILED")

@router.post("/worlds/{world_id}/join",status_code=201)
async def join_world(world_id:UUID,p:JoinWorld,context:dict=Depends(get_auth_context)):
    sid=p.subject_id or context["user"].user_id
    if p.subject_type=="user" and sid!=context["user"].user_id:raise HTTPException(403,detail={"code":"UNIVERSE_SUBJECT_DENIED"})
    try:return await rpc(context["user"],"join_universe_world",{"p_world_id":str(world_id),"p_subject_type":p.subject_type,"p_subject_id":str(sid)})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_WORLD_JOIN_FAILED")

@router.get("/worlds/{world_id}")
async def world(world_id:UUID,context:dict=Depends(get_auth_context)):
    rows=await select(context["user"],"universe_worlds",{"select":"*","id":f"eq.{world_id}","limit":"1"})
    if not rows:raise HTTPException(404,detail={"code":"UNIVERSE_WORLD_NOT_FOUND"})
    return {"data":rows[0]}

@router.get("/worlds/{world_id}/interests")
async def world_interests(world_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"universe_world_interests",{"select":"*","world_id":f"eq.{world_id}"})}
@router.post("/worlds/{world_id}/interests",status_code=201)
async def link_interest(world_id:UUID,p:InterestLink,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"link_universe_world_interest",{"p_world_id":str(world_id),"p_interest_id":str(p.interest_id),"p_relevance":p.relevance})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_INTEREST_LINK_FAILED")

@router.get("/worlds/{world_id}/content")
async def world_content(world_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"universe_world_content",{"select":"*","world_id":f"eq.{world_id}","order":"sort_order.asc"})}
@router.post("/worlds/{world_id}/content",status_code=201)
async def link_content(world_id:UUID,p:ContentLink,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"link_universe_world_content",{"p_world_id":str(world_id),"p_content_id":str(p.content_id),"p_placement":p.placement,"p_sort_order":p.sort_order})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_CONTENT_LINK_FAILED")

@router.get("/worlds/{world_id}/communities")
async def world_communities(world_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"universe_world_communities",{"select":"*","world_id":f"eq.{world_id}"})}
@router.post("/worlds/{world_id}/communities",status_code=201)
async def link_community(world_id:UUID,p:CommunityLink,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"link_universe_world_community",{"p_world_id":str(world_id),"p_community_id":str(p.community_id),"p_placement":p.placement})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_COMMUNITY_LINK_FAILED")

@router.get("/worlds/{world_id}/agents")
async def world_agents(world_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"universe_world_agents",{"select":"*","world_id":f"eq.{world_id}"})}
@router.post("/worlds/{world_id}/agents",status_code=201)
async def link_agent(world_id:UUID,p:AgentLink,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"link_universe_world_agent",{"p_world_id":str(world_id),"p_agent_id":str(p.agent_id),"p_presence_role":p.presence_role})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_AGENT_LINK_FAILED")

@router.get("/worlds/{world_id}/portals")
async def portals(world_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"universe_world_portals",{"select":"*","source_world_id":f"eq.{world_id}"})}
@router.post("/worlds/{world_id}/portals",status_code=201)
async def create_portal(world_id:UUID,p:PortalCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_universe_portal",{"p_source_world_id":str(world_id),"p_target_world_id":str(p.target_world_id),"p_name":p.name,"p_access_policy":p.access_policy,"p_metadata":p.metadata})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_PORTAL_CREATE_FAILED")

@router.get("/worlds/{world_id}/presence")
async def presence(world_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"universe_agent_presences",{"select":"*","world_id":f"eq.{world_id}"})}
@router.post("/worlds/{world_id}/presence")
async def upsert_presence(world_id:UUID,p:Presence,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"upsert_universe_agent_presence",{"p_world_id":str(world_id),"p_agent_id":str(p.agent_id),"p_state":p.state,"p_activity":p.activity,"p_context":p.context})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_PRESENCE_FAILED")
@router.delete("/worlds/{world_id}/presence/{agent_id}")
async def exit_presence(world_id:UUID,agent_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"exit_universe_agent_presence",{"p_world_id":str(world_id),"p_agent_id":str(agent_id)})
    except SupabaseRestError as e:raise err(e,"UNIVERSE_PRESENCE_EXIT_FAILED")
