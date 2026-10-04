# Phase 27D — Super Admin Governance Actions, Detail Views & Cross-Domain Operational Workflows

Status: IN PROGRESS / IMPLEMENTED INCREMENTS

## Scope
Phase 27D continues the canonical Phase 27 Control Plane after Phase 27C. It does not replace the existing Control Plane, payment/economy, payout, authorization, audit, risk or domain engines.

## Completed increment
- Added authenticated GET /api/v1/admin/control-plane/payouts backed by the canonical get_admin_payout_requests RPC.
- Added Super Admin /payouts read-only payout queue and evidence/detail surface.
- Payout decisions and processing remain delegated to the existing governed /operations domain-operation boundary.
- Activated Super Admin /users over the existing get_admin_domain_records boundary with search, status filtering and authoritative record detail.
- Updated Control Plane navigation to expose Payouts.
- Updated Control Plane shell label to Phase 27D.
- No business fixtures, payout records, users, transactions or provider responses were fabricated.
- No second payout, commerce, billing, authorization or audit engine was introduced.

## Canonical boundaries preserved
Users:
Web/Admin → FastAPI → Supabase/RLS

Payout:
Payout Request → Approval/Permission → Governed Domain Operation → existing payout engine

Provider secrets remain server-side and no bank-transfer provider is fabricated.

## Verification state
- get_admin_payout_requests exists as canonical SECURITY INVOKER RPC.
- RPC ACL: authenticated + service_role; no anonymous execution.
- Existing payout business data remains empty.
- Existing user business data remains authoritative; no synthetic users were created.
- Runtime/browser E2E, build/CI and production Green remain deferred.

## Remaining 27D completion candidates
- Governance detail surfaces for audit/security/risk.
- Cross-domain operational detail views beyond Users/Payouts.
- Approval/Risk/Moderation workflow visibility and evidence drill-down.
- Reconciliation of remaining Super Admin placeholders against existing canonical RPCs.
- Full API/PWA/Admin build and authenticated browser E2E at the final runtime gate.