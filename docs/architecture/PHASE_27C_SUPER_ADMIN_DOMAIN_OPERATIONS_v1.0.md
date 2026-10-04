# PHASE 27C — Super Admin Domain Operations, Transaction Explorer & Master Data Management

Status: IMPLEMENTED COMPLETE / RUNTIME QA PENDING

## Scope

Phase 27C extends the Phase 27A control plane and Phase 27B analytics/master-data read surfaces without creating a second admin engine.

Implemented:
- Transaction Explorer: paginated/searchable Commerce Orders; order kind/status filters; payment/provider filters; buyer summary; item count/value; provider transaction/reference fields; Midtrans provider status; drill-down; payment attempts; seller summaries; commerce event timeline; invoice/credit linkage; audit evidence.
- Domain Operations explorer: Users, Agents, Content, Moderation, Galaxies, Worlds, Districts, Zones, Booths, Marketplace Listings/Offers, Billing Plans, Credit Products, Subscriptions, Invoices, Payouts, Approval Requests, Risk Assessments, Feature Flags, Configuration Versions, Themes and Theme Versions.
- Controlled Domain Operations: moderation decisions, payout decisions/processing, marketplace listing publication, Theme publication/moderation. These delegate to canonical domain engines.
- Master Data Management: Billing Plans create/update/archive; Credit Products create/update/archive; platform World Template publish/archive. Feature Flags and Configuration Versions retain their existing canonical lifecycle. AI Provider/Model records remain read-only and credentials are excluded.
- Every mutation requires admin.manage, an explicit reason, server-side validation and audit logging.
- Read surfaces require admin.read.
- No direct browser DB access, service-role exposure, or fake business records were added.

## Canonical boundaries

FastAPI remains the application/API boundary. The Admin PWA calls /api/v1/admin/control-plane/*.
Supabase private functions are permission-gated and use fixed search_path=''.
Transaction/provider payloads are reduced to operationally safe fields; provider secret payloads are not exposed.
Master-data mutation is allowlisted; arbitrary table names, SQL, provider credentials and unrestricted JSON-to-column writes are rejected.
High-risk financial/moderation actions reuse the existing Policy/Permission/Risk/Approval/Commerce/Payout/Moderation engines.

## Database

Migration files:
- database/migrations/20261004120000_phase_27c_super_admin_domain_operations.sql
- database/migrations/20261004120000_phase_27c_super_admin_domain_operations.sql
- database/migrations/20261004120000_phase_27c_super_admin_domain_operations.sql
- database/migrations/20261004123000_phase_27c_master_data_history_rollback.sql

Canonical public API functions:
- get_admin_transaction_explorer
- get_admin_transaction_detail
- get_admin_domain_records
- mutate_admin_master_data
- execute_admin_domain_operation

## Admin surfaces
- /transactions
- /operations
- /master-data
- /overview now exposes the Phase 27C surfaces.

## Security
- Public/anonymous EXECUTE revoked for Phase 27C public wrappers.
- Authenticated EXECUTE is required.
- admin.read / admin.manage are checked inside server-authoritative private functions.
- Mutations require an explicit reason.
- Domain resource identifiers are allowlisted; caller-supplied identifiers are never interpolated into SQL.
- World Template management is restricted to platform catalog records.
- Existing Theme/Marketplace/Moderation/Payout engines remain authoritative.
- Provider secret fields are not returned by Transaction Explorer.

## Completion
- FastAPI now mounts the canonical `admin_control_plane_router`; Admin PWA requests `/api/v1/admin/control-plane/*` reach the existing permission-gated control plane.
- Admin PWA now has a unified Control Plane shell and navigation for Overview, Analytics, Transactions, Operations, Master Data and governance surfaces.
- Admin home resolves to the Control Plane Overview instead of bypassing the 27C surface.
- Transaction Explorer exposes search, order/payment/provider filters, date range, pagination and structured drill-down for order, buyer, payments, sellers/items, invoice, credit purchase, commerce events and audit evidence.
- Domain Operations exposes the complete documented read explorer and the canonical governed actions: content moderation, payout decision/processing, marketplace listing publication, theme publication and theme moderation.
- Operation UI decision values are aligned with the canonical database enums; payout disbursement reference is distinct from operator reason.
- Master Data lifecycle remains allowlisted and canonical: Billing Plans, Credit Products and platform World Templates; history and rollback remain audited through the existing RPCs.
- Feature Flags and Configuration Versions retain their existing Phase 27A authoritative lifecycle; no duplicate lifecycle engine was introduced.
- No business fixtures were added.

## Verification boundary
- Supabase live state confirms all Phase 27C public wrappers exist, are executable by `authenticated` and not by `anon`.
- Private admin functions remain permission-gated through `admin_27c_require_read/manage` and `private.has_platform_permission`.
- Existing Phase 27C database migrations and invariants remain the canonical database implementation; no duplicate admin schema or engine was introduced.
- Runtime credentials, browser authenticated E2E, provider E2E, CI/CD, deployment and production Green remain intentionally deferred to the final runtime/production gates.

## Next execution wave

After Phase 27C implementation is complete, continue with **Payment, Billing & Economy Completion**. Do not introduce a numeric Phase 27D unless the canonical roadmap later defines it.