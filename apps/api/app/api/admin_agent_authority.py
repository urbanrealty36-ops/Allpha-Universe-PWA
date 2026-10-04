from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import get_auth_context, require_permission
from app.core.supabase_rest import SupabaseRestError, rpc

router = APIRouter(prefix="/api/v1/admin/agent-authority", tags=["Admin Agent Authority"])


@router.get("/overview")
async def overview(
    limit: int = Query(default=100, ge=1, le=200),
    context: dict[str, Any] = Depends(require_permission("admin.read")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_agent_authority_overview", {"p_limit": limit})}
    except SupabaseRestError as exc:
        raise HTTPException(status_code=403 if exc.status_code == 403 else 502, detail={"code": "ADMIN_AUTHORITY_OVERVIEW_FAILED", "message": exc.message}) from exc


@router.get("/audit-logs")
async def audit_logs(
    limit: int = Query(default=200, ge=1, le=500),
    context: dict[str, Any] = Depends(require_permission("admin.read")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_audit_logs", {"p_limit": limit})}
    except SupabaseRestError as exc:
        raise HTTPException(status_code=403 if exc.status_code == 403 else 502, detail={"code": "ADMIN_AUDIT_LOGS_FAILED", "message": exc.message}) from exc


@router.get("/security-summary")
async def security_summary(
    context: dict[str, Any] = Depends(require_permission("admin.read")),
) -> dict[str, Any]:
    try:
        return {"data": await rpc(context["user"], "get_admin_control_plane_overview", {})}
    except SupabaseRestError as exc:
        raise HTTPException(status_code=403 if exc.status_code == 403 else 502, detail={"code": "ADMIN_SECURITY_SUMMARY_FAILED", "message": exc.message}) from exc
