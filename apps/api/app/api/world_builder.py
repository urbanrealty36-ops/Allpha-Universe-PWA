from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, rpc, select

router=APIRouter(prefix="/api/v1/world-builder",tags=["World Builder"])

class BuilderStateSave(BaseModel):
    state_id:UUID|None=None; world_id:UUID|None=None; theme_id:UUID|None=None; theme_version_id:UUID|None=None
    world_template_id:UUID|None=None; world_template_version_id:UUID|None=None
    scene_schema:dict[str,Any]=Field(default_factory=dict)

def err(e:SupabaseRestError,code:str)->HTTPException:
    return HTTPException(status_code=e.status_code if e.status_code in {400,401,403,404,409,422} else 500,detail={"code":code,"message":e.message})

@router.get("")
async def states(context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"world_builder_states",{"select":"*","order":"updated_at.desc"})}

@router.get("/{state_id}")
async def get_state(state_id:UUID,context:dict=Depends(get_auth_context)):
    rows=await select(context["user"],"world_builder_states",{"select":"*","id":f"eq.{state_id}","limit":"1"})
    if not rows:raise HTTPException(404,detail={"code":"WORLD_BUILDER_STATE_NOT_FOUND"})
    return {"data":rows[0]}

@router.post("",status_code=201)
async def save(p:BuilderStateSave,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"save_world_builder_state",{"p_state_id":str(p.state_id) if p.state_id else None,"p_world_id":str(p.world_id) if p.world_id else None,"p_theme_id":str(p.theme_id) if p.theme_id else None,"p_theme_version_id":str(p.theme_version_id) if p.theme_version_id else None,"p_world_template_id":str(p.world_template_id) if p.world_template_id else None,"p_world_template_version_id":str(p.world_template_version_id) if p.world_template_version_id else None,"p_scene_schema":p.scene_schema})
    except SupabaseRestError as e:raise err(e,"WORLD_BUILDER_SAVE_FAILED")

@router.post("/{state_id}/validate")
async def validate(state_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"validate_world_builder_state",{"p_state_id":str(state_id)})
    except SupabaseRestError as e:raise err(e,"WORLD_BUILDER_VALIDATE_FAILED")

@router.post("/{state_id}/submit")
async def submit(state_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"submit_world_builder_state",{"p_state_id":str(state_id)})
    except SupabaseRestError as e:raise err(e,"WORLD_BUILDER_SUBMIT_FAILED")
