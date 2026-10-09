from __future__ import annotations

from typing import Any

from app.core.supabase_rest import service_insert, service_update


async def create_theme_workflow_run(package: dict[str, Any], items: list[dict[str, Any]]) -> dict[str, Any]:
    package_id = str(package["id"])
    user_id = str(package["owner_user_id"])
    workflow_rows = await service_insert("workflows", {
        "owner_type": "user",
        "owner_id": user_id,
        "name": f"Theme Package — {str(package['theme_name'])[:100]}",
        "slug": f"theme-package-{package_id.replace('-', '')[:24]}",
        "description": "Canonical Theme Studio pipeline: provider generation, persistent asset ingestion, validation, and human-controlled publication.",
        "status": "active",
        "trigger_type": "manual",
        "metadata": {"system_key": "theme_package_generation", "package_id": package_id, "execution_mode": "theme_package_orchestrator"},
    })
    if not workflow_rows:
        raise RuntimeError("THEME_WORKFLOW_CREATE_FAILED")
    workflow = workflow_rows[0]
    version_rows = await service_insert("workflow_versions", {
        "workflow_id": workflow["id"],
        "version_no": 1,
        "status": "published",
        "input_schema": {"type": "object", "required": ["package_id"]},
        "metadata": {"package_id": package_id, "execution_mode": "theme_package_orchestrator"},
        "published_at": "now()",
    })
    if not version_rows:
        raise RuntimeError("THEME_WORKFLOW_VERSION_CREATE_FAILED")
    version = version_rows[0]
    steps = []
    for index, item in enumerate(items, start=1):
        rows = await service_insert("workflow_steps", {
            "workflow_version_id": version["id"],
            "step_key": f"generate-{item['asset_key']}",
            "title": f"Generate {item['asset_label']}",
            "description": "Generate through the Tripo provider adapter and persist a validated draft GLB in Allpha Storage.",
            "sequence_no": index,
            "tool_key": "theme.tripo.generate",
            "arguments": {"package_id": package_id, "asset_key": item["asset_key"]},
            "input_schema": {"type": "object"},
            "condition": {},
            "retry_policy": {"max_attempts": 3, "retry_on": ["provider_unavailable", "provider_task_failed"]},
            "risk_level": "low",
            "requires_approval": False,
            "enabled": True,
        })
        if not rows:
            raise RuntimeError("THEME_WORKFLOW_STEP_CREATE_FAILED")
        steps.append(rows[0])
    run_rows = await service_insert("workflow_runs", {
        "workflow_id": workflow["id"],
        "workflow_version_id": version["id"],
        "initiated_by_user_id": user_id,
        "agent_id": None,
        "status": "running",
        "input": {"package_id": package_id, "theme_name": package["theme_name"], "asset_count": len(items)},
        "output": {"execution_mode": "theme_package_orchestrator"},
        "started_at": "now()",
    })
    if not run_rows:
        raise RuntimeError("THEME_WORKFLOW_RUN_CREATE_FAILED")
    run = run_rows[0]
    run_steps = []
    for step, item in zip(steps, items):
        rows = await service_insert("workflow_run_steps", {
            "workflow_run_id": run["id"],
            "workflow_step_id": step["id"],
            "status": "pending",
            "result": {"asset_key": item["asset_key"], "generation_item_id": item["id"]},
        })
        if not rows:
            raise RuntimeError("THEME_WORKFLOW_RUN_STEP_CREATE_FAILED")
        run_steps.append(rows[0])
        metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else {}
        await service_update("theme_generation_items", {"id": f"eq.{item['id']}"}, {
            "metadata": {**metadata, "workflow_step_id": step["id"], "workflow_run_step_id": rows[0]["id"]},
        })
    await service_insert("workflow_events", {
        "workflow_run_id": run["id"],
        "event_type": "theme_package.started",
        "from_status": "created",
        "to_status": "running",
        "metadata": {"package_id": package_id, "workflow_version_id": version["id"], "step_count": len(steps)},
    }, returning=False)
    metadata = package.get("metadata") if isinstance(package.get("metadata"), dict) else {}
    updated = await service_update("theme_generation_packages", {"id": f"eq.{package_id}"}, {
        "workflow_run_id": run["id"],
        "metadata": {**metadata, "workflow_id": workflow["id"], "workflow_version_id": version["id"]},
    })
    return {
        "package": updated[0] if updated else {**package, "workflow_run_id": run["id"]},
        "workflow": workflow,
        "version": version,
        "run": run,
        "steps": run_steps,
    }


async def sync_theme_workflow_run(package: dict[str, Any], items: list[dict[str, Any]], package_status: str) -> None:
    run_id = package.get("workflow_run_id")
    if not run_id:
        return
    terminal = package_status in {"succeeded", "partial", "failed", "cancelled"}
    for item in items:
        metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else {}
        run_step_id = metadata.get("workflow_run_step_id")
        if not run_step_id:
            continue
        status = item.get("status")
        run_step_status = {
            "queued": "pending",
            "submitting": "running",
            "running": "running",
            "success": "completed",
            "failed": "failed",
            "cancelled": "cancelled",
        }.get(str(status), "pending")
        await service_update("workflow_run_steps", {"id": f"eq.{run_step_id}"}, {
            "status": run_step_status,
            "result": {"asset_key": item.get("asset_key"), "theme_asset_id": item.get("theme_asset_id"), "storage_path": item.get("storage_path"), "provider_task_id": item.get("provider_task_id")},
            "error_code": item.get("error_code"),
            "error_message": item.get("error_message"),
        })
    run_status = "completed" if package_status in {"succeeded", "partial"} else ("failed" if package_status == "failed" else "cancelled")
    from datetime import datetime, timezone
    patch: dict[str, Any] = {"status": run_status, "output": {"package_id": package["id"], "package_status": package_status, "successful_assets": sum(1 for item in items if item.get("status") == "success"), "failed_assets": sum(1 for item in items if item.get("status") == "failed")}}
    if terminal:
        patch["completed_at"] = datetime.now(timezone.utc).isoformat()
    await service_update("workflow_runs", {"id": f"eq.{run_id}"}, patch)
    await service_insert("workflow_events", {
        "workflow_run_id": run_id,
        "event_type": "theme_package.status_changed",
        "to_status": run_status,
        "metadata": {"package_id": package["id"], "package_status": package_status, "asset_count": len(items)},
    }, returning=False)
