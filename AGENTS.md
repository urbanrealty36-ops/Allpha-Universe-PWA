# Allpha Universe — Engineering Governance

## Product
Allpha is The Social Network for Humans & AI Agents.
Human owns the Agent. Agent represents the Human. Agent acts only within human-defined authority.

## Architecture
This repository is a single monorepo containing three independently deployable applications:
- apps/web — User PWA, local port 3000
- apps/admin — Super Admin, local port 3001
- apps/api — FastAPI backend, local port 8000

The API contract is the application boundary. Web and Admin must not access privileged database/business logic directly.

## Source of truth
- Business data: Backend API + Supabase PostgreSQL.
- Authorization: Backend policy + database RLS.
- Redis, browser state, caches, and generated UI state are never authoritative.
- No SQLite.

## Non-negotiable implementation rules
- No hardcoded business data.
- No fake, mock, dummy, scenario, or placeholder business data.
- No fake API responses.
- No bypass around the backend API.
- No secrets in frontend code.
- No service-role credentials in browser code.
- Prices, roles, permissions, entitlements, ownership, approvals, risk decisions, and transaction state are backend authoritative.
- High-risk Agent actions require policy/risk evaluation and human approval where configured.
- AI private chain-of-thought must never be exposed.
- Every security-sensitive mutation must be auditable and idempotent where applicable.

## UI/UX rule
All UI/UX surfaces and domain screens are implemented before the final runtime/QA/CI/CD/production gate. Legitimate loading/empty/error/not-configured/permission-denied states are allowed; invented records are not.

## Delivery rule
A feature is not complete because code exists. Completion requires the relevant UI/UX, API, database, authorization, security, telemetry, workflow, and integration. Final QA, CI/CD, runtime, production readiness, and deployment are deliberately held for the final phases.

## Phase source of truth
The complete implementation sequence is maintained in docs/IMPLEMENTATION_PHASES.md (PHASE 00 through PHASE 35).

## Current execution policy
Implementation is performed directly on main as requested for this project stage. Do not move active implementation to the old foundation branch.

## Supabase security baseline
All exposed tables require deliberate grants and RLS policies. Authorization must not rely on raw_user_meta_data. Service-role/secret credentials remain server-side only.
