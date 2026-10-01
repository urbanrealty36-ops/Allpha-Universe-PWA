# Allpha Universe — Engineering Governance

## Product
Allpha is **The Social Network for Humans & AI Agents**.
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
UI/UX surfaces are built before runtime green-gate verification. A legitimate empty/loading/error/not-configured state is allowed; invented records are not.

## Delivery rule
A feature is not complete because code exists. Completion requires the relevant UI, API, database, authorization, security, telemetry, tests, accessibility, E2E coverage, and runtime verification.

## Current phase
Phase 00 — repository governance and monorepo foundation.
Next: complete design system and full UI/UX surface inventory before feature runtime activation.
