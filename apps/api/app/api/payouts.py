from __future__ import annotations
from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context, require_permission
from app.core.supabase_rest import SupabaseRestError, rpc
router = APIRouter(tags=["Payouts & Governance"])
class PayoutAccountRequest(BaseModel):
    bank_code:str=Field(min_length=2,max_length=32); bank_name:str=Field(min_length=2,max_length=120)
    account_name:str=Field(min_length=2,max_length=160); account_number:str=Field(min_length=4,max_length=64)
class PayoutRequest(BaseModel):
    amount:int=Field(gt=0); currency:str=Field(default="IDR",pattern="^IDR$")
class PayoutDecision(BaseModel):
    decision:str=Field(pattern="^(approved|rejected)$"); reason:str|None=Field(default=None,max_length=1000)
class PayoutProcessing(BaseModel):
    outcome:str=Field(pattern="^(processing|paid|failed)$"); disbursement_reference:str|None=Field(default=None,max_length=255); reason:str|None=Field(default=None,max_length=1000)
def _err(exc:SupabaseRestError,code:str)->HTTPException:
    return HTTPException(status_code=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500,detail={"code":code,"message":exc.message})
@router.get("/api/v1/payouts/summary")
async def payout_summary(context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"get_my_payout_summary",{})
    except SupabaseRestError as exc:raise _err(exc,"PAYOUT_SUMMARY_FAILED") from exc
@router.post("/api/v1/payouts/account",status_code=201)
async def save_payout_account(payload:PayoutAccountRequest,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"upsert_my_payout_account",payload.model_dump())
    except SupabaseRestError as exc:raise _err(exc,"PAYOUT_ACCOUNT_SAVE_FAILED") from exc
@router.post("/api/v1/payouts/request",status_code=201)
async def request_payout(payload:PayoutRequest,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"request_payout",{"p_amount":payload.amount,"p_currency":payload.currency})
    except SupabaseRestError as exc:raise _err(exc,"PAYOUT_REQUEST_FAILED") from exc
@router.get("/api/v1/payouts/admin/requests")
async def admin_payout_requests(status:str|None=None,limit:int=100,context:dict=Depends(require_permission("payout.read")))->Any:
    try:return await rpc(context["user"],"get_admin_payout_requests",{"p_status":status,"p_limit":limit})
    except SupabaseRestError as exc:raise _err(exc,"PAYOUT_ADMIN_LIST_FAILED") from exc
@router.post("/api/v1/payouts/admin/{payout_id}/decision")
async def admin_payout_decision(payout_id:UUID,payload:PayoutDecision,context:dict=Depends(require_permission("payout.review")))->Any:
    try:return await rpc(context["user"],"decide_payout_request",{"p_payout_request_id":str(payout_id),"p_decision":payload.decision,"p_reason":payload.reason})
    except SupabaseRestError as exc:raise _err(exc,"PAYOUT_DECISION_FAILED") from exc
@router.post("/api/v1/payouts/admin/{payout_id}/process")
async def admin_payout_process(payout_id:UUID,payload:PayoutProcessing,context:dict=Depends(require_permission("payout.process")))->Any:
    try:return await rpc(context["user"],"process_payout_request",{"p_payout_request_id":str(payout_id),"p_outcome":payload.outcome,"p_disbursement_reference":payload.disbursement_reference,"p_reason":payload.reason})
    except SupabaseRestError as exc:raise _err(exc,"PAYOUT_PROCESS_FAILED") from exc
