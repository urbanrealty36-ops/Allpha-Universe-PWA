# PHASE 26 — SECURITY, GOVERNANCE & TRUST + SELLER PAYOUTS
## Status
IMPLEMENTED FOUNDATION / REAL MONEY-MOVEMENT E2E PENDING

## Canonical boundary
Marketplace Commerce → Midtrans Payment → settled seller earnings → Payout Request → Risk Assessment → Approval Request → Super Admin Review → Disbursement Record → Audit Ledger.

No second wallet, payment gateway, commerce engine, risk engine, approval engine or audit engine is introduced.

## Payout model
Seller earnings are derived only from Marketplace order items whose parent Commerce Order is paid/completed and has a captured Commerce Payment. A payout request reserves its amount immediately, preventing overlapping requests from consuming the same available balance.

Seller flow:
1. Save active payout bank account.
2. Read earned/reserved/available balance.
3. Request IDR payout.
4. Server creates a high-risk risk assessment and existing approval request.
5. Super Admin reviews.
6. Approved request can move to processing and then paid.
7. Paid state requires an operator disbursement reference.
8. Failed/rejected requests release the reservation.

The current implementation records the disbursement workflow; it does not fabricate an automatic bank-transfer provider. Actual bank transfer remains an operational Super Admin step until a future disbursement provider is explicitly selected and integrated.

## Security
- Seller RLS is owner-scoped for payout accounts, requests and events.
- Admin reads/reviews/processes are permission-gated through existing `private.has_platform_permission`.
- Money movement is always high risk and approval-gated.
- Audit records are written for account changes, requests, decisions and processing.
- Bank account data is never exposed to other sellers.
- No payout/payment/commerce business rows are seeded.

## API
Seller:
- GET `/api/v1/payouts/summary`
- POST `/api/v1/payouts/account`
- POST `/api/v1/payouts/request`

Super Admin:
- GET `/api/v1/payouts/admin/requests`
- POST `/api/v1/payouts/admin/{payout_id}/decision`
- POST `/api/v1/payouts/admin/{payout_id}/process`

## Database
- `payout_accounts`
- `payout_requests`
- `payout_events`
- Existing `risk_assessments`, `approval_requests`, `audit_logs`, `commerce_orders`, `commerce_order_items`, `commerce_payments` remain authoritative.

## E2E gate
Still pending:
- authenticated seller with a real captured Marketplace transaction
- real payout request
- Super Admin approval
- real bank transfer
- recording a real disbursement reference
- failed/retry reconciliation
- production operational controls

No GREEN claim is made before those gates.
