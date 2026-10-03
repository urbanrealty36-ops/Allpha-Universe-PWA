from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, rpc, select

router=APIRouter(prefix="/api/v1/districts",tags=["Districts"])
OwnerType=Literal["user","agent","organization"]
SubjectType=Literal["user","agent","organization"]
Tier=Literal["free","standard","creator","business","prime","event","enterprise"]
SpatialObjectType=Literal["building","road","coworking","meeting_room","event","marketplace","agent_zone","community_zone"]
Availability=Literal["available","limited","reserved","unavailable"]

class DistrictCreate(BaseModel):
    world_id:UUID
    owner_type:OwnerType="user"; owner_id:UUID|None=None
    name:str=Field(min_length=1,max_length=160); slug:str=Field(min_length=1,max_length=180,pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description:str|None=None
    district_type:Literal["general","investor","founder","owner","director","pitching","creator","commerce","event","enterprise","private"]="general"
    visibility:Literal["public","restricted","private","enterprise"]="public"
    theme_key:str|None=None; spatial_config:dict[str,Any]=Field(default_factory=dict); metadata:dict[str,Any]=Field(default_factory=dict)

class Subject(BaseModel):
    subject_type:SubjectType="user"; subject_id:UUID|None=None
class AccessRequest(BaseModel):
    requester_type:SubjectType="user"; requester_id:UUID|None=None
    requested_tier:Tier|None=None; reason:str|None=None; metadata:dict[str,Any]=Field(default_factory=dict)
class AccessDecision(BaseModel):
    decision:Literal["approved","rejected"]; role:Literal["member","moderator","admin","visitor"]="member"; reason:str|None=None
class Entitlement(BaseModel):
    subject_type:Literal["user","organization"]; subject_id:UUID; tier:Tier; entitlement_key:str=Field(min_length=1,max_length=120)
    starts_at:str|None=None; expires_at:str|None=None; metadata:dict[str,Any]=Field(default_factory=dict)
class ZoneCreate(BaseModel):
    zone_key:str=Field(min_length=1,max_length=120); name:str=Field(min_length=1,max_length=160)
    zone_type:Literal["public","member","restricted","enterprise","private"]="public"
    spatial_config:dict[str,Any]=Field(default_factory=dict); metadata:dict[str,Any]=Field(default_factory=dict)
class SpatialObjectCreate(BaseModel):
    zone_id:UUID|None=None
    object_type:SpatialObjectType
    name:str=Field(min_length=1,max_length=160)
    slug:str=Field(min_length=1,max_length=180,pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    capacity:int|None=Field(default=None,ge=0)
    availability:Availability="available"
    spatial_config:dict[str,Any]=Field(default_factory=dict)
    presentation_config:dict[str,Any]=Field(default_factory=dict)
    metadata:dict[str,Any]=Field(default_factory=dict)

def err(e:SupabaseRestError,code:str)->HTTPException:
    return HTTPException(status_code=e.status_code if e.status_code in {400,401,403,404,409,422} else 500,detail={"code":code,"message":e.message})

@router.get("")
async def districts(world_id:UUID|None=None,limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context)):
    q={"select":"*","order":"updated_at.desc","limit":str(limit)}
    if world_id:q["world_id"]=f"eq.{world_id}"
    return {"data":await select(context["user"],"districts",q)}

@router.post("",status_code=201)
async def create_district(p:DistrictCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_district",{"p_world_id":str(p.world_id),"p_owner_type":p.owner_type,"p_owner_id":str(p.owner_id or context["user"].user_id),"p_name":p.name,"p_slug":p.slug,"p_description":p.description,"p_district_type":p.district_type,"p_visibility":p.visibility,"p_theme_key":p.theme_key,"p_spatial_config":p.spatial_config,"p_metadata":p.metadata})
    except SupabaseRestError as e: raise err(e,"DISTRICT_CREATE_FAILED")

@router.get("/{district_id}")
async def district(district_id:UUID,context:dict=Depends(get_auth_context)):
    rows=await select(context["user"],"districts",{"select":"*","id":f"eq.{district_id}","limit":"1"})
    if not rows: raise HTTPException(404,detail={"code":"DISTRICT_NOT_FOUND"})
    return {"data":rows[0]}

@router.post("/{district_id}/publish")
async def publish(district_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"publish_district",{"p_district_id":str(district_id)})
    except SupabaseRestError as e: raise err(e,"DISTRICT_PUBLISH_FAILED")

@router.get("/{district_id}/members")
async def members(district_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"district_memberships",{"select":"*","district_id":f"eq.{district_id}","order":"updated_at.desc"})}

@router.post("/{district_id}/join",status_code=201)
async def join(district_id:UUID,p:Subject,context:dict=Depends(get_auth_context)):
    sid=p.subject_id or context["user"].user_id
    if p.subject_type=="user" and sid!=context["user"].user_id: raise HTTPException(403,detail={"code":"DISTRICT_SUBJECT_DENIED"})
    try:return await rpc(context["user"],"join_district",{"p_district_id":str(district_id),"p_subject_type":p.subject_type,"p_subject_id":str(sid)})
    except SupabaseRestError as e:raise err(e,"DISTRICT_JOIN_FAILED")

@router.get("/{district_id}/requests")
async def requests(district_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"district_access_requests",{"select":"*","district_id":f"eq.{district_id}","order":"created_at.desc"})}

@router.post("/{district_id}/requests",status_code=201)
async def request_access(district_id:UUID,p:AccessRequest,context:dict=Depends(get_auth_context)):
    sid=p.requester_id or context["user"].user_id
    if p.requester_type=="user" and sid!=context["user"].user_id: raise HTTPException(403,detail={"code":"DISTRICT_REQUESTER_DENIED"})
    try:return await rpc(context["user"],"request_district_access",{"p_district_id":str(district_id),"p_requester_type":p.requester_type,"p_requester_id":str(sid),"p_requested_tier":p.requested_tier,"p_reason":p.reason,"p_metadata":p.metadata})
    except SupabaseRestError as e:raise err(e,"DISTRICT_ACCESS_REQUEST_FAILED")

@router.post("/requests/{request_id}/decision")
async def decide(request_id:UUID,p:AccessDecision,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"decide_district_access",{"p_request_id":str(request_id),"p_decision":p.decision,"p_role":p.role,"p_reason":p.reason})
    except SupabaseRestError as e:raise err(e,"DISTRICT_ACCESS_DECISION_FAILED")

@router.get("/{district_id}/entitlements")
async def entitlements(district_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"district_entitlements",{"select":"*","district_id":f"eq.{district_id}","order":"updated_at.desc"})}

@router.post("/{district_id}/entitlements",status_code=201)
async def grant_entitlement(district_id:UUID,p:Entitlement,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"grant_district_entitlement",{"p_district_id":str(district_id),"p_subject_type":p.subject_type,"p_subject_id":str(p.subject_id),"p_tier":p.tier,"p_entitlement_key":p.entitlement_key,"p_starts_at":p.starts_at,"p_expires_at":p.expires_at,"p_metadata":p.metadata})
    except SupabaseRestError as e:raise err(e,"DISTRICT_ENTITLEMENT_GRANT_FAILED")

@router.get("/{district_id}/zones")
async def zones(district_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"district_zones",{"select":"*","district_id":f"eq.{district_id}","order":"created_at.asc"})}

@router.post("/{district_id}/zones",status_code=201)
async def create_zone(district_id:UUID,p:ZoneCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_district_zone",{"p_district_id":str(district_id),"p_zone_key":p.zone_key,"p_name":p.name,"p_zone_type":p.zone_type,"p_spatial_config":p.spatial_config,"p_metadata":p.metadata})
    except SupabaseRestError as e:raise err(e,"DISTRICT_ZONE_CREATE_FAILED")

@router.post("/zones/{zone_id}/activate")
async def activate_zone(zone_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"activate_district_zone",{"p_zone_id":str(zone_id)})
    except SupabaseRestError as e:raise err(e,"DISTRICT_ZONE_ACTIVATE_FAILED")

@router.get("/{district_id}/spatial-objects")
async def spatial_objects(district_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"district_spatial_objects",{"select":"*","district_id":f"eq.{district_id}","order":"created_at.asc"})}

@router.post("/{district_id}/spatial-objects",status_code=201)
async def create_spatial_object(district_id:UUID,p:SpatialObjectCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_district_spatial_object",{"p_district_id":str(district_id),"p_zone_id":str(p.zone_id) if p.zone_id else None,"p_object_type":p.object_type,"p_name":p.name,"p_slug":p.slug,"p_capacity":p.capacity,"p_availability":p.availability,"p_spatial_config":p.spatial_config,"p_presentation_config":p.presentation_config,"p_metadata":p.metadata})
    except SupabaseRestError as e:raise err(e,"DISTRICT_SPATIAL_OBJECT_CREATE_FAILED")

@router.post("/spatial-objects/{object_id}/activate")
async def activate_spatial_object(object_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"activate_district_spatial_object",{"p_object_id":str(object_id)})
    except SupabaseRestError as e:raise err(e,"DISTRICT_SPATIAL_OBJECT_ACTIVATE_FAILED")
