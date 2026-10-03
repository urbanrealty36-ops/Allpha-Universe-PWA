# PHASE 27C — Super Admin Domain Operations, Transaction Explorer & Master Data Management

Status: IMPLEMENTED FOUNDATION / NOT GREEN

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
- database/migrations/phase_27c_transaction_explorer.sql
- database/migrations/phase_27c_domain_explorer.sql
- database/migrations/phase_27c_master_data_and_domain_operations.sql

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

## Verification
- Phase 27C public wrappers are not executable by anon.
- Authenticated EXECUTE is present.
- Super Admin temporary transactional role context exercised transaction explorer and Users/Billing Plans/Credit Products domain explorers.
- Temporary role assignment was rolled back.
- No business fixtures were persisted.

Not GREEN:
- Browser-level authenticated Admin E2E pending.
- API/Admin typecheck/build/CI pending.
- Real Marketplace → Midtrans → settlement → payout lifecycle pending.
- Phase 26 leaked-password protection intentionally remains pending until production.
- Final QA/CI/CD/runtime/production gates remain later phases.

## Next

PHASE 27D — Super Admin Governance Actions, Detail Views & Cross-Domain Operational Workflows, unless repository reconciliation defines a more specific next sub-phase.