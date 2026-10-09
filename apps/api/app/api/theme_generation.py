from __future__ import annotations

import os
from typing import Any, Literal
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import require_permission
from app.core.ai_gateway import AIGatewayError, GatewayMessage, generate
from app.core.supabase_rest import SupabaseRestError, service_insert, service_rpc, service_select, service_update
from app.core.theme_asset_ingestion import ThemeAssetIngestionError, create_signed_asset_url, ensure_theme_records, persist_generated_asset
from app.core.theme_workflow import create_theme_workflow_run, sync_theme_workflow_run

router = APIRouter(prefix="/api/v1/theme-generation", tags=["Theme Package Orchestration"])
TRIPO_BASE_URL = "https://openapi.tripo3d.ai/v3"

class PackageAssetInput(BaseModel):
    key: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9_-]+$")
    label: str = Field(min_length=1, max_length=160)
    prompt: str = Field(min_length=8, max_length=1024)

class PackageCreate(BaseModel):
    theme_name: str = Field(min_length=1, max_length=160)
    theme_direction: str = Field(min_length=1, max_length=2000)
    assets: list[PackageAssetInput] = Field(min_length=1, max_length=25)
    idempotency_key: str = Field(min_length=8, max_length=255)
    face_limit: int = Field(default=50000, ge=1000, le=150000)

class PricingUpdate(BaseModel):
    enabled: bool = True
    credits_per_asset: int = Field(ge=1, le=100000)
    max_assets_per_package: int = Field(default=25, ge=1, le=25)

def _require_tripo() -> str:
    key = os.getenv("TRIPO_API_KEY", "").strip()
    if not key:
        raise HTTPException(status_code=503, detail={"code":"TRIPO_NOT_CONFIGURED","message":"3D generation is not configured on the API service."})
    return key

def _http_error(exc: SupabaseRestError, code: str) -> HTTPException:
    status = exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
    return HTTPException(status_code=status, detail={"code":code,"message":exc.message})

async def _route_prompt(user, package_id: str, asset_key: str, prompt: str) -> tuple[str, dict[str, Any]]:
    """Use the canonical Allpha AI Gateway/Model Router for prompt refinement when configured."""
    try:
        result = await generate(
            user,
            [
                GatewayMessage(role="system", content="You are Allpha Theme Studio's 3D art director. Preserve the user's intent and asset type. Return only one concise, production-oriented text-to-3D prompt, with no commentary, no markdown, and no new brand names."),
                GatewayMessage(role="user", content=prompt),
            ],
            capabilities=["text"],
            idempotency_key=f"theme-prompt-{package_id}-{asset_key}-v1",
            metadata={"feature": "theme_package_generation", "package_id": package_id, "asset_key": asset_key},
        )
        routed = result.text.strip()
        if not routed:
            return prompt, {"model_router": "empty_response_fallback"}
        return routed[:1024], {"model_router": "used", "request_id": result.request_id, "model_id": result.model_id, "provider_id": result.provider_id}
    except AIGatewayError as exc:
        return prompt, {"model_router": "fallback", "error_code": exc.code}
    except Exception:
        return prompt, {"model_router": "fallback", "error_code": "AI_ROUTER_UNAVAILABLE"}


async def _tripo_create(prompt: str, face_limit: int) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {_require_tripo()}", "Content-Type": "application/json"}
    payload = {"prompt": prompt, "model": "v3.1-20260211", "face_limit": face_limit, "texture": True, "pbr": True, "texture_quality": "detailed"}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            response = await client.post(f"{TRIPO_BASE_URL}/generation/text-to-model", headers=headers, json=payload)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail={"code":"TRIPO_UPSTREAM_UNAVAILABLE","message":"Tripo is temporarily unavailable."}) from exc
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail={"code":"TRIPO_UPSTREAM_ERROR","provider_status":response.status_code,"message":"Tripo rejected an asset task."})
    try:
        body = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail={"code":"TRIPO_INVALID_RESPONSE","message":"Tripo returned an invalid response."}) from exc
    data = body.get("data", body) if isinstance(body, dict) else None
    if not isinstance(data, dict) or body.get("code", 0) != 0 or not data.get("task_id"):
        raise HTTPException(status_code=502, detail={"code":"TRIPO_TASK_ID_MISSING","message":"Tripo did not return a valid task ID."})
    return data

async def _tripo_task(task_id: str) -> dict[str, Any]:
    if not task_id or len(task_id) > 160:
        raise HTTPException(status_code=422, detail={"code":"TRIPO_TASK_ID_INVALID","message":"Invalid provider task ID."})
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(f"{TRIPO_BASE_URL}/tasks/{task_id}", headers={"Authorization": f"Bearer {_require_tripo()}"})
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail={"code":"TRIPO_UPSTREAM_UNAVAILABLE","message":"Tripo is temporarily unavailable."}) from exc
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail={"code":"TRIPO_TASK_QUERY_FAILED","provider_status":response.status_code,"message":"Tripo task query failed."})
    body = response.json()
    if not isinstance(body, dict) or body.get("code", 0) != 0:
        raise HTTPException(status_code=502, detail={"code":"TRIPO_TASK_QUERY_FAILED","message":"Tripo task query failed."})
    data = body.get("data", body)
    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail={"code":"TRIPO_INVALID_RESPONSE","message":"Tripo returned an unexpected response."})
    return data

async def _refresh_item(item: dict[str, Any], package: dict[str, Any]) -> dict[str, Any]:
    if item.get("status") in {"success","failed","cancelled"}:
        if item.get("storage_path"):
            item = {**item, "model_url": await create_signed_asset_url(str(item["storage_path"]))}
        return item
    if not item.get("provider_task_id"):
        return item
    try:
        data = await _tripo_task(str(item["provider_task_id"]))
        status = str(data.get("status") or "running").lower()
        if status in {"queued","pending","running","processing","in_progress"}:
            status = "running"
        elif status in {"success","succeeded","completed"}:
            status = "success"
        elif status in {"failed","error","cancelled","canceled"}:
            status = "failed" if status != "cancelled" and status != "canceled" else "cancelled"
        output = data.get("output") if isinstance(data.get("output"), dict) else {}
        patch = {
            "status": status,
            "progress": data.get("progress") if isinstance(data.get("progress"), int) else (100 if status == "success" else None),
            "model_url": output.get("model_url") or output.get("pbr_model") or output.get("base_model"),
            "preview_url": output.get("rendered_image_url") or output.get("preview"),
            "error_code": None if status != "failed" else str(data.get("error_code") or "TRIPO_TASK_FAILED"),
            "error_message": None if status != "failed" else "Provider task failed. Review provider task details before retrying.",
            "updated_at": "now()",
        }
        if status == "success":
            try:
                package = await ensure_theme_records(package)
                item = await persist_generated_asset(package, item, output)
                signed_url = await create_signed_asset_url(str(item["storage_path"])) if item.get("storage_path") else None
                return {**item, "model_url": signed_url}
            except ThemeAssetIngestionError as exc:
                patch.update({"status":"failed","error_code":exc.code,"error_message":str(exc),"model_url":None})
        updated = await service_update("theme_generation_items", {"id":f"eq.{item['id']}"}, {k:v for k,v in patch.items() if v != "now()"})
        return updated[0] if updated else {**item, **patch}
    except HTTPException:
        return item

async def _refresh_package(package: dict[str, Any]) -> dict[str, Any]:
    items = await service_select("theme_generation_items", {"select":"*","package_id":f"eq.{package['id']}","order":"created_at.asc"})
    refreshed = []
    for item in items:
        refreshed.append(await _refresh_item(item, package))
    statuses = [item.get("status") for item in refreshed]
    if statuses and all(s == "success" for s in statuses):
        status = "succeeded"
    elif statuses and all(s in {"success","failed","cancelled"} for s in statuses):
        status = "partial" if any(s == "success" for s in statuses) else "failed"
    elif any(s in {"running","submitting","success"} for s in statuses):
        status = "running"
    else:
        status = "queued"
    patch = {"status":status, "updated_at":None, "completed_at":None}
    if status in {"succeeded","partial","failed","cancelled"}:
        from datetime import datetime, timezone
        patch["completed_at"] = datetime.now(timezone.utc).isoformat()
    if status in {"succeeded","partial","failed","cancelled"}:
        metadata = package.get("metadata") if isinstance(package.get("metadata"), dict) else {}
        if not metadata.get("credits_settlement"):
            try:
                settlement = await service_rpc("settle_theme_generation_credits", {
                    "p_user_id": str(package["owner_user_id"]),
                    "p_package_id": str(package["id"]),
                    "p_successful_assets": sum(1 for item in refreshed if item.get("status") == "success"),
                    "p_credits_per_asset": int(metadata.get("credits_per_asset") or 1),
                })
                metadata = {**metadata, "credits_settlement": settlement}
                patch["metadata"] = metadata
            except SupabaseRestError:
                pass
    updated = await service_update("theme_generation_packages", {"id":f"eq.{package['id']}"}, {k:v for k,v in patch.items() if v is not None})
    current_package = updated[0] if updated else {**package,"status":status}
    await sync_theme_workflow_run(current_package, refreshed, status)
    return {"package": current_package, "items":refreshed}

@router.get("/pricing")
async def get_pricing(context: dict = Depends(require_permission("admin.manage"))) -> dict[str, Any]:
    rows = await service_select("theme_generation_pricing", {"select":"*","id":"eq.1","limit":"1"})
    if not rows:
        raise HTTPException(status_code=503, detail={"code":"THEME_PRICING_NOT_CONFIGURED","message":"Theme generation pricing has not been configured."})
    return {"data": rows[0]}

@router.put("/pricing")
async def update_pricing(payload: PricingUpdate, context: dict = Depends(require_permission("admin.manage"))) -> dict[str, Any]:
    user = context["user"]
    rows = await service_update("theme_generation_pricing", {"id":"eq.1"}, {
        "enabled":payload.enabled,
        "credits_per_asset":payload.credits_per_asset,
        "max_assets_per_package":payload.max_assets_per_package,
        "updated_by_user_id":str(user.user_id),
        "updated_at":"now()",
    })
    if not rows:
        raise HTTPException(status_code=503, detail={"code":"THEME_PRICING_UPDATE_FAILED","message":"Theme generation pricing could not be updated."})
    return {"data":rows[0]}

@router.post("/packages", status_code=201)
async def create_package(payload: PackageCreate, context: dict = Depends(require_permission("admin.manage"))) -> dict[str, Any]:
    user = context["user"]
    existing = await service_select("theme_generation_packages", {"select":"*","owner_user_id":f"eq.{user.user_id}","idempotency_key":f"eq.{payload.idempotency_key}","limit":"1"})
    if existing:
        return await _refresh_package(existing[0])
    _require_tripo()
    pricing_rows = await service_select("theme_generation_pricing", {"select":"*","id":"eq.1","limit":"1"})
    if not pricing_rows or not pricing_rows[0].get("enabled"):
        raise HTTPException(status_code=503, detail={"code":"THEME_GENERATION_DISABLED","message":"Theme generation is disabled by the current billing policy."})
    pricing = pricing_rows[0]
    if len(payload.assets) > int(pricing.get("max_assets_per_package") or 25):
        raise HTTPException(status_code=422, detail={"code":"THEME_PACKAGE_ASSET_LIMIT","message":"The package exceeds the configured asset limit."})
    credits_per_asset = int(pricing.get("credits_per_asset") or 1)
    reserved_credits = credits_per_asset * len(payload.assets)
    try:
        rows = await service_insert("theme_generation_packages", {
            "owner_user_id":str(user.user_id), "theme_name":payload.theme_name,
            "theme_direction":payload.theme_direction, "idempotency_key":payload.idempotency_key,
            "status":"queued", "metadata":{"asset_count":len(payload.assets),"face_limit":payload.face_limit,"credits_per_asset":credits_per_asset,"credits_reserved":reserved_credits}
        })
        if not rows:
            raise HTTPException(status_code=500, detail={"code":"THEME_PACKAGE_PERSIST_FAILED","message":"Package could not be persisted."})
        package = rows[0]
        await service_insert("theme_generation_items", [{
            "package_id":package["id"], "owner_user_id":str(user.user_id), "asset_key":a.key,
            "asset_label":a.label, "prompt":f"{payload.theme_name}: {a.label}. {payload.theme_direction} Asset brief: {a.prompt}"[:1024],
            "status":"queued"
        } for a in payload.assets], returning=False)
    except SupabaseRestError as exc:
        raise _http_error(exc,"THEME_PACKAGE_CREATE_FAILED")
    try:
        reservation = await service_rpc("reserve_theme_generation_credits", {
            "p_user_id": str(user.user_id),
            "p_package_id": str(package["id"]),
            "p_amount": reserved_credits,
        })
        metadata = {**(package.get("metadata") or {}), "credit_reservation": reservation}
        await service_update("theme_generation_packages", {"id":f"eq.{package['id']}"}, {"metadata":metadata})
        package["metadata"] = metadata
    except SupabaseRestError as exc:
        await service_update("theme_generation_packages", {"id":f"eq.{package['id']}"}, {"status":"failed","completed_at":"2026-10-09T00:00:00+00:00","metadata":{**(package.get("metadata") or {}),"billing_error":"reservation_failed"}})
        if "INSUFFICIENT_AI_CREDITS" in exc.message:
            raise HTTPException(status_code=402, detail={"code":"INSUFFICIENT_AI_CREDITS","message":"Not enough Allpha AI Credits to reserve this package."}) from exc
        raise HTTPException(status_code=503, detail={"code":"THEME_CREDIT_RESERVATION_FAILED","message":"AI Credits could not be reserved. No provider tasks were submitted."}) from exc
    try:
        package = await ensure_theme_records(package)
    except (ThemeAssetIngestionError, SupabaseRestError) as exc:
        await service_rpc("settle_theme_generation_credits", {"p_user_id":str(user.user_id),"p_package_id":str(package["id"]),"p_successful_assets":0,"p_credits_per_asset":credits_per_asset})
        from datetime import datetime, timezone
        await service_update("theme_generation_packages", {"id":f"eq.{package['id']}"}, {"status":"failed","completed_at":datetime.now(timezone.utc).isoformat()})
        raise HTTPException(status_code=503, detail={"code":"THEME_RECORD_CREATE_FAILED","message":"Theme draft/version creation failed; reserved credits were released."}) from exc
    items = await service_select("theme_generation_items", {"select":"*","package_id":f"eq.{package['id']}","order":"created_at.asc"})
    try:
        workflow = await create_theme_workflow_run(package, items)
        package = workflow["package"]
        items = await service_select("theme_generation_items", {"select":"*","package_id":f"eq.{package['id']}","order":"created_at.asc"})
    except (RuntimeError, SupabaseRestError) as exc:
        await service_rpc("settle_theme_generation_credits", {"p_user_id":str(user.user_id),"p_package_id":str(package["id"]),"p_successful_assets":0,"p_credits_per_asset":credits_per_asset})
        from datetime import datetime, timezone
        await service_update("theme_generation_packages", {"id":f"eq.{package['id']}"}, {"status":"failed","completed_at":datetime.now(timezone.utc).isoformat()})
        raise HTTPException(status_code=503, detail={"code":"THEME_WORKFLOW_START_FAILED","message":"Theme Workflow Engine run could not be started; reserved credits were released."}) from exc
    for item in items:
        try:
            await service_update("theme_generation_items", {"id":f"eq.{item['id']}"}, {"status":"submitting"})
            routed_prompt, router_meta = await _route_prompt(user, str(package["id"]), str(item["asset_key"]), str(item["prompt"]))
            task = await _tripo_create(routed_prompt, payload.face_limit)
            await service_update("theme_generation_items", {"id":f"eq.{item['id']}"}, {"provider_task_id":task["task_id"],"status":"running","metadata":{"provider_created_at":task.get("created_at"),"provider_status":task.get("status"),"routed_prompt":routed_prompt,**router_meta}})
        except (HTTPException, SupabaseRestError) as exc:
            detail = exc.detail if isinstance(exc, HTTPException) and isinstance(exc.detail, dict) else {}
            await service_update("theme_generation_items", {"id":f"eq.{item['id']}"}, {"status":"failed","error_code":detail.get("code","THEME_ASSET_SUBMIT_FAILED"),"error_message":detail.get("message","Could not submit asset task.")})
    package = (await service_select("theme_generation_packages", {"select":"*","id":f"eq.{package['id']}","limit":"1"}))[0]
    return await _refresh_package(package)

@router.get("/packages")
async def list_packages(limit: int = Query(20, ge=1, le=100), context: dict = Depends(require_permission("admin.manage"))) -> dict[str, Any]:
    user=context["user"]
    packages=await service_select("theme_generation_packages", {"select":"*","owner_user_id":f"eq.{user.user_id}","order":"created_at.desc","limit":str(limit)})
    return {"data":packages}

@router.get("/packages/{package_id}")
async def get_package(package_id: UUID, context: dict = Depends(require_permission("admin.manage"))) -> dict[str, Any]:
    user=context["user"]
    packages=await service_select("theme_generation_packages", {"select":"*","id":f"eq.{package_id}","owner_user_id":f"eq.{user.user_id}","limit":"1"})
    if not packages:
        raise HTTPException(status_code=404,detail={"code":"THEME_PACKAGE_NOT_FOUND","message":"Theme package not found."})
    return {"data":await _refresh_package(packages[0])}

@router.post("/packages/{package_id}/retry")
async def retry_failed(package_id: UUID, context: dict = Depends(require_permission("admin.manage"))) -> dict[str, Any]:
    user=context["user"]
    packages=await service_select("theme_generation_packages", {"select":"*","id":f"eq.{package_id}","owner_user_id":f"eq.{user.user_id}","limit":"1"})
    if not packages:
        raise HTTPException(status_code=404,detail={"code":"THEME_PACKAGE_NOT_FOUND","message":"Theme package not found."})
    package=packages[0]
    items=await service_select("theme_generation_items", {"select":"*","package_id":f"eq.{package_id}","status":"eq.failed","order":"created_at.asc"})
    if not items:
        raise HTTPException(status_code=409,detail={"code":"NO_FAILED_ASSETS","message":"This package has no failed assets to retry."})
    for item in items:
        if int(item.get("retry_count") or 0) >= 3:
            continue
        try:
            task=await _tripo_create(str(item["prompt"]),int((package.get("metadata") or {}).get("face_limit") or 50000))
            await service_update("theme_generation_items",{"id":f"eq.{item['id']}"},{"provider_task_id":task["task_id"],"status":"running","retry_count":int(item.get("retry_count") or 0)+1,"error_code":None,"error_message":None})
        except HTTPException as exc:
            detail=exc.detail if isinstance(exc.detail,dict) else {}
            await service_update("theme_generation_items",{"id":f"eq.{item['id']}"},{"retry_count":int(item.get("retry_count") or 0)+1,"error_code":detail.get("code","THEME_ASSET_RETRY_FAILED"),"error_message":detail.get("message","Retry failed.")})
    return {"data":await _refresh_package(package)}
