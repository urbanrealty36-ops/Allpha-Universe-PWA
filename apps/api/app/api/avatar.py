from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.supabase_rest import SupabaseRestError, insert, select, update

router = APIRouter(prefix="/api/v1/avatar", tags=["User Character, Uniform, Sticker & Cosmetics"])

class CharacterCreate(BaseModel):
    character_key: str = Field(min_length=1, max_length=120)
    display_name: str | None = Field(default=None, max_length=160)
    appearance: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)

class EquipRequest(BaseModel):
    equipped: bool = True

def _err(exc: SupabaseRestError, code: str) -> HTTPException:
    status = exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
    return HTTPException(status_code=status, detail={"code": code, "message": exc.message})

@router.get("/characters")
async def characters(context: dict[str, Any] = Depends(get_auth_context)):
    return {"data": await select(context["user"], "user_characters", {
        "select": "*", "user_id": f"eq.{context['user'].user_id}", "order": "created_at.desc"
    })}

@router.post("/characters", status_code=201)
async def create_character(payload: CharacterCreate, context: dict[str, Any] = Depends(get_auth_context)):
    user = context["user"]
    catalog = await select(user, "agent_character_catalog", {
        "select": "character_key,visual_profile", "character_key": f"eq.{payload.character_key}",
        "enabled": "eq.true", "limit": "1"
    })
    if not catalog:
        raise HTTPException(422, detail={"code":"USER_CHARACTER_CATALOG_KEY_INVALID","message":"Character key is not available."})
    values = {
        "user_id": str(user.user_id), "character_key": payload.character_key,
        "display_name": payload.display_name, "appearance": payload.appearance,
        "metadata": {"visual_profile": catalog[0].get("visual_profile") or {}, **payload.metadata},
    }
    try:
        rows = await insert(user, "user_characters", values)
    except SupabaseRestError as exc:
        raise _err(exc, "USER_CHARACTER_CREATE_FAILED") from exc
    return {"data": rows[0] if rows else None}

@router.post("/characters/{character_id}/equip")
async def equip_character(character_id: UUID, payload: EquipRequest, context: dict[str, Any] = Depends(get_auth_context)):
    user = context["user"]
    rows = await select(user, "user_characters", {"select":"id", "id":f"eq.{character_id}", "user_id":f"eq.{user.user_id}", "limit":"1"})
    if not rows:
        raise HTTPException(404, detail={"code":"USER_CHARACTER_NOT_FOUND"})
    try:
        if payload.equipped:
            await update(user, "user_characters", {"user_id":f"eq.{user.user_id}", "equipped":"eq.true"}, {"equipped":False}, returning=False)
        rows = await update(user, "user_characters", {"id":f"eq.{character_id}", "user_id":f"eq.{user.user_id}"}, {"equipped":payload.equipped})
    except SupabaseRestError as exc:
        raise _err(exc, "USER_CHARACTER_EQUIP_FAILED") from exc
    return {"data": rows[0] if rows else None}

@router.get("/uniforms/catalog")
async def uniform_catalog(context: dict[str, Any] = Depends(get_auth_context)):
    return {"data": await select(context["user"], "uniform_catalog", {
        "select":"id,uniform_key,name,description,asset_type,storage_bucket,storage_path,mime_type,checksum_sha256,theme_compatibility,metadata,status,moderation_status",
        "status":"eq.published", "moderation_status":"eq.approved", "order":"name.asc"
    })}

@router.get("/uniforms/owned")
async def owned_uniforms(context: dict[str, Any] = Depends(get_auth_context)):
    return {"data": await select(context["user"], "user_uniforms", {
        "select":"*,uniform_catalog(id,uniform_key,name,asset_type,storage_bucket,storage_path,theme_compatibility)",
        "user_id":f"eq.{context['user'].user_id}", "status":"eq.owned", "order":"created_at.desc"
    })}

@router.post("/uniforms/{ownership_id}/equip")
async def equip_uniform(ownership_id: UUID, payload: EquipRequest, context: dict[str, Any] = Depends(get_auth_context)):
    user=context["user"]
    rows=await select(user,"user_uniforms",{"select":"id","id":f"eq.{ownership_id}","user_id":f"eq.{user.user_id}","status":"eq.owned","limit":"1"})
    if not rows: raise HTTPException(404,detail={"code":"USER_UNIFORM_NOT_FOUND"})
    try:
        if payload.equipped:
            await update(user,"user_uniforms",{"user_id":f"eq.{user.user_id}","equipped":"eq.true"},{"equipped":False},returning=False)
        rows=await update(user,"user_uniforms",{"id":f"eq.{ownership_id}","user_id":f"eq.{user.user_id}"},{"equipped":payload.equipped})
    except SupabaseRestError as exc: raise _err(exc,"USER_UNIFORM_EQUIP_FAILED") from exc
    return {"data":rows[0] if rows else None}

@router.get("/stickers/catalog")
async def sticker_catalog(context: dict[str, Any] = Depends(get_auth_context)):
    return {"data": await select(context["user"], "sticker_catalog", {
        "select":"id,sticker_key,name,description,asset_type,storage_bucket,storage_path,mime_type,checksum_sha256,theme_compatibility,metadata,status,moderation_status",
        "status":"eq.published", "moderation_status":"eq.approved", "order":"name.asc"
    })}

@router.get("/stickers/owned")
async def owned_stickers(context: dict[str, Any] = Depends(get_auth_context)):
    return {"data": await select(context["user"], "user_stickers", {
        "select":"*,sticker_catalog(id,sticker_key,name,asset_type,storage_bucket,storage_path,theme_compatibility)",
        "user_id":f"eq.{context['user'].user_id}", "status":"eq.owned", "order":"created_at.desc"
    })}

@router.get("/cosmetics/catalog")
async def cosmetic_catalog(context: dict[str, Any] = Depends(get_auth_context)):
    return {"data": await select(context["user"], "cosmetic_catalog", {
        "select":"id,cosmetic_key,name,category,description,asset_type,storage_bucket,storage_path,mime_type,checksum_sha256,theme_compatibility,metadata,status,moderation_status",
        "status":"eq.published", "moderation_status":"eq.approved", "order":"category.asc,name.asc"
    })}

@router.get("/cosmetics/owned")
async def owned_cosmetics(context: dict[str, Any] = Depends(get_auth_context)):
    return {"data": await select(context["user"], "user_cosmetics", {
        "select":"*,cosmetic_catalog(id,cosmetic_key,name,category,asset_type,storage_bucket,storage_path,theme_compatibility)",
        "user_id":f"eq.{context['user'].user_id}", "status":"eq.owned", "order":"created_at.desc"
    })}

@router.post("/cosmetics/{ownership_id}/equip")
async def equip_cosmetic(ownership_id: UUID, payload: EquipRequest, context: dict[str, Any] = Depends(get_auth_context)):
    user=context["user"]
    owned=await select(user,"user_cosmetics",{"select":"id,slot_key","id":f"eq.{ownership_id}","user_id":f"eq.{user.user_id}","status":"eq.owned","limit":"1"})
    if not owned: raise HTTPException(404,detail={"code":"USER_COSMETIC_NOT_FOUND"})
    try:
        if payload.equipped:
            await update(user,"user_cosmetics",{"user_id":f"eq.{user.user_id}","slot_key":f"eq.{owned[0]['slot_key']}","equipped":"eq.true"},{"equipped":False},returning=False)
        rows=await update(user,"user_cosmetics",{"id":f"eq.{ownership_id}","user_id":f"eq.{user.user_id}"},{"equipped":payload.equipped})
    except SupabaseRestError as exc: raise _err(exc,"USER_COSMETIC_EQUIP_FAILED") from exc
    return {"data":rows[0] if rows else None}

@router.get("/state")
async def avatar_state(context: dict[str, Any] = Depends(get_auth_context)):
    user=context["user"]
    characters=await select(user,"user_characters",{"select":"*","user_id":f"eq.{user.user_id}","equipped":"eq.true","limit":"1"})
    uniforms=await select(user,"user_uniforms",{"select":"*,uniform_catalog(id,uniform_key,name,asset_type,storage_path,theme_compatibility)","user_id":f"eq.{user.user_id}","equipped":"eq.true","status":"eq.owned","limit":"1"})
    cosmetics=await select(user,"user_cosmetics",{"select":"*,cosmetic_catalog(id,cosmetic_key,name,category,asset_type,storage_path,theme_compatibility)","user_id":f"eq.{user.user_id}","equipped":"eq.true","status":"eq.owned","order":"slot_key.asc"})
    return {"data":{"character":characters[0] if characters else None,"uniform":uniforms[0] if uniforms else None,"cosmetics":cosmetics}}
