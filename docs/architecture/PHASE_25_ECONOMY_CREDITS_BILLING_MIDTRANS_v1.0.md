# Phase 25 — Economy, Credits & Billing + Midtrans

## Canonical payment boundary

All commercial money movement in the Allpha Web App uses one provider boundary:

Allpha Web App → FastAPI → Commerce Payment → Midtrans Snap → Midtrans Notification → verified settlement → canonical domain state.

Marketplace Commerce is not permitted to bypass this boundary. Credit purchases and subscriptions use the same Commerce Order / Commerce Payment infrastructure.

## Existing engines reused

- ai_credit_ledger remains the authoritative AI credit ledger.
- commerce_orders, commerce_payments, and commerce_entitlements remain the canonical commerce boundary.
- Agent Service / Agent Runtime remains the service execution engine.
- Policy, Risk, Approval and Audit remain authoritative for privileged actions.

## Economy / Billing objects

- economy_credit_products
- economy_credit_purchases
- billing_plans
- billing_subscriptions
- billing_invoices
- economy_settlement_events

## Midtrans integration

FastAPI acquires a Snap token using the server-side Midtrans Server Key. The frontend receives the Midtrans redirect URL/token and never receives the Server Key. Midtrans documents the backend Snap transaction endpoint and returns a token plus redirect URL on successful creation. https://docs.midtrans.com/docs/snap-snap-integration-guide

The webhook endpoint verifies signature_key using SHA512(order_id + status_code + gross_amount + ServerKey). The notification handler is idempotent because provider notifications may be repeated. https://docs.midtrans.com/docs/https-notification-webhooks

The backend can also query Midtrans status by order ID using the Server Key. https://docs.midtrans.com/reference/get-transaction-status

## Settlement rules

A verified settlement or eligible capture updates the canonical payment and order state. The settlement path then:

- Marketplace → activates existing order entitlements.
- Credit purchase → posts one purchase entry into ai_credit_ledger.
- Subscription → marks subscription/invoice paid and grants included credits once for the initial subscription payment.

The frontend redirect is never authoritative for paid state.

## Secrets

Backend-only:
- MIDTRANS_SERVER_KEY
- SUPABASE_SERVICE_ROLE_KEY

Runtime configuration:
- MIDTRANS_ENVIRONMENT=sandbox|production
- ALLPHA_PUBLIC_WEB_URL

MIDTRANS_CLIENT_KEY is reserved for a future Snap.js popup flow; the current redirect integration does not require exposing it.

## No seed data

No credit package, plan, subscription, invoice, payment or settlement record is seeded. Empty/not-configured states are intentional until real admin configuration and real user/payment activity exist.

## Runtime gates

Phase 25 is implementation-complete at the domain boundary but not GREEN. Remaining gates are real Midtrans Sandbox configuration, authenticated Marketplace payment E2E, credit settlement E2E, subscription initial payment E2E, and verified expiry/deny/cancel/refund reconciliation. Recurring subscription renewal is provider/configuration dependent and is not simulated.
