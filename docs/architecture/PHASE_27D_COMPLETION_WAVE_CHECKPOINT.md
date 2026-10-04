# Phase 27D — Super Admin Governance Actions, Detail Views & Cross-Domain Operational Workflows

Status: IMPLEMENTATION COMPLETE / RUNTIME QA PENDING

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

## Governance / trust increment
- Activated Security Control Plane from the existing authoritative overview RPC.
- Upgraded Audit Logs into a read-only evidence explorer with filtering and record drill-down.
- Activated Approval Queue against the canonical `approvals` resource in `get_admin_domain_records`; decision authority remains in the existing approval/runtime boundary.
- Activated Risk Assessments against the canonical `risk` resource; no synthetic risk records.
- Corrected content moderation decision authorization from `admin.read` to `admin.manage`.
- Verified canonical moderation/approval/audit/payout RPCs remain SECURITY INVOKER with authenticated/service_role ACLs where inspected.
- No moderation cases, approval requests, risk assessments or audit fixtures were created.

## Cross-domain operational increment
The existing generic admin domain-record RPC already exposes canonical resources for:
- users
- agents
- content
- moderation
- galaxies
- worlds
- districts
- zones
- booths
- themes
- theme_versions
- marketplace_listings
- marketplace_offers
- billing_plans
- credit_products
- subscriptions
- invoices
- payouts
- approvals
- risk
- feature_flags
- config_versions

Activated Admin UI explorers now consume that canonical boundary for:
- Marketplace
- Worlds
- Districts
- Booths
- Credits
- Risk
- Approvals

The explorers provide authoritative search/status filtering, pagination-ready resource loading and empty-state handling without creating fixtures or bypassing FastAPI/RLS.

## Canonical boundaries preserved
Users:
Web/Admin → FastAPI → Supabase/RLS

Payout:
Payout Request → Approval/Permission → Governed Domain Operation → existing payout engine

Governance:
Admin UI → FastAPI permission boundary → canonical RPC → existing domain/audit/risk/approval engine

Provider secrets remain server-side and no bank-transfer provider is fabricated.

## Verification state
- `get_admin_domain_records` is a canonical public SECURITY INVOKER RPC; the underlying private implementation remains the existing governed SECURITY DEFINER boundary with platform permission checks.
- `get_admin_agent_authority_overview`, `get_admin_audit_logs`, `get_admin_control_plane_overview`, `get_admin_domain_records` and `get_admin_payout_requests` were inspected against their live definitions.
- The public `get_admin_domain_records` ACL is authenticated + service_role; anonymous execution is not granted.
- Live business data remains authoritative and empty where no real business activity exists.
- Runtime/browser E2E, build/CI and production Green remain deferred.

## Completion wave result
### Cross-domain transaction governance
- Added canonical `get_admin_transaction_governance_context(uuid)` RPC.
- The RPC links an order to approval requests, risk assessments, payout requests via approval binding, and related audit evidence.
- The RPC is SECURITY INVOKER publicly with authenticated + service_role ACL; its private implementation remains SECURITY DEFINER and checks the existing `admin_27c_require_read` boundary.
- Transaction Explorer now loads this governed context when opening an order drill-down.
- Payment, billing, economy and payout engines were not duplicated or rewritten.

### Super Admin reconciliation
- Activated canonical Admin explorers for Marketplace, Worlds, Districts, Booths, Credits, Galaxies, Plans, Pricing, Configuration Versions, Risk and Approvals.
- Reconciled legacy placeholder routes (Communities, Events, Missions, Notifications, Observability, Agent Policies, AI Policies, AI Providers, Entitlements, Features, Reports, Revenue, System Settings, Universe, Localization and E2E/QA) into authoritative coverage/control-plane surfaces.
- Unsupported legacy domains are explicitly read-only coverage surfaces rather than fabricated CRUD. This preserves architectural authority and prevents duplicate engines.
- No synthetic business records were created.

### Final implementation boundary
27D implementation is complete at source/schema/control-plane level.

Still intentionally deferred:
- authenticated browser runtime E2E
- API/PWA/Admin production builds
- real Midtrans/provider credential E2E
- production deployment and Railway/Vercel verification
- final production security hardening findings

These are runtime/production gates, not missing 27D architecture or Admin control-plane implementation.
