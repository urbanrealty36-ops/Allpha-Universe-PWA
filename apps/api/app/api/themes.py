from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, rpc, select

router=APIRouter(prefix="/api/v1/themes",tags=["Theme & World Builder"])
AssetType=Literal["image","video","3d_scene","model","texture","font","audio","icon","preview"]

class ThemeCreate(BaseModel):
    name:str=Field(min_length=1,max_length=160); slug:str=Field(min_length=1,max_length=180,pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description:str|None=None; category:str=Field(min_length=1,max_length=100)
    compatibility:dict[str,Any]=Field(default_factory=dict); allowed_components:list[Any]=Field(default_factory=list)
    performance_budget:dict[str,Any]=Field(default_factory=dict); accessibility_constraints:dict[str,Any]=Field(default_factory=dict)

class ThemeVersionCreate(BaseModel):
    tokens:dict[str,Any]=Field(default_factory=dict); component_config:dict[str,Any]=Field(default_factory=dict)
    world_schema:dict[str,Any]=Field(default_factory=dict); compatibility:dict[str,Any]=Field(default_factory=dict)
    performance_budget:dict[str,Any]=Field(default_factory=dict); accessibility_constraints:dict[str,Any]=Field(default_factory=dict)

class ThemeAssetCreate(BaseModel):
    asset_type:AssetType; storage_path:str=Field(min_length=1,max_length=1024); mime_type:str|None=None
    metadata:dict[str,Any]=Field(default_factory=dict); sort_order:int=0

class WorldTemplateCreate(BaseModel):
    name:str=Field(min_length=1,max_length=160); slug:str=Field(min_length=1,max_length=180,pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description:str|None=None; category:str=Field(min_length=1,max_length=100); compatibility:dict[str,Any]=Field(default_factory=dict)

class WorldTemplateVersionCreate(BaseModel):
    theme_id:UUID|None=None; theme_version_id:UUID|None=None
    world_schema:dict[str,Any]=Field(default_factory=dict); builder_schema:dict[str,Any]=Field(default_factory=dict)

def err(e:SupabaseRestError,code:str)->HTTPException:
    return HTTPException(status_code=e.status_code if e.status_code in {400,401,403,404,409,422} else 500,detail={"code":code,"message":e.message})

@router.get("")
async def themes(category:str|None=None,status:str|None=None,limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context)):
    q={"select":"*","order":"updated_at.desc","limit":str(limit)}
    if category:q["category"]=f"eq.{category}"
    if status:q["status"]=f"eq.{status}"
    return {"data":await select(context["user"],"themes",q)}

@router.post("",status_code=201)
async def create_theme(p:ThemeCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_theme",{"p_name":p.name,"p_slug":p.slug,"p_description":p.description,"p_category":p.category,"p_compatibility":p.compatibility,"p_allowed_components":p.allowed_components,"p_performance_budget":p.performance_budget,"p_accessibility_constraints":p.accessibility_constraints})
    except SupabaseRestError as e:raise err(e,"THEME_CREATE_FAILED")

@router.get("/world-templates")
async def templates(limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"world_templates",{"select":"*","order":"updated_at.desc","limit":str(limit)})

@router.post("/world-templates",status_code=201)
async def create_template(p:WorldTemplateCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_world_template",{"p_name":p.name,"p_slug":p.slug,"p_description":p.description,"p_category":p.category,"p_compatibility":p.compatibility})
    except SupabaseRestError as e:raise err(e,"WORLD_TEMPLATE_CREATE_FAILED")

@router.get("/world-templates/{template_id}/versions")
async def template_versions(template_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"world_template_versions",{"select":"*","world_template_id":f"eq.{template_id}","order":"version.desc"})}

@router.post("/world-templates/{template_id}/versions",status_code=201)
async def create_template_version(template_id:UUID,p:WorldTemplateVersionCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_world_template_version",{"p_world_template_id":str(template_id),"p_theme_id":str(p.theme_id) if p.theme_id else None,"p_theme_version_id":str(p.theme_version_id) if p.theme_version_id else None,"p_world_schema":p.world_schema,"p_builder_schema":p.builder_schema})
    except SupabaseRestError as e:raise err(e,"WORLD_TEMPLATE_VERSION_CREATE_FAILED")

@router.get("/{theme_id}")
async def get_theme(theme_id:UUID,context:dict=Depends(get_auth_context)):
    rows=await select(context["user"],"themes",{"select":"*","id":f"eq.{theme_id}","limit":"1"})
    if not rows:raise HTTPException(404,detail={"code":"THEME_NOT_FOUND"})
    return {"data":rows[0]}

@router.post("/{theme_id}/versions",status_code=201)
async def create_version(theme_id:UUID,p:ThemeVersionCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_theme_version",{"p_theme_id":str(theme_id),"p_tokens":p.tokens,"p_component_config":p.component_config,"p_world_schema":p.world_schema,"p_compatibility":p.compatibility,"p_performance_budget":p.performance_budget,"p_accessibility_constraints":p.accessibility_constraints})
    except SupabaseRestError as e:raise err(e,"THEME_VERSION_CREATE_FAILED")

@router.get("/{theme_id}/versions")
async def versions(theme_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"theme_versions",{"select":"*","theme_id":f"eq.{theme_id}","order":"version.desc"})}

@router.post("/versions/{version_id}/validate")
async def validate_version(version_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"validate_theme_version",{"p_theme_version_id":str(version_id)})
    except SupabaseRestError as e:raise err(e,"THEME_VERSION_VALIDATE_FAILED")

@router.get("/versions/{version_id}/assets")
async def assets(version_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"theme_assets",{"select":"*","theme_version_id":f"eq.{version_id}","order":"sort_order.asc"})}

@router.post("/versions/{version_id}/assets",status_code=201)
async def add_asset(version_id:UUID,p:ThemeAssetCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"add_theme_asset",{"p_theme_version_id":str(version_id),"p_asset_type":p.asset_type,"p_storage_path":p.storage_path,"p_mime_type":p.mime_type,"p_metadata":p.metadata,"p_sort_order":p.sort_order})
    except SupabaseRestError as e:raise err(e,"THEME_ASSET_CREATE_FAILED")

@router.post("/{theme_id}/submit")
async def submit(theme_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"submit_theme",{"p_theme_id":str(theme_id)})
    except SupabaseRestError as e:raise err(e,"THEME_SUBMIT_FAILED")

@router.post("/{theme_id}/publish")
async def publish(theme_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"publish_theme",{"p_theme_id":str(theme_id)})
    except SupabaseRestError as e:raise err(e,"THEME_PUBLISH_FAILED")

