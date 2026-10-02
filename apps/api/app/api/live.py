from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.dependencies import get_auth_context
from app.core.supabase_rest import select

router = APIRouter(prefix="/api/v1/live", tags=["Live Stories & Streaming"])

Source = Literal["creator", "platform"]

@router.get("/templates")
async def live_templates(
    category: str | None = None,
    source: Source | None = None,
    limit: int = Query(100, ge=1, le=100),
    context: dict = Depends(get_auth_context),
):
    q = {"select": "*", "order": "catalog_order.asc.nullslast,updated_at.desc", "limit": str(limit)}
    q["status"] = "eq.published"
    if category:
        q["category"] = f"eq.{category}"
    if source:
        q["source"] = f"eq.{source}"
    return {"data": await select(context["user"], "live_experience_templates", q)}

@router.get("/templates/{template_id}/versions")
async def live_template_versions(
    template_id: UUID,
    context: dict = Depends(get_auth_context),
):
    rows = await select(
        context["user"],
        "live_experience_template_versions",
        {
            "select": "*",
            "template_id": f"eq.{template_id}",
            "status": "eq.published",
            "moderation_status": "eq.approved",
            "order": "version.desc",
        },
    )
    if not rows:
        raise HTTPException(status_code=404, detail={"code": "LIVE_TEMPLATE_NOT_FOUND"})
    return {"data": rows}
