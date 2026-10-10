from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context, require_permission
from app.core.supabase_rest import SupabaseRestError, rpc, select
from app.core.storage import SupabaseStorageError, create_signed_download_url, create_signed_upload_url

router = APIRouter(prefix="/api/v1/themes", tags=["Theme & World Builder"])
AssetType = Literal["image","video","3d_scene","model","texture","font","audio","icon","preview"]
ModerationDecision = Literal["approved","restricted","removed","appealed"]

class ThemeCreate(BaseModel):
    name: str = Field(min_length=1,max_length=160)
    slug: str = Field(min_length=1,max_length=180,pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    category: str = Field(min_length=1,max_length=100)
    compatibility: dict[str,Any] = Field(default_factory=dict)
    allowed_components: list[Any] = Field(default_factory=list)
    performance_budget: dict[str,Any] = Field(default_factory=dict)
    accessibility_constraints: dict[str,Any] = Field(default_factory=dict)

class ThemeVersionCreate(BaseModel):
    tokens: dict[str,Any] = Field(default_factory=dict)
    component_config: dict[str,Any] = Field(default_factory=dict)
    world_schema: dict[str,Any] = Field(default_factory=dict)
    compatibility: dict[str,Any] = Field(default_factory=dict)
    performance_budget: dict[str,Any] = Field(default_factory=dict)
    accessibility_constraints: dict[str,Any] = Field(default_factory=dict)

class ThemeAssetCreate(BaseModel):
    asset_type: AssetType
    storage_path: str = Field(min_length=1,max_length=1024)
    mime_type: str | None = None
    metadata: dict[str,Any] = Field(default_factory=dict)
    sort_order: int = Field(default=0,ge=0)

class WorldTemplateCreate(BaseModel):
    name: str = Field(min_length=1,max_length=160)
    slug: str = Field(min_length=1,max_length=180,pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    category: str = Field(min_length=1,max_length=100)
    compatibility: dict[str,Any] = Field(default_factory=dict)

class WorldTemplateVersionCreate(BaseModel):
    theme_id: UUID | None = None
    theme_version_id: UUID | None = None
    world_schema: dict[str,Any] = Field(default_factory=dict)
    builder_schema: dict[str,Any] = Field(default_factory=dict)

class ModerationRequest(BaseModel):
    decision: ModerationDecision

def err(e: SupabaseRestError, code: str) -> HTTPException:
    return HTTPException(status_code=e.status_code if e.status_code in {400,401,403,404,409,422} else 500, detail={"code":code,"message":e.message})

@router.get("")
async def themes(category:str|None=None,status:str|None=None,source:Literal["creator","platform"]|None=None,limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context)):
    q={"select":"*","order":"catalog_order.asc.nullslast,updated_at.desc","limit":str(limit)}
    if category: q["category"]=f"eq.{category}"
    if status: q["status"]=f"eq.{status}"
    if source: q["source"]=f"eq.{source}"
    return {"data":await select(context["user"],"themes",q)}

@router.post("",status_code=201)
async def create_theme(p:ThemeCreate,context:dict=Depends(get_auth_context)):
    try:
        return await rpc(context["user"],"create_theme",{"p_name":p.name,"p_slug":p.slug,"p_description":p.description,"p_category":p.category,"p_compatibility":p.compatibility,"p_allowed_components":p.allowed_components,"p_performance_budget":p.performance_budget,"p_accessibility_constraints":p.accessibility_constraints})
    except SupabaseRestError as e: raise err(e,"THEME_CREATE_FAILED")

@router.get("/world-templates")
async def templates(source:Literal["creator","platform"]|None=None,limit:int=Query(100,ge=1,le=200),context:dict=Depends(get_auth_context)):
    q={"select":"*","order":"catalog_order.asc.nullslast,updated_at.desc","limit":str(limit)}
    if source: q["source"]=f"eq.{source}"
    return {"data":await select(context["user"],"world_templates",q)}

@router.post("/world-templates",status_code=201)
async def create_template(p:WorldTemplateCreate,context:dict=Depends(get_auth_context)):
    try:
        return await rpc(context["user"],"create_world_template",{"p_name":p.name,"p_slug":p.slug,"p_description":p.description,"p_category":p.category,"p_compatibility":p.compatibility})
    except SupabaseRestError as e: raise err(e,"WORLD_TEMPLATE_CREATE_FAILED")

@router.get("/world-templates/{template_id}/versions")
async def template_versions(template_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"world_template_versions",{"select":"*","world_template_id":f"eq.{template_id}","order":"version.desc"})}

@router.post("/world-templates/{template_id}/versions",status_code=201)
async def create_template_version(template_id:UUID,p:WorldTemplateVersionCreate,context:dict=Depends(get_auth_context)):
    try:
        return await rpc(context["user"],"create_world_template_version",{"p_world_template_id":str(template_id),"p_theme_id":str(p.theme_id) if p.theme_id else None,"p_theme_version_id":str(p.theme_version_id) if p.theme_version_id else None,"p_world_schema":p.world_schema,"p_builder_schema":p.builder_schema})
    except SupabaseRestError as e: raise err(e,"WORLD_TEMPLATE_VERSION_CREATE_FAILED")

@router.post("/world-templates/versions/{version_id}/validate")
async def validate_template_version(version_id:UUID,context:dict=Depends(get_auth_context)):
    try: return await rpc(context["user"],"validate_world_template_version",{"p_world_template_version_id":str(version_id)})
    except SupabaseRestError as e: raise err(e,"WORLD_TEMPLATE_VERSION_VALIDATE_FAILED")

@router.post("/world-templates/{template_id}/submit")
async def submit_template(template_id:UUID,context:dict=Depends(get_auth_context)):
    try: return await rpc(context["user"],"submit_world_template",{"p_world_template_id":str(template_id)})
    except SupabaseRestError as e: raise err(e,"WORLD_TEMPLATE_SUBMIT_FAILED")

@router.post("/world-templates/{template_id}/publish")
async def publish_template(template_id:UUID,context:dict=Depends(get_auth_context)):
    try: return await rpc(context["user"],"publish_world_template",{"p_world_template_id":str(template_id)})
    except SupabaseRestError as e: raise err(e,"WORLD_TEMPLATE_PUBLISH_FAILED")

@router.post("/platform-assets/{version_id}/3d/upload-url", status_code=201)
async def prepare_platform_3d_upload(version_id: UUID, context: dict = Depends(get_auth_context)):
    try:
        asset = await rpc(
            context["user"],
            "prepare_platform_theme_3d_asset",
            {
                "p_theme_version_id": str(version_id),
                "p_asset_type": "3d_scene",
                "p_mime_type": "model/gltf-binary",
                "p_metadata": {"format": "glb", "lifecycle": "pending_upload", "asset_pack": "allpha-25-theme-3d"},
                "p_sort_order": 0,
            },
        )
        upload = await create_signed_upload_url(
            context["user"], asset["storage_bucket"], asset["storage_path"]
        )
        return {"data": {"asset": asset, "upload": upload}}
    except SupabaseRestError as e:
        raise err(e, "PLATFORM_THEME_3D_UPLOAD_PREPARE_FAILED")
    except SupabaseStorageError as e:
        raise HTTPException(
            status_code=e.status_code if e.status_code in {400, 401, 403, 404, 409, 422} else 502,
            detail={"code": "PLATFORM_THEME_3D_UPLOAD_SIGN_FAILED", "message": e.message},
        )

@router.post("/platform-assets/{version_id}/3d/{asset_id}/finalize")
async def finalize_platform_3d_upload(
    version_id: UUID,
    asset_id: UUID,
    checksum_sha256: str | None = None,
    context: dict = Depends(get_auth_context),
):
    try:
        asset = await rpc(
            context["user"],
            "finalize_platform_theme_3d_asset",
            {"p_asset_id": str(asset_id), "p_checksum_sha256": checksum_sha256},
        )
        if str(asset.get("theme_version_id")) != str(version_id):
            raise HTTPException(409, detail={"code": "THEME_ASSET_SCOPE_MISMATCH"})
        return {"data": asset}
    except SupabaseRestError as e:
        raise err(e, "PLATFORM_THEME_3D_UPLOAD_FINALIZE_FAILED")

@router.get("/{theme_id}")
async def get_theme(theme_id:UUID,context:dict=Depends(get_auth_context)):
    rows=await select(context["user"],"themes",{"select":"*","id":f"eq.{theme_id}","limit":"1"})
    if not rows: raise HTTPException(404,detail={"code":"THEME_NOT_FOUND"})
    return {"data":rows[0]}

@router.post("/{theme_id}/versions",status_code=201)
async def create_version(theme_id:UUID,p:ThemeVersionCreate,context:dict=Depends(get_auth_context)):
    try:
        return await rpc(context["user"],"create_theme_version",{"p_theme_id":str(theme_id),"p_tokens":p.tokens,"p_component_config":p.component_config,"p_world_schema":p.world_schema,"p_compatibility":p.compatibility,"p_performance_budget":p.performance_budget,"p_accessibility_constraints":p.accessibility_constraints})
    except SupabaseRestError as e: raise err(e,"THEME_VERSION_CREATE_FAILED")

@router.get("/{theme_id}/versions")
async def versions(theme_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"theme_versions",{"select":"*","theme_id":f"eq.{theme_id}","order":"version.desc"})}

@router.post("/versions/{version_id}/validate")
async def validate_version(version_id:UUID,context:dict=Depends(get_auth_context)):
    try: return await rpc(context["user"],"validate_theme_version",{"p_theme_version_id":str(version_id)})
    except SupabaseRestError as e: raise err(e,"THEME_VERSION_VALIDATE_FAILED")

@router.get("/versions/{version_id}/assets")
async def assets(version_id:UUID,context:dict=Depends(get_auth_context)):
    return {"data":await select(context["user"],"theme_assets",{"select":"*","theme_version_id":f"eq.{version_id}","order":"sort_order.asc"})}

@router.post("/versions/{version_id}/assets",status_code=201)
async def add_asset(version_id:UUID,p:ThemeAssetCreate,context:dict=Depends(get_auth_context)):
    try:
        return await rpc(context["user"],"add_theme_asset",{"p_theme_version_id":str(version_id),"p_asset_type":p.asset_type,"p_storage_path":p.storage_path,"p_mime_type":p.mime_type,"p_metadata":p.metadata,"p_sort_order":p.sort_order})
    except SupabaseRestError as e: raise err(e,"THEME_ASSET_CREATE_FAILED")

@router.post("/{theme_id}/submit")
async def submit(theme_id:UUID,context:dict=Depends(get_auth_context)):
    try: return await rpc(context["user"],"submit_theme",{"p_theme_id":str(theme_id)})
    except SupabaseRestError as e: raise err(e,"THEME_SUBMIT_FAILED")

@router.post("/{theme_id}/publish")
async def publish(theme_id:UUID,context:dict=Depends(get_auth_context)):
    try: return await rpc(context["user"],"publish_theme",{"p_theme_id":str(theme_id)})
    except SupabaseRestError as e: raise err(e,"THEME_PUBLISH_FAILED")

@router.post("/{theme_id}/versions/{version_id}/moderation")
async def moderate_theme(theme_id:UUID,version_id:UUID,p:ModerationRequest,context:dict=Depends(get_auth_context)):
    try: return await rpc(context["user"],"moderate_theme",{"p_theme_id":str(theme_id),"p_theme_version_id":str(version_id),"p_decision":p.decision})
    except SupabaseRestError as e: raise err(e,"THEME_MODERATION_FAILED")

@router.post("/world-templates/{template_id}/versions/{version_id}/moderation")
async def moderate_template(template_id:UUID,version_id:UUID,p:ModerationRequest,context:dict=Depends(get_auth_context)):
    try: return await rpc(context["user"],"moderate_world_template",{"p_world_template_id":str(template_id),"p_world_template_version_id":str(version_id),"p_decision":p.decision})
    except SupabaseRestError as e: raise err(e,"WORLD_TEMPLATE_MODERATION_FAILED")


class ThemeAssetLifecycleGateRequest(BaseModel):
    gate: Literal["moderation", "safety", "performance"]
    decision: Literal["approved", "restricted", "passed", "failed", "pending"]
    evidence: dict[str, Any] = Field(min_length=1)
    reason: str | None = Field(default=None, max_length=2000)


@router.post("/platform-assets/{asset_id}/lifecycle-gate")
async def record_platform_asset_lifecycle_gate(
    asset_id: UUID,
    p: ThemeAssetLifecycleGateRequest,
    context: dict = Depends(require_permission("admin.manage")),
):
    """Record an audited gate decision for an existing platform V3 asset; never uploads or auto-approves assets."""
    if p.gate == "moderation" and p.decision not in {"approved", "restricted", "pending"}:
        raise HTTPException(status_code=422, detail={"code": "INVALID_MODERATION_DECISION"})
    if p.gate in {"safety", "performance"} and p.decision not in {"passed", "failed", "pending"}:
        raise HTTPException(status_code=422, detail={"code": "INVALID_TECHNICAL_GATE_DECISION"})
    try:
        result = await rpc(
            context["user"],
            "record_v3_theme_asset_gate",
            {
                "p_asset_id": str(asset_id),
                "p_gate": p.gate,
                "p_decision": p.decision,
                "p_evidence": p.evidence,
                "p_reason": p.reason,
            },
        )
        return {"data": result}
    except SupabaseRestError as e:
        raise err(e, "THEME_ASSET_LIFECYCLE_GATE_FAILED")
