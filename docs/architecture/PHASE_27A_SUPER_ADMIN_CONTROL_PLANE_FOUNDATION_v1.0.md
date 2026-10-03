# PHASE 27A — Super Admin Control Plane Foundation

Status: IMPLEMENTED FOUNDATION / NOT GREEN

## Scope
27A establishes the canonical governance layer for the existing Super Admin application. It does not replace or duplicate domain engines.

Implemented:
- server-authoritative Super Admin overview over existing domain tables
- platform feature flag persistence and rollout configuration
- configuration version persistence with draft -> publish -> archived lifecycle
- audit evidence for feature-flag and configuration-version mutations
- FastAPI /api/v1/admin/control-plane/*
- Admin PWA Feature Flags and Configuration Versions surfaces
- fail-closed RLS on control-plane tables
- authenticated-only public RPC wrappers
- private SECURITY DEFINER implementation functions with fixed search_path
- reuse of existing admin.read, admin.manage, platform_roles, permissions, private.has_platform_permission, audit_logs, and FastAPI auth boundary

## Architecture
Admin Browser -> Supabase Auth session -> FastAPI -> RBAC permission -> authenticated RPC wrapper -> private governance function -> PostgreSQL/RLS/audit.
The Admin browser never receives service-role credentials and never writes control-plane tables directly.

## Existing domain reuse
The overview reads authoritative counts from existing Users, Agents, Content, Communities, Galaxy/World, District, Booth, Themes, Marketplace, Missions, Community Events, Billing Plans, Credit Products, AI Providers, AI Models, Approval Requests, Moderation Cases and Payout Requests.
Phase 27A does not create a second RBAC/ABAC engine, Audit Ledger, Billing/Economy engine, Marketplace/Commerce engine, AI Provider/Model Router, Moderation engine, or Risk/Approval engine.

## Feature flags
Feature flags are platform configuration only. A flag never grants permission, capability, entitlement, ownership, billing authority or Agent authority.
Rollout percentage is persisted as configuration. Runtime consumers must remain server-authoritative; 27A does not silently retrofit flags into unrelated domain logic.

## Configuration versions
Configuration is versioned per namespace. A namespace can have at most one published version. Publishing archives the previous published version and records the publishing admin in audit logs.
No configuration records are seeded by this phase.

## Security
- Control-plane tables have RLS enabled with zero ordinary client policies.
- Public RPC execute is revoked; authenticated execution is explicit.
- Private governance functions require existing private.has_platform_permission.
- High-impact configuration changes are audited.
- No business seed/demo data is created.
- Existing Phase 26 Security Advisor / SECURITY DEFINER audit remains a separate OPEN gate and is intentionally not declared complete here.

## Verification
Live checks completed:
- platform_feature_flags RLS: enabled
- platform_config_versions RLS: enabled
- control-plane client policies: 0
- public EXECUTE on 27A wrappers: revoked
- authenticated EXECUTE: present
- private governance functions: SECURITY DEFINER with fixed search_path
- current non-admin authenticated identity: private.has_platform_permission(admin.read) = false
- direct overview call for that non-admin identity: denied with permission_denied

Remaining gates:
- authenticated Super Admin browser E2E with an actual admin-role account
- API/Admin typecheck/build/CI
- feature-flag consumer integration across target domains
- full Phase 27 domain surfaces
- Phase 26 production security gates
- later Analytics/Observability and final E2E/production gates

## Next
PHASE 27B — Super Admin Domain Operations & Governance Surfaces
Continue by wiring existing domain APIs into the Admin control plane for Users, Agents, Content/Moderation, Universe/World/District/Booth, Marketplace/Commerce, Missions/Events, Billing/Economy/Payouts, AI Provider/Model Router, Security/Risk/Approval and Audit—without creating duplicate domain engines.