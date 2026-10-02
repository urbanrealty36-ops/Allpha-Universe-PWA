from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, select

router=APIRouter(prefix="/api/v1/themes/world-runtime",tags=["Allpha World Engine"])

def err(e:SupabaseRestError,code:str)->HTTPException:
    return HTTPException(status_code=e.status_code if e.status_code in {400,401,403,404,409,422} else 500,detail={"code":code,"message":e.message})

@router.get("/catalog")
async def runtime_catalog(context:dict=Depends(get_auth_context)):
    """Read-only composition of existing platform Theme, World Template and Live Template records."""
    try:
        themes=await select(context["user"],"themes",{"select":"*,theme_versions(*)","source":"eq.platform","status":"eq.published","order":"catalog_order.asc"})
        templates=await select(context["user"],"world_templates",{"select":"*,world_template_versions(*)","source":"eq.platform","status":"eq.published","order":"catalog_order.asc"})
        live=await select(context["user"],"live_experience_templates",{"select":"*,live_experience_template_versions(*)","source":"eq.platform","status":"eq.published","order":"catalog_order.asc"})
    except SupabaseRestError as e:
        raise err(e,"WORLD_RUNTIME_CATALOG_LOAD_FAILED")
    template_by_theme={}
    for item in templates:
        versions=item.get("world_template_versions") or []
        published=sorted([v for v in versions if v.get("status")=="published"],key=lambda v:v.get("version",0),reverse=True)
        if item.get("theme_id"):
            template_by_theme[item["theme_id"]]=published[0] if published else None
    result=[]
    for theme in themes:
        versions=theme.get("theme_versions") or []
        published=sorted([v for v in versions if v.get("status")=="published"],key=lambda v:v.get("version",0),reverse=True)
        version=published[0] if published else None
        world_template=template_by_theme.get(theme.get("id"))
        result.append({
            "id":theme.get("id"),"name":theme.get("name"),"slug":theme.get("slug"),"description":theme.get("description"),
            "category":theme.get("category"),"catalog_key":theme.get("catalog_key"),"catalog_order":theme.get("catalog_order"),
            "compatibility":theme.get("compatibility") or {},"performance_budget":theme.get("performance_budget") or {},
            "accessibility_constraints":theme.get("accessibility_constraints") or {},
            "theme_version_id":version.get("id") if version else None,"theme_version":version.get("version") if version else None,
            "tokens":version.get("tokens") if version else {},"component_config":version.get("component_config") if version else {},
            "world_schema":version.get("world_schema") if version else None,
            "world_template_id":world_template.get("world_template_id") if world_template else None,
            "world_template_version_id":world_template.get("id") if world_template else None,
            "live_templates": [x for x in live if x.get("catalog_order")==theme.get("catalog_order")],
        })
    return {"data":result}

@router.get("/districts/{district_id}/composition")
async def district_composition(district_id:str,context:dict=Depends(get_auth_context)):
    """Read-only spatial composition; existing RLS remains authoritative."""
    try:
        districts=await select(context["user"],"districts",{"select":"*","id":f"eq.{district_id}","limit":"1"})
        if not districts:
            raise HTTPException(404,detail={"code":"DISTRICT_NOT_FOUND"})
        district=districts[0]
        zones=await select(context["user"],"district_zones",{"select":"*","district_id":f"eq.{district_id}","order":"created_at.asc"})
        booths=await select(context["user"],"booths",{"select":"*","district_id":f"eq.{district_id}","order":"updated_at.desc"})
        return {"data":{"district":district,"zones":zones,"booths":booths}}
    except SupabaseRestError as e:
        raise err(e,"WORLD_RUNTIME_DISTRICT_LOAD_FAILED")
