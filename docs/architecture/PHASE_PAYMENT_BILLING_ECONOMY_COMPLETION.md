# Payment, Billing & Economy Completion

Status: IMPLEMENTED COMPLETE / RUNTIME QA PENDING

## Canonical flow

Marketplace / Credit Purchase / Subscription
→ Commerce Order
→ Commerce Payment
→ Midtrans
→ Verified Settlement
→ Canonical Domain State

Settlement activates the appropriate downstream state:
- commerce order paid
- credit purchase paid + AI credit ledger grant
- subscription active + invoice paid + included credit grant
- marketplace entitlement activation
- cancellation/expiry reconciliation for pending payment

## Completed implementation

- Centralized payment boundary remains apps/api/app/api/economy.py.
- Credit purchase checkout uses create_credit_purchase_order + canonical payment intent + Midtrans Snap.
- Subscription checkout uses create_subscription_order + canonical payment intent + Midtrans Snap.
- Marketplace checkout uses the same payment boundary.
- Midtrans notification verifies SHA-512 signature before settlement.
- Settlement is idempotent through economy_settlement_events.
- Settlement validates gross amount and currency against the canonical payment.
- Credit grants use ai_credit_ledger.
- Subscription settlement updates subscription/invoice state and grants included credits once.
- Marketplace entitlements are created idempotently.
- Billing UI now renders published plans, current subscriptions, cancellation state and invoices.
- Subscription lifecycle now supports user-owned cancellation.
- Payment Result surface resolves provider status from the authenticated payment boundary.
- Admin Billing is no longer a placeholder and routes operational work through the canonical Control Plane.
- Payout remains behind existing payout review/process permissions and canonical payout RPCs.
- No duplicate payment, billing, credit ledger or payout engine was introduced.
- No business fixtures were created.

## Database change

Migration: phase_payment_billing_economy_subscription_lifecycle

Function: public.cancel_my_subscription(uuid)

Security:
- SECURITY INVOKER
- anon EXECUTE revoked
- authenticated EXECUTE granted
- ownership enforced by auth.uid()

## Runtime boundary

Still intentionally deferred:
- Midtrans sandbox/production credential execution
- Real checkout settlement
- Provider webhook E2E
- Real subscription lifecycle with provider
- Refund/chargeback provider E2E
- Browser authenticated E2E
- final CI/production gates
- Railway/Vercel deployment

Empty business tables remain valid and untouched.