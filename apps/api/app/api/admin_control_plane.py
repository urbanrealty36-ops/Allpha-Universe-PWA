from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import require_permission
from app.core.supabase_rest import SupabaseRestError, rpc

router = APIRouter(prefix="/api/v1/admin/control-plane", tags=["Admin Control Plane"])

class FeatureFlagUpsert(BaseModel):
    key: str = Field(min_length=2, max_length=128, pattern=r"^[a-z][a-z0-9_.:-]{1,127}$")
    description: str | None = Field(default=None, max_length=1000)
    enabled: bool = False
    rollout_percent: int = Field(default=0, ge=0, le=100)
    targeting: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)

class ConfigVersionCreate(BaseModel):
    namespace: str = Field(min_length=2, max_length=128, pattern=r"^[a-z][a-z0-9_.:-]{1,127}$")
    config: dict[str, Any] = Field(default_factory=dict)

def _error(exc: SupabaseRestError, code: str) -> HTTPException:
    status_code = exc.status_code if exc.status_code in {400, 401, 403, 404, 409, 422} else 502
    return HTTPException(status_code=status_code, detail={"code": code, "message": exc.message})

@router.get("/overview")
async def control_plane_overview(context: dict[str, Any] = Depends(require_permission("admin.read"))) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_control_plane_overview", {})}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_CONTROL_PLANE_OVERVIEW_FAILED") from exc

@router.get("/feature-flags")
async def feature_flags(limit: int = Query(default=200, ge=1, le=500), context: dict[str, Any] = Depends(require_permission("admin.read"))) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_feature_flags", {"p_limit": limit})}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_FEATURE_FLAGS_FAILED") from exc

@router.put("/feature-flags/{key}")
async def upsert_feature_flag(key: str, payload: FeatureFlagUpsert, context: dict[str, Any] = Depends(require_permission("admin.manage"))) -> dict[str, Any]:
    if key != payload.key:
        raise HTTPException(status_code=422, detail={"code": "FEATURE_FLAG_KEY_MISMATCH", "message": "The path key must match the feature flag payload key."})
    try:
        return {"data": await rpc(context["user"], "upsert_admin_feature_flag", {"p_key": payload.key, "p_description": payload.description, "p_enabled": payload.enabled, "p_rollout_percent": payload.rollout_percent, "p_targeting": payload.targeting, "p_metadata": payload.metadata})}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_FEATURE_FLAG_UPSERT_FAILED") from exc

@router.get("/config-versions")
async def config_versions(namespace: str | None = Query(default=None, max_length=128), limit: int = Query(default=200, ge=1, le=500), context: dict[str, Any] = Depends(require_permission("admin.read"))) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_config_versions", {"p_namespace": namespace, "p_limit": limit})}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_CONFIG_VERSIONS_FAILED") from exc

@router.post("/config-versions", status_code=201)
async def create_config_version(payload: ConfigVersionCreate, context: dict[str, Any] = Depends(require_permission("admin.manage"))) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "create_admin_config_version", {"p_namespace": payload.namespace, "p_config": payload.config})}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_CONFIG_VERSION_CREATE_FAILED") from exc

@router.post("/config-versions/{config_version_id}/publish")
async def publish_config_version(config_version_id: UUID, context: dict[str, Any] = Depends(require_permission("admin.manage"))) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "publish_admin_config_version", {"p_config_version_id": str(config_version_id)})}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_CONFIG_VERSION_PUBLISH_FAILED") from exc

@router.get("/analytics")
async def admin_analytics(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    context: dict[str, Any] = Depends(require_permission("admin.read")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_analytics", {"p_from": date_from, "p_to": date_to})}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_ANALYTICS_FAILED") from exc

@router.get("/master-data")
async def admin_master_data(
    context: dict[str, Any] = Depends(require_permission("admin.read")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_master_data", {})}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_MASTER_DATA_FAILED") from exc
