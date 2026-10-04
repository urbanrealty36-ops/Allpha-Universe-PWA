from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from app.api.dependencies import get_auth_context, require_owned_order
from app.core.supabase_rest import SupabaseRestError, rpc, select

router=APIRouter(prefix="/api/v1/marketplace",tags=["Marketplace & Commerce"])

class ListingCreate(BaseModel):
    listing_type:str=Field(pattern="^(product|service)$")
    seller_type:str=Field(pattern="^(human|agent|organization|booth)$")
    seller_id:UUID
    agent_id:UUID|None=None
    booth_id:UUID|None=None
    title:str=Field(min_length=1,max_length=200)
    slug:str=Field(min_length=1,max_length=120)
    description:str|None=None
    skill_name:str|None=None
    capability_requirements:list[str]=Field(default_factory=list,max_length=32)
    price_amount:int=Field(ge=0)
    currency:str=Field(default="IDR",min_length=3,max_length=8)
    price_unit:str=Field(default="one_time",max_length=40)
    inventory_quantity:int|None=Field(default=None,ge=0)
    metadata:dict[str,Any]=Field(default_factory=dict)

class OfferCreate(BaseModel):
    amount:int=Field(ge=0)
    message:str|None=None
    expires_at:str|None=None
class OfferDecision(BaseModel):
    decision:str=Field(pattern="^(accepted|rejected|cancelled)$")
class OrderCreate(BaseModel):
    listing_id:UUID
    quantity:int=Field(ge=1,le=1000)
    source_type:str|None=Field(default=None,pattern="^(marketplace|booth|live)$")
    source_id:UUID|None=None
    idempotency_key:str|None=Field(default=None,max_length=255)
class PaymentIntentCreate(BaseModel):
    provider_key:str=Field(min_length=1,max_length=100)
    idempotency_key:str|None=Field(default=None,max_length=255)

def err(exc:SupabaseRestError,code:str):
    status=exc.status_code if exc.status_code in {400,401,403,404,409,422} else 500
    return HTTPException(status_code=status,detail={"code":code,"message":exc.message})

@router.get("/listings")
async def listings(q:str|None=None,listing_type:str|None=None,skill_name:str|None=None,booth_id:UUID|None=None,limit:int=Query(50,ge=1,le=100),context:dict=Depends(get_auth_context))->dict[str,Any]:
    try:
        rows=await rpc(context["user"],"list_marketplace_listings",{"p_q":q,"p_listing_type":listing_type,"p_skill_name":skill_name,"p_booth_id":str(booth_id) if booth_id else None,"p_limit":limit})
        return {"data":rows if isinstance(rows,list) else rows.get("data",rows)}
    except SupabaseRestError as exc: raise err(exc,"MARKETPLACE_LIST_FAILED") from exc

@router.post("/listings",status_code=201)
async def create_listing(payload:ListingCreate,context:dict=Depends(get_auth_context))->Any:
    try:
        return await rpc(context["user"],"create_marketplace_listing",{"p_listing_type":payload.listing_type,"p_seller_type":payload.seller_type,"p_seller_id":str(payload.seller_id),"p_agent_id":str(payload.agent_id) if payload.agent_id else None,"p_booth_id":str(payload.booth_id) if payload.booth_id else None,"p_title":payload.title,"p_slug":payload.slug,"p_description":payload.description,"p_skill_name":payload.skill_name,"p_capability_requirements":payload.capability_requirements,"p_price_amount":payload.price_amount,"p_currency":payload.currency.upper(),"p_price_unit":payload.price_unit,"p_inventory_quantity":payload.inventory_quantity,"p_metadata":payload.metadata})
    except SupabaseRestError as exc: raise err(exc,"MARKETPLACE_LISTING_CREATE_FAILED") from exc

@router.post("/listings/{listing_id}/publish")
async def publish_listing(listing_id:UUID,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"publish_marketplace_listing",{"p_listing_id":str(listing_id)})
    except SupabaseRestError as exc: raise err(exc,"MARKETPLACE_LISTING_PUBLISH_FAILED") from exc

@router.post("/listings/{listing_id}/offers",status_code=201)
async def create_offer(listing_id:UUID,payload:OfferCreate,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"create_marketplace_offer",{"p_listing_id":str(listing_id),"p_amount":payload.amount,"p_message":payload.message,"p_expires_at":payload.expires_at})
    except SupabaseRestError as exc: raise err(exc,"MARKETPLACE_OFFER_FAILED") from exc

@router.post("/offers/{offer_id}/decision")
async def decide_offer(offer_id:UUID,payload:OfferDecision,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"respond_marketplace_offer",{"p_offer_id":str(offer_id),"p_decision":payload.decision})
    except SupabaseRestError as exc: raise err(exc,"MARKETPLACE_OFFER_DECISION_FAILED") from exc

@router.get("/orders")
async def orders(limit:int=Query(50,ge=1,le=100),context:dict=Depends(get_auth_context))->dict[str,Any]:
    try:
        rows=await rpc(context["user"],"get_my_commerce_orders",{"p_limit":limit})
        return {"data":rows if isinstance(rows,list) else rows.get("data",rows)}
    except SupabaseRestError as exc: raise err(exc,"COMMERCE_ORDERS_FAILED") from exc

@router.post("/orders",status_code=201)
async def create_order(payload:OrderCreate,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"create_commerce_order",{"p_listing_id":str(payload.listing_id),"p_quantity":payload.quantity,"p_source_type":payload.source_type,"p_source_id":str(payload.source_id) if payload.source_id else None,"p_idempotency_key":payload.idempotency_key})
    except SupabaseRestError as exc: raise err(exc,"COMMERCE_ORDER_CREATE_FAILED") from exc

@router.post("/orders/{order_id}/payment-intent",status_code=201)
async def create_payment_intent(order_id:UUID,payload:PaymentIntentCreate,context:dict=Depends(get_auth_context))->Any:
    try:return await rpc(context["user"],"create_commerce_payment_intent",{"p_order_id":str(order_id),"p_provider_key":payload.provider_key,"p_idempotency_key":payload.idempotency_key})
    except SupabaseRestError as exc: raise err(exc,"COMMERCE_PAYMENT_INTENT_FAILED") from exc

@router.get("/orders/{order_id}/items")
async def order_items(order_id:UUID,context:dict=Depends(get_auth_context))->dict[str,Any]:
    await require_owned_order(context, order_id)
    return {"data":await select(context["user"],"commerce_order_items",{"select":"id,listing_id,title_snapshot,listing_type,quantity,unit_amount,total_amount,currency,agent_id,booth_id","order_id":f"eq.{order_id}","limit":"100"})}

@router.get("/orders/{order_id}/payments")
async def order_payments(order_id:UUID,context:dict=Depends(get_auth_context))->dict[str,Any]:
    await require_owned_order(context, order_id)
    return {"data":await select(context["user"],"commerce_payments",{"select":"id,provider_key,status,amount,currency,external_reference,checkout_url,created_at,captured_at","order_id":f"eq.{order_id}","order":"created_at.desc","limit":"20"})}
