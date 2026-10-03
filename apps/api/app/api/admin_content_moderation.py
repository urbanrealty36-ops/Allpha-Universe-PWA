from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.dependencies import require_permission
from app.core.supabase_rest import SupabaseRestError, rpc

router = APIRouter(prefix="/api/v1/admin/content-moderation", tags=["Admin Content Moderation"])

class Decision(BaseModel):
    decision: str
    notes: str | None = Field(default=None, max_length=2000)

@router.get("/queue")
async def queue(limit:int=Query(default=100,ge=1,le=200),context:dict[str,Any]=Depends(require_permission("admin.read")))->dict[str,Any]:
    try:
        return {"data":await rpc(context["user"],"get_admin_content_moderation_queue",{"p_limit":limit})}
    except SupabaseRestError as exc:
        raise HTTPException(status_code=403 if exc.status_code==403 else 502,detail={"code":"CONTENT_MODERATION_QUEUE_FAILED","message":exc.message}) from exc

@router.post("/{case_id}/decision")
async def decide(case_id:str,payload:Decision,context:dict[str,Any]=Depends(require_permission("admin.read")))->dict[str,Any]:
    try:
        return {"data":await rpc(context["user"],"decide_content_moderation",{"p_case_id":case_id,"p_decision":payload.decision,"p_notes":payload.notes})}
    except SupabaseRestError as exc:
        raise HTTPException(status_code=403 if exc.status_code==403 else 502,detail={"code":"CONTENT_MODERATION_DECISION_FAILED","message":exc.message}) from exc
