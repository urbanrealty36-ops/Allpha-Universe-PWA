from __future__ import annotations

import base64
import hashlib
import hmac
from decimal import Decimal
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.config import get_settings
from app.core.supabase_rest import (
    SupabaseRestError,
    rpc,
    select,
    service_rpc,
    service_select,
    service_update,
)

router = APIRouter(tags=["Economy, Credits & Billing"])

class CheckoutRequest(BaseModel):
    idempotency_key: str | None = Field(default=None, max_length=255)

def _midtrans_base(environment: str) -> str:
    return "https://app.midtrans.com" if environment.lower() == "production" else "https://app.sandbox.midtrans.com"

def _midtrans_api_base(environment: str) -> str:
    return "https://api.midtrans.com" if environment.lower() == "production" else "https://api.sandbox.midtrans.com"

def _auth_header(server_key: str) -> str:
    encoded = base64.b64encode(f"{server_key}:".encode()).decode()
    return f"Basic {encoded}"

async def _create_snap(payment_id: str, amount: int, currency: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    settings = get_settings()
    if not settings.midtrans_server_key:
        raise HTTPException(status_code=503, detail={"code": "MIDTRANS_NOT_CONFIGURED", "message": "Midtrans Server Key is not configured."})
    if currency != "IDR":
        raise HTTPException(status_code=422, detail={"code": "MIDTRANS_CURRENCY_UNSUPPORTED", "message": "Allpha Midtrans checkout currently requires IDR."})

    order_id = f"ALP-{payment_id.replace('-', '')}"
    payload: dict[str, Any] = {
        "transaction_details": {"order_id": order_id, "gross_amount": amount},
        "credit_card": {"secure": True},
        "callbacks": {
            "finish": f"{settings.allpha_public_web_url}/payment/result?order_id={order_id}",
        },
    }
    if items:
        payload["item_details"] = items

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{_midtrans_base(settings.midtrans_environment)}/snap/v1/transactions",
            json=payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": _auth_header(settings.midtrans_server_key),
            },
        )

    if response.status_code != 201:
        detail = response.json() if response.content else {}
        raise HTTPException(
            status_code=502,
            detail={"code": "MIDTRANS_SNAP_CREATE_FAILED", "message": "Midtrans rejected the checkout request.", "provider": detail},
        )
    result = response.json()
    if not result.get("token") or not result.get("redirect_url"):
        raise HTTPException(status_code=502, detail={"code": "MIDTRANS_SNAP_INVALID_RESPONSE", "message": "Midtrans returned no checkout token or redirect URL."})
    return {"order_id": order_id, **result}

async def _checkout_for_order(user, order_id: UUID, idempotency_key: str | None) -> dict[str, Any]:
    try:
        payment = await rpc(
            user,
            "create_commerce_payment_intent",
            {
                "p_order_id": str(order_id),
                "p_provider_key": "midtrans",
                "p_idempotency_key": idempotency_key,
            },
        )
        if not isinstance(payment, dict) or not payment.get("id"):
            raise HTTPException(status_code=502, detail={"code": "PAYMENT_INTENT_INVALID", "message": "Payment intent could not be created."})

        payment_id = str(payment["id"])
        rows = await select(
            user,
            "commerce_orders",
            {
                "select": "id,total_amount,currency,order_kind",
                "id": f"eq.{order_id}",
                "limit": "1",
            },
        )
        if not rows:
            raise HTTPException(status_code=404, detail={"code": "ORDER_NOT_FOUND", "message": "Order not found."})
        order = rows[0]

        item_rows = await select(
            user,
            "commerce_order_items",
            {
                "select": "title_snapshot,quantity,unit_amount,total_amount,currency",
                "order_id": f"eq.{order_id}",
                "limit": "100",
            },
        )
        items = [
            {
                "id": str(index + 1),
                "price": int(item["unit_amount"]),
                "quantity": int(item["quantity"]),
                "name": str(item["title_snapshot"])[:50],
            }
            for index, item in enumerate(item_rows)
        ]

        existing = await select(
            user,
            "commerce_payments",
            {
                "select": "id,external_reference,checkout_url,provider_payload,status",
                "id": f"eq.{payment_id}",
                "limit": "1",
            },
        )
        if existing and existing[0].get("checkout_url") and existing[0].get("external_reference"):
            return {"payment_id": payment_id, "order_id": order_id, "redirect_url": existing[0]["checkout_url"], "status": existing[0]["status"]}

        snap = await _create_snap(payment_id, int(order["total_amount"]), str(order["currency"]), items)
        await service_update(
            "commerce_payments",
            {"id": f"eq.{payment_id}"},
            {
                "external_reference": snap["order_id"],
                "checkout_url": snap["redirect_url"],
                "provider_payload": {"provider": "midtrans", "snap_token": snap["token"], "snap_order_id": snap["order_id"]},
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        return {"payment_id": payment_id, "order_id": order_id, "redirect_url": snap["redirect_url"], "token": snap["token"], "status": "pending_provider"}
    except SupabaseRestError as exc:
        raise HTTPException(status_code=exc.status_code if exc.status_code in {400, 401, 403, 404, 409, 422} else 500, detail={"code": "PAYMENT_CHECKOUT_FAILED", "message": exc.message}) from exc

@router.get("/api/v1/economy/summary")
async def economy_summary(context: dict = Depends(get_auth_context)) -> Any:
    try:
        return await rpc(context["user"], "get_my_economy_summary", {})
    except SupabaseRestError as exc:
        raise HTTPException(status_code=500, detail={"code": "ECONOMY_SUMMARY_FAILED", "message": exc.message}) from exc

@router.get("/api/v1/economy/credit-products")
async def credit_products(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    rows = await select(context["user"], "economy_credit_products", {"select": "id,product_key,name,description,credits,price_amount,currency,status", "status": "eq.published", "order": "created_at.desc", "limit": "100"})
    return {"data": rows}

@router.post("/api/v1/economy/credit-products/{product_id}/purchase", status_code=201)
async def purchase_credits(product_id: UUID, payload: CheckoutRequest, context: dict = Depends(get_auth_context)) -> Any:
    try:
        order = await rpc(context["user"], "create_credit_purchase_order", {"p_credit_product_id": str(product_id), "p_idempotency_key": payload.idempotency_key})
        return await _checkout_for_order(context["user"], UUID(str(order["id"])), payload.idempotency_key)
    except SupabaseRestError as exc:
        raise HTTPException(status_code=exc.status_code if exc.status_code in {400, 401, 403, 404, 409, 422} else 500, detail={"code": "CREDIT_PURCHASE_FAILED", "message": exc.message}) from exc

@router.get("/api/v1/billing/plans")
async def billing_plans(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    rows = await select(context["user"], "billing_plans", {"select": "id,plan_key,name,description,interval_unit,interval_count,price_amount,currency,included_credits,status", "status": "eq.published", "order": "created_at.desc", "limit": "100"})
    return {"data": rows}

@router.post("/api/v1/billing/plans/{plan_id}/subscribe", status_code=201)
async def subscribe(plan_id: UUID, payload: CheckoutRequest, context: dict = Depends(get_auth_context)) -> Any:
    try:
        order = await rpc(context["user"], "create_subscription_order", {"p_plan_id": str(plan_id), "p_idempotency_key": payload.idempotency_key})
        return await _checkout_for_order(context["user"], UUID(str(order["id"])), payload.idempotency_key)
    except SupabaseRestError as exc:
        raise HTTPException(status_code=exc.status_code if exc.status_code in {400, 401, 403, 404, 409, 422} else 500, detail={"code": "SUBSCRIPTION_CHECKOUT_FAILED", "message": exc.message}) from exc

@router.post("/api/v1/marketplace/orders/{order_id}/checkout", status_code=201)
async def marketplace_checkout(order_id: UUID, payload: CheckoutRequest, context: dict = Depends(get_auth_context)) -> Any:
    return await _checkout_for_order(context["user"], order_id, payload.idempotency_key)

@router.get("/api/v1/billing/subscriptions")
async def my_subscriptions(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    rows = await select(context["user"], "billing_subscriptions", {"select": "id,plan_id,status,current_period_start,current_period_end,cancel_at_period_end,created_at", "user_id": f"eq.{context['user'].id}", "order": "created_at.desc", "limit": "50"})
    return {"data": rows}

@router.get("/api/v1/billing/invoices")
async def my_invoices(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    rows = await select(context["user"], "billing_invoices", {"select": "id,invoice_number,subscription_id,order_id,status,amount,currency,period_start,period_end,due_at,paid_at,created_at", "user_id": f"eq.{context['user'].id}", "order": "created_at.desc", "limit": "100"})
    return {"data": rows}

@router.post("/api/v1/payments/midtrans/notification")
async def midtrans_notification(request: Request) -> dict[str, str]:
    settings = get_settings()
    if not settings.midtrans_server_key:
        raise HTTPException(status_code=503, detail={"code": "MIDTRANS_NOT_CONFIGURED", "message": "Midtrans Server Key is not configured."})
    payload = await request.json()
    order_id = str(payload.get("order_id", ""))
    status_code = str(payload.get("status_code", ""))
    gross_amount = str(payload.get("gross_amount", ""))
    signature = str(payload.get("signature_key", ""))
    expected = hashlib.sha512(f"{order_id}{status_code}{gross_amount}{settings.midtrans_server_key}".encode()).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail={"code": "MIDTRANS_INVALID_SIGNATURE", "message": "Invalid Midtrans notification signature."})
    try:
        payments = await service_select("commerce_payments", {"select": "id,amount,currency", "provider_key": "eq.midtrans", "external_reference": f"eq.{order_id}", "limit": "1"})
        if not payments:
            raise HTTPException(status_code=404, detail={"code": "MIDTRANS_PAYMENT_NOT_FOUND", "message": "No Allpha payment matches this Midtrans order."})
        amount = int(Decimal(gross_amount))
        result = await service_rpc(
            "process_midtrans_settlement",
            {
                "p_payment_id": payments[0]["id"],
                "p_transaction_status": payload.get("transaction_status"),
                "p_transaction_id": payload.get("transaction_id"),
                "p_gross_amount": amount,
                "p_currency": payload.get("currency") or payments[0]["currency"],
                "p_provider_payload": payload,
            },
        )
        return {"status": "ok", "result": str(result)}
    except SupabaseRestError as exc:
        raise HTTPException(status_code=500, detail={"code": "MIDTRANS_SETTLEMENT_FAILED", "message": exc.message}) from exc

@router.get("/api/v1/payments/midtrans/status/{order_id}")
async def midtrans_status(order_id: str, context: dict = Depends(get_auth_context)) -> Any:
    settings = get_settings()
    if not settings.midtrans_server_key:
        raise HTTPException(status_code=503, detail={"code": "MIDTRANS_NOT_CONFIGURED", "message": "Midtrans Server Key is not configured."})
    payments = await select(context["user"], "commerce_payments", {"select": "id,order_id,external_reference,status,provider_status,provider_transaction_id,amount,currency,checkout_url,paid_at", "external_reference": f"eq.{order_id}", "limit": "1"})
    if not payments:
        raise HTTPException(status_code=404, detail={"code": "PAYMENT_NOT_FOUND", "message": "Payment not found."})
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"{_midtrans_api_base(settings.midtrans_environment)}/v2/{order_id}/status",
            headers={"Accept": "application/json", "Authorization": _auth_header(settings.midtrans_server_key)},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail={"code": "MIDTRANS_STATUS_FAILED", "message": "Midtrans status lookup failed."})
    return response.json()
