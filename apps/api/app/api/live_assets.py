from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.storage import (
    SupabaseStorageError,
    create_signed_download_url,
    create_signed_upload_url,
)
from app.core.supabase_rest import SupabaseRestError, rpc, select

router = APIRouter(prefix="/api/v1/live-assets", tags=["Live 3D Assets"])


class StageAssetFinalize(BaseModel):
    checksum_sha256: str | None = Field(default=None, pattern=r"^[0-9a-fA-F]{64}$")


class CharacterAssetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    metadata: dict[str, Any] = Field(default_factory=dict)


class CharacterAssetFinalize(BaseModel):
    checksum_sha256: str | None = Field(default=None, pattern=r"^[0-9a-fA-F]{64}$")


def _err(exc: SupabaseRestError, code: str) -> HTTPException:
    return HTTPException(
        status_code=exc.status_code if exc.status_code in {400, 401, 403, 404, 409, 422} else 500,
        detail={"code": code, "message": exc.message},
    )


def _storage_err(exc: SupabaseStorageError, code: str) -> HTTPException:
    return HTTPException(
        status_code=exc.status_code if exc.status_code in {400, 401, 403, 404, 409, 422} else 502,
        detail={"code": code, "message": exc.message},
    )


@router.get("/templates/{template_version_id}/stage/manage")
async def stage_asset_manage_list(
    template_version_id: UUID,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        rows = await select(
            context["user"],
            "live_experience_stage_assets",
            {
                "select": "*",
                "template_version_id": f"eq.{template_version_id}",
                "asset_type": "eq.3d_stage",
                "order": "created_at.desc",
            },
        )
        return {"data": {"assets": rows}}
    except SupabaseRestError as exc:
        raise _err(exc, "LIVE_STAGE_ASSET_MANAGE_LOAD_FAILED") from exc


@router.get("/templates/{template_version_id}/stage")
async def stage_asset_manifest(
    template_version_id: UUID,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        versions = await select(
            context["user"],
            "live_experience_template_versions",
            {
                "select": "id,template_id,version,status,validation_status,moderation_status",
                "id": f"eq.{template_version_id}",
                "limit": "1",
            },
        )
        if not versions:
            raise HTTPException(404, detail={"code": "LIVE_TEMPLATE_VERSION_NOT_FOUND"})

        rows = await select(
            context["user"],
            "live_experience_stage_assets",
            {
                "select": "*",
                "template_version_id": f"eq.{template_version_id}",
                "asset_type": "eq.3d_stage",
                "status": "eq.active",
                "moderation_status": "eq.approved",
                "order": "created_at.desc",
            },
        )
        data = []
        for asset in rows:
            signed_url = await create_signed_download_url(
                context["user"], asset["storage_bucket"], asset["storage_path"], 900
            )
            data.append({**asset, "signed_url": signed_url})
        return {"data": {"template_version": versions[0], "assets": data, "active": data[0] if data else None}}
    except SupabaseRestError as exc:
        raise _err(exc, "LIVE_STAGE_ASSET_LOAD_FAILED") from exc
    except SupabaseStorageError as exc:
        raise _storage_err(exc, "LIVE_STAGE_ASSET_SIGN_FAILED") from exc


@router.post("/templates/{template_version_id}/stage/upload-url", status_code=201)
async def prepare_stage_upload(
    template_version_id: UUID,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        asset = await rpc(
            context["user"],
            "prepare_live_stage_3d_asset",
            {
                "p_template_version_id": str(template_version_id),
                "p_mime_type": "model/gltf-binary",
                "p_metadata": {"format": "glb", "lifecycle": "pending_upload"},
            },
        )
        upload = await create_signed_upload_url(
            context["user"], asset["storage_bucket"], asset["storage_path"]
        )
        return {"data": {"asset": asset, "upload": upload}}
    except SupabaseRestError as exc:
        raise _err(exc, "LIVE_STAGE_UPLOAD_PREPARE_FAILED") from exc
    except SupabaseStorageError as exc:
        raise _storage_err(exc, "LIVE_STAGE_UPLOAD_SIGN_FAILED") from exc


@router.post("/templates/{template_version_id}/stage/{asset_id}/finalize")
async def finalize_stage_upload(
    template_version_id: UUID,
    asset_id: UUID,
    payload: StageAssetFinalize,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        asset = await rpc(
            context["user"],
            "finalize_live_stage_3d_asset",
            {"p_asset_id": str(asset_id), "p_checksum_sha256": payload.checksum_sha256},
        )
        if str(asset.get("template_version_id")) != str(template_version_id):
            raise HTTPException(409, detail={"code": "LIVE_STAGE_ASSET_SCOPE_MISMATCH"})
        return {"data": asset}
    except SupabaseRestError as exc:
        raise _err(exc, "LIVE_STAGE_UPLOAD_FINALIZE_FAILED") from exc


@router.get("/agents/{agent_id}/character")
async def agent_character_manifest(
    agent_id: UUID,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        rows = await select(
            context["user"],
            "live_character_assets",
            {
                "select": "*",
                "agent_id": f"eq.{agent_id}",
                "asset_type": "eq.character",
                "status": "eq.active",
                "moderation_status": "eq.approved",
                "order": "created_at.desc",
            },
        )
        data = []
        for asset in rows:
            signed_url = await create_signed_download_url(
                context["user"], asset["storage_bucket"], asset["storage_path"], 900
            )
            data.append({**asset, "signed_url": signed_url})
        return {"data": {"assets": data, "active": data[0] if data else None}}
    except SupabaseRestError as exc:
        raise _err(exc, "AGENT_CHARACTER_ASSET_LOAD_FAILED") from exc
    except SupabaseStorageError as exc:
        raise _storage_err(exc, "AGENT_CHARACTER_ASSET_SIGN_FAILED") from exc


@router.post("/agents/{agent_id}/character/upload-url", status_code=201)
async def prepare_character_upload(
    agent_id: UUID,
    payload: CharacterAssetCreate,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        asset = await rpc(
            context["user"],
            "prepare_agent_character_3d_asset",
            {
                "p_agent_id": str(agent_id),
                "p_name": payload.name.strip(),
                "p_metadata": payload.metadata,
            },
        )
        upload = await create_signed_upload_url(
            context["user"], asset["storage_bucket"], asset["storage_path"]
        )
        return {"data": {"asset": asset, "upload": upload}}
    except SupabaseRestError as exc:
        raise _err(exc, "AGENT_CHARACTER_UPLOAD_PREPARE_FAILED") from exc
    except SupabaseStorageError as exc:
        raise _storage_err(exc, "AGENT_CHARACTER_UPLOAD_SIGN_FAILED") from exc


@router.post("/agents/{agent_id}/character/{asset_id}/finalize")
async def finalize_character_upload(
    agent_id: UUID,
    asset_id: UUID,
    payload: CharacterAssetFinalize,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        asset = await rpc(
            context["user"],
            "finalize_agent_character_3d_asset",
            {"p_asset_id": str(asset_id), "p_checksum_sha256": payload.checksum_sha256},
        )
        if str(asset.get("agent_id")) != str(agent_id):
            raise HTTPException(409, detail={"code": "AGENT_CHARACTER_ASSET_SCOPE_MISMATCH"})
        return {"data": asset}
    except SupabaseRestError as exc:
        raise _err(exc, "AGENT_CHARACTER_UPLOAD_FINALIZE_FAILED") from exc


class ModerationRequest(BaseModel):
    decision: str = Field(pattern=r"^(approved|restricted|rejected)$")


@router.post("/stage/{asset_id}/moderation")
async def moderate_stage_asset(
    asset_id: UUID,
    payload: ModerationRequest,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        asset = await rpc(
            context["user"],
            "moderate_live_stage_3d_asset",
            {"p_asset_id": str(asset_id), "p_decision": payload.decision},
        )
        return {"data": asset}
    except SupabaseRestError as exc:
        raise _err(exc, "LIVE_STAGE_MODERATION_FAILED") from exc


@router.get("/agents/{agent_id}/character/manage")
async def agent_character_manage_list(
    agent_id: UUID,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        rows = await select(
            context["user"],
            "live_character_assets",
            {
                "select": "*",
                "agent_id": f"eq.{agent_id}",
                "asset_type": "eq.character",
                "order": "created_at.desc",
            },
        )
        return {"data": {"assets": rows}}
    except SupabaseRestError as exc:
        raise _err(exc, "AGENT_CHARACTER_ASSET_MANAGE_LOAD_FAILED") from exc


@router.post("/agents/{agent_id}/character/{asset_id}/moderation")
async def moderate_agent_character_asset(
    agent_id: UUID,
    asset_id: UUID,
    payload: ModerationRequest,
    context: dict[str, Any] = Depends(get_auth_context),
):
    try:
        asset = await rpc(
            context["user"],
            "moderate_agent_character_3d_asset",
            {"p_asset_id": str(asset_id), "p_decision": payload.decision},
        )
        if str(asset.get("agent_id")) != str(agent_id):
            raise HTTPException(409, detail={"code": "AGENT_CHARACTER_ASSET_SCOPE_MISMATCH"})
        return {"data": asset}
    except SupabaseRestError as exc:
        raise _err(exc, "AGENT_CHARACTER_MODERATION_FAILED") from exc
