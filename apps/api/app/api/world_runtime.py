from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_auth_context
from app.core.storage import SupabaseStorageError, create_signed_download_url
from app.core.supabase_rest import SupabaseRestError, select

router=APIRouter(prefix="/api/v1/themes/world-runtime",tags=["Allpha World Engine"])

WORLD_ASSET_BUCKET="allpha-world-assets"

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
        if published and published[0].get("theme_id"):
            template_by_theme[published[0]["theme_id"]]=published[0]
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

@router.get("/themes/{theme_id}/asset-manifest")
async def theme_asset_manifest(theme_id:str,context:dict=Depends(get_auth_context)):
    """Read-only asset manifest. Storage paths are authoritative; URLs are never fabricated."""
    try:
        themes=await select(context["user"],"themes",{"select":"id,name,source,status","id":f"eq.{theme_id}","limit":"1"})
        if not themes:
            raise HTTPException(404,detail={"code":"THEME_NOT_FOUND"})
        assets=await select(context["user"],"theme_assets",{"select":"id,theme_id,theme_version_id,asset_type,storage_path,mime_type,metadata,sort_order,status,moderation_status,safety_status,performance_status","theme_id":f"eq.{theme_id}","order":"sort_order.asc"})
        return {"data":{"theme":themes[0],"storage_bucket":WORLD_ASSET_BUCKET,"assets":assets}}
    except SupabaseRestError as e:
        raise err(e,"WORLD_RUNTIME_THEME_ASSET_MANIFEST_FAILED")

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
        spatial_states=await select(context["user"],"agent_spatial_states",{"select":"id,world_id,agent_id,movement_state,position,rotation,zone_key,target_position,speed,updated_at","world_id":f"eq.{district.get("world_id")}","order":"updated_at.desc","limit":"500"})
        booth_ids=[b.get("id") for b in booths if b.get("id")]
        assets=[]
        slots=[]
        if booth_ids:
            joined=",".join(str(x) for x in booth_ids)
            assets=await select(context["user"],"booth_display_assets",{"select":"*","booth_id":f"in.({joined})","order":"sort_order.asc"})
            slots=await select(context["user"],"booth_display_slots",{"select":"*","booth_id":f"in.({joined})","order":"slot_key.asc"})
        zone_by_id={z.get("id"):z for z in zones}
        booth_projection=[]
        def anchor_from(value: Any):
            if not isinstance(value, dict): return None
            try:
                return {"x": float(value["x"]), "y": float(value["y"]), "z": float(value["z"])}
            except (KeyError,TypeError,ValueError):
                return None
        for b in booths:
            scene=b.get("scene_config") or {}
            zone=zone_by_id.get(b.get("district_zone_id")) or {}
            zone_spatial=zone.get("spatial_config") or {}
            raw_anchor=scene.get("position") or (b.get("display_config") or {}).get("position") or zone_spatial.get("booth_anchor")
            position=anchor_from(raw_anchor)
            anchor_source=("scene_config.position" if anchor_from(scene.get("position")) else "display_config.position" if anchor_from((b.get("display_config") or {}).get("position")) else "zone.spatial_config.booth_anchor" if anchor_from(zone_spatial.get("booth_anchor")) else None)
            booth_assets=[]
            for a in assets:
                if a.get("booth_id") != b.get("id") or a.get("asset_type") != "3d_scene" or a.get("status") != "active":
                    continue
                try:
                    signed_url=await create_signed_download_url(context["user"],a["storage_bucket"],a["storage_path"],900)
                except SupabaseStorageError:
                    signed_url=None
                booth_assets.append({**a,"signed_url":signed_url})
            booth_projection.append({**b,"spatial_projection":{"position":position,"spatial_anchor":position,"anchor_source":anchor_source,"zone_id":b.get("district_zone_id"),"presentation_only":True},"asset_manifest":booth_assets,"display_slots":[s for s in slots if s.get("booth_id")==b.get("id")]})
        return {"data":{"district":district,"spatial_projection":{"spatial_config":district.get("spatial_config") or {},"presentation_only":True},"zones":zones,"booths":booth_projection,"spatial_presence":[s for s in spatial_states if s.get("zone_key") in {z.get("zone_key") for z in zones}]}}
    except SupabaseRestError as e:
        raise err(e,"WORLD_RUNTIME_DISTRICT_LOAD_FAILED")
