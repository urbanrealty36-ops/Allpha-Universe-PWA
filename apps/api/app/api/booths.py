from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context
from app.core.storage import SupabaseStorageError, create_signed_download_url, create_signed_upload_url
from app.core.supabase_rest import SupabaseRestError, rpc, select

router=APIRouter(prefix="/api/v1/booths",tags=["Booth / Tenant"])

Tier=Literal["free","standard","creator","business","prime","event","enterprise"]
OwnerType=Literal["user","agent","organization"]

class BoothCreate(BaseModel):
    district_id:UUID
    district_zone_id:UUID|None=None
    owner_type:OwnerType="user"
    owner_id:UUID|None=None
    agent_id:UUID|None=None
    booth_type:Literal["personal","creator","agent","business","store","office","studio","community_space","event_venue","collaboration_space"]="personal"
    tier:Tier="free"
    name:str=Field(min_length=1,max_length=160)
    slug:str=Field(min_length=1,max_length=180,pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description:str|None=None
    theme_key:str|None=None
    display_config:dict[str,Any]=Field(default_factory=dict)
    scene_config:dict[str,Any]=Field(default_factory=dict)
    catalog_config:dict[str,Any]=Field(default_factory=dict)
    live_entry_config:dict[str,Any]=Field(default_factory=dict)
    branding_config:dict[str,Any]=Field(default_factory=dict)
    portal_config:dict[str,Any]=Field(default_factory=dict)
    host_agent_id:UUID|None=None

class BoothUpdate(BaseModel):
    name:str=Field(min_length=1,max_length=160)
    description:str|None=None
    theme_key:str|None=None
    display_config:dict[str,Any]|None=None
    scene_config:dict[str,Any]|None=None
    catalog_config:dict[str,Any]|None=None
    live_entry_config:dict[str,Any]|None=None
    branding_config:dict[str,Any]|None=None
    portal_config:dict[str,Any]|None=None
    host_agent_id:UUID|None=None

class AssetCreate(BaseModel):
    asset_type:Literal["image","video","presentation","3d_scene","document"]
    storage_path:str=Field(min_length=1,max_length=1024)
    mime_type:str|None=None
    metadata:dict[str,Any]=Field(default_factory=dict)
    sort_order:int=0

class SlotCreate(BaseModel):
    slot_key:str=Field(min_length=1,max_length=120)
    asset_id:UUID
    presentation_config:dict[str,Any]=Field(default_factory=dict)

class LeaseCreate(BaseModel):
    tier:Tier
    size_class:str=Field(min_length=1,max_length=80)
    visibility_class:str=Field(min_length=1,max_length=80)
    price_amount:float|None=None
    currency:str|None=None
    billing_cycle:str|None=None
    starts_at:str
    ends_at:str|None=None
    traffic_score:float|None=Field(default=None,ge=0,le=100)
    metadata:dict[str,Any]=Field(default_factory=dict)

def err(e:SupabaseRestError,code:str)->HTTPException:
    return HTTPException(status_code=e.status_code if e.status_code in {400,401,403,404,409,422} else 500,detail={"code":code,"message":e.message})

@router.get("")
async def booths(district_id:UUID|None=None,limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context)):
    q={"select":"*","order":"updated_at.desc","limit":str(limit)}
    if district_id:q["district_id"]=f"eq.{district_id}"
    return {"data":await select(context["user"],"booths",q)}

@router.post("",status_code=201)
async def create(p:BoothCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"create_booth",{"p_district_id":str(p.district_id),"p_district_zone_id":str(p.district_zone_id) if p.district_zone_id else None,"p_owner_type":p.owner_type,"p_owner_id":str(p.owner_id) if p.owner_id else None,"p_agent_id":str(p.agent_id) if p.agent_id else None,"p_booth_type":p.booth_type,"p_tier":p.tier,"p_name":p.name,"p_slug":p.slug,"p_description":p.description,"p_theme_key":p.theme_key,"p_display_config":p.display_config,"p_scene_config":p.scene_config,"p_catalog_config":p.catalog_config,"p_display_config":{**p.display_config,"branding":p.branding_config},"p_scene_config":{**p.scene_config,**({"host_agent_id":str(p.host_agent_id)} if p.host_agent_id else {})},"p_catalog_config":p.catalog_config,"p_live_entry_config":{**p.live_entry_config,"portal":p.portal_config}})
    except SupabaseRestError as e:raise err(e,"BOOTH_CREATE_FAILED")

@router.get("/{booth_id}")
async def get_booth(booth_id:UUID,context:dict=Depends(get_auth_context)):
    rows=await select(context["user"],"booths",{"select":"*","id":f"eq.{booth_id}","limit":"1"})
    if not rows:raise HTTPException(404,detail={"code":"BOOTH_NOT_FOUND"})
    return {"data":rows[0]}

@router.patch("/{booth_id}")
async def update(booth_id:UUID,p:BoothUpdate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"update_booth",{"p_booth_id":str(booth_id),"p_name":p.name,"p_description":p.description,"p_theme_key":p.theme_key,"p_display_config":p.display_config,"p_scene_config":p.scene_config,"p_catalog_config":p.catalog_config,"p_display_config":{**(p.display_config or {}),"branding":p.branding_config or {}},"p_scene_config":{**(p.scene_config or {}),**({"host_agent_id":str(p.host_agent_id)} if p.host_agent_id else {})},"p_catalog_config":p.catalog_config or {},"p_live_entry_config":{**(p.live_entry_config or {}),"portal":p.portal_config or {}}})
    except SupabaseRestError as e:raise err(e,"BOOTH_UPDATE_FAILED")

@router.get("/{booth_id}/assets")
async def assets(booth_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"booth_display_assets",{"select":"*","booth_id":f"eq.{booth_id}","order":"sort_order.asc"})}

@router.post("/{booth_id}/assets",status_code=201)
async def add_asset(booth_id:UUID,p:AssetCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"add_booth_asset",{"p_booth_id":str(booth_id),"p_asset_type":p.asset_type,"p_storage_path":p.storage_path,"p_mime_type":p.mime_type,"p_metadata":p.metadata,"p_sort_order":p.sort_order})
    except SupabaseRestError as e:raise err(e,"BOOTH_ASSET_CREATE_FAILED")


@router.post("/{booth_id}/assets/3d/upload-url", status_code=201)
async def prepare_3d_upload(booth_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        asset = await rpc(
            context["user"],
            "prepare_booth_3d_asset",
            {
                "p_booth_id": str(booth_id),
                "p_mime_type": "model/gltf-binary",
                "p_metadata": {"format": "glb", "lifecycle": "pending_upload"},
            },
        )
        upload = await create_signed_upload_url(
            context["user"], asset["storage_bucket"], asset["storage_path"]
        )
        return {"data": {"asset": asset, "upload": upload}}
    except SupabaseRestError as e:
        raise err(e, "BOOTH_3D_UPLOAD_PREPARE_FAILED")
    except SupabaseStorageError as e:
        raise HTTPException(
            status_code=e.status_code if e.status_code in {400, 401, 403, 404, 409, 422} else 502,
            detail={"code": "BOOTH_3D_UPLOAD_SIGN_FAILED", "message": e.message},
        )


@router.post("/{booth_id}/assets/{asset_id}/3d/finalize")
async def finalize_3d_upload(
    booth_id: UUID,
    asset_id: UUID,
    checksum_sha256: str | None = None,
    context: dict = Depends(get_auth_context),
):
    try:
        asset = await rpc(
            context["user"],
            "finalize_booth_3d_asset",
            {"p_asset_id": str(asset_id), "p_checksum_sha256": checksum_sha256},
        )
        if str(asset.get("booth_id")) != str(booth_id):
            raise HTTPException(409, detail={"code": "BOOTH_ASSET_SCOPE_MISMATCH"})
        return {"data": asset}
    except SupabaseRestError as e:
        raise err(e, "BOOTH_3D_UPLOAD_FINALIZE_FAILED")


@router.get("/{booth_id}/assets/3d")
async def active_3d_assets(booth_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        rows = await select(
            context["user"],
            "booth_display_assets",
            {
                "select": "*",
                "booth_id": f"eq.{booth_id}",
                "asset_type": "eq.3d_scene",
                "status": "eq.active",
                "order": "sort_order.asc",
            },
        )
        data = []
        for asset in rows:
            signed_url = await create_signed_download_url(
                context["user"], asset["storage_bucket"], asset["storage_path"], 900
            )
            data.append({**asset, "signed_url": signed_url})
        return {"data": data}
    except SupabaseRestError as e:
        raise err(e, "BOOTH_3D_ASSET_LOAD_FAILED")
    except SupabaseStorageError as e:
        raise HTTPException(
            status_code=e.status_code if e.status_code in {400, 401, 403, 404, 409, 422} else 502,
            detail={"code": "BOOTH_3D_ASSET_SIGN_FAILED", "message": e.message},
        )


@router.delete("/{booth_id}/assets/{asset_id}/3d")
async def archive_3d_asset(
    booth_id: UUID, asset_id: UUID, context: dict = Depends(get_auth_context)
):
    try:
        asset = await rpc(
            context["user"],
            "archive_booth_display_asset",
            {"p_asset_id": str(asset_id)},
        )
        if str(asset.get("booth_id")) != str(booth_id):
            raise HTTPException(409, detail={"code": "BOOTH_ASSET_SCOPE_MISMATCH"})
        return {"data": asset}
    except SupabaseRestError as e:
        raise err(e, "BOOTH_3D_ASSET_ARCHIVE_FAILED")

@router.get("/{booth_id}/slots")
async def slots(booth_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"booth_display_slots",{"select":"*","booth_id":f"eq.{booth_id}","order":"slot_key.asc"})}

@router.post("/{booth_id}/slots",status_code=201)
async def bind_slot(booth_id:UUID,p:SlotCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"bind_booth_slot",{"p_booth_id":str(booth_id),"p_slot_key":p.slot_key,"p_asset_id":str(p.asset_id),"p_presentation_config":p.presentation_config})
    except SupabaseRestError as e:raise err(e,"BOOTH_SLOT_BIND_FAILED")

@router.post("/{booth_id}/submit")
async def submit(booth_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"submit_booth",{"p_booth_id":str(booth_id)})
    except SupabaseRestError as e:raise err(e,"BOOTH_SUBMIT_FAILED")

@router.post("/{booth_id}/publish")
async def publish(booth_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"publish_booth",{"p_booth_id":str(booth_id)})
    except SupabaseRestError as e:raise err(e,"BOOTH_PUBLISH_FAILED")

@router.get("/{booth_id}/leases")
async def leases(booth_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"booth_leases",{"select":"*","booth_id":f"eq.{booth_id}","order":"created_at.desc"})}

@router.post("/{booth_id}/leases",status_code=201)
async def request_lease(booth_id:UUID,p:LeaseCreate,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"request_booth_lease",{"p_booth_id":str(booth_id),"p_tier":p.tier,"p_size_class":p.size_class,"p_visibility_class":p.visibility_class,"p_price_amount":p.price_amount,"p_currency":p.currency,"p_billing_cycle":p.billing_cycle,"p_starts_at":p.starts_at,"p_ends_at":p.ends_at,"p_metadata":{**p.metadata,**({"traffic_score":p.traffic_score} if p.traffic_score is not None else {})}})
    except SupabaseRestError as e:raise err(e,"BOOTH_LEASE_REQUEST_FAILED")

@router.post("/leases/{lease_id}/activate")
async def activate_lease(lease_id:UUID,context:dict=Depends(get_auth_context)):
    try:return await rpc(context["user"],"activate_booth_lease",{"p_lease_id":str(lease_id)})
    except SupabaseRestError as e:raise err(e,"BOOTH_LEASE_ACTIVATE_FAILED")
