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

class MasterDataMutation(BaseModel):
    resource: str = Field(min_length=2, max_length=64)
    id: UUID | None = None
    action: str = Field(default="upsert", min_length=2, max_length=32)
    payload: dict[str, Any] = Field(default_factory=dict)
    reason: str = Field(min_length=3, max_length=2000)


class DomainOperation(BaseModel):
    operation: str = Field(min_length=2, max_length=64)
    resource: str = Field(min_length=2, max_length=64)
    id: UUID
    payload: dict[str, Any] = Field(default_factory=dict)
    reason: str = Field(min_length=3, max_length=2000)


@router.get("/transactions")
async def admin_transaction_explorer(
    q: str | None = Query(default=None, max_length=200),
    order_kind: str | None = Query(default=None, max_length=64),
    order_status: str | None = Query(default=None, max_length=64),
    payment_status: str | None = Query(default=None, max_length=64),
    provider_status: str | None = Query(default=None, max_length=64),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    context: dict[str, Any] = Depends(require_permission("admin.read")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_transaction_explorer", {
            "p_q": q, "p_order_kind": order_kind, "p_order_status": order_status,
            "p_payment_status": payment_status, "p_provider_status": provider_status,
            "p_from": date_from, "p_to": date_to, "p_limit": limit, "p_offset": offset,
        })}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_TRANSACTION_EXPLORER_FAILED") from exc


@router.get("/transactions/{order_id}")
async def admin_transaction_detail(
    order_id: UUID,
    context: dict[str, Any] = Depends(require_permission("admin.read")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_transaction_detail", {"p_order_id": str(order_id)})}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_TRANSACTION_DETAIL_FAILED") from exc


@router.get("/domains/{resource}")
async def admin_domain_records(
    resource: str,
    q: str | None = Query(default=None, max_length=200),
    status: str | None = Query(default=None, max_length=64),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    context: dict[str, Any] = Depends(require_permission("admin.read")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_domain_records", {
            "p_resource": resource, "p_q": q, "p_status": status, "p_limit": limit, "p_offset": offset,
        })}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_DOMAIN_RECORDS_FAILED") from exc


@router.post("/master-data/mutate")
async def mutate_master_data(
    payload: MasterDataMutation,
    context: dict[str, Any] = Depends(require_permission("admin.manage")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "mutate_admin_master_data", {
            "p_resource": payload.resource, "p_id": str(payload.id) if payload.id else None,
            "p_action": payload.action, "p_payload": payload.payload, "p_reason": payload.reason,
        })}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_MASTER_DATA_MUTATION_FAILED") from exc


@router.post("/domains/operate")
async def operate_domain(
    payload: DomainOperation,
    context: dict[str, Any] = Depends(require_permission("admin.manage")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "execute_admin_domain_operation", {
            "p_operation": payload.operation, "p_resource": payload.resource, "p_id": str(payload.id),
            "p_payload": payload.payload, "p_reason": payload.reason,
        })}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_DOMAIN_OPERATION_FAILED") from exc

class MasterDataRollback(BaseModel):
    resource: str = Field(min_length=2, max_length=64)
    id: UUID
    audit_id: UUID
    reason: str = Field(min_length=3, max_length=2000)


@router.get("/master-data/{resource}/{record_id}/history")
async def master_data_history(
    resource: str,
    record_id: UUID,
    limit: int = Query(default=50, ge=1, le=100),
    context: dict[str, Any] = Depends(require_permission("admin.read")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_master_data_history", {
            "p_resource": resource, "p_id": str(record_id), "p_limit": limit,
        })}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_MASTER_DATA_HISTORY_FAILED") from exc


@router.post("/master-data/rollback")
async def rollback_master_data(
    payload: MasterDataRollback,
    context: dict[str, Any] = Depends(require_permission("admin.manage")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "rollback_admin_master_data", {
            "p_resource": payload.resource, "p_id": str(payload.id),
            "p_audit_id": str(payload.audit_id), "p_reason": payload.reason,
        })}
    except SupabaseRestError as exc:
        raise _error(exc, "ADMIN_MASTER_DATA_ROLLBACK_FAILED") from exc
