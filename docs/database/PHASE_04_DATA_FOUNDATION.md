# PHASE 04 — Supabase PostgreSQL Data Foundation

## Scope
Phase 04 establishes the authoritative PostgreSQL foundation for Allpha Universe on **AllphaDb-Universe**.

## Implemented
- PostgreSQL 17 foundation verified.
- `pgcrypto` and `pgvector` enabled.
- 21 public application tables created.
- UUID primary keys and Auth ownership references.
- Enum/status foundations for account, Agent, memory, content, visibility, risk, approval, mission, commerce, subscription and configuration lifecycles.
- UTC timestamps and update-trigger infrastructure.
- Agent memory and knowledge chunk persistence.
- 1536-dimensional vector column + HNSW cosine index.
- Audit, security-event, risk-assessment, approval-request and idempotency primitives.
- Foreign-key and RLS-filter indexes.
- RLS enabled on all 21 public tables.
- Explicit client-role grants: authenticated receives only the operations required by the current ownership policies; anon remains denied.
- Owner-scoped RLS policies for identity, organization, Agent and knowledge foundations.
- Server-authoritative security/audit tables remain inaccessible to browser roles until their backend contracts are activated.
- Five private Storage buckets:
  - `allpha-avatars`
  - `allpha-media`
  - `allpha-agent-assets`
  - `allpha-world-assets`
  - `allpha-documents`
- Storage object ownership policies.
- Realtime publication for users, profiles, agents, agent_memory and knowledge_items.
- pgTAP extension enabled and 5 database foundation assertions executed successfully.
- Legacy `rls_auto_enable()` public execute access revoked.
- `set_updated_at()` search path pinned.

## Data policy
No business seed, fake, mock, dummy, scenario or placeholder records were inserted.

## Verification
Supabase verification confirmed:
- 21 public tables
- 21/21 public tables with RLS enabled
- 24 owner-scoped public RLS policies
- update triggers installed on mutable foundation tables
- pgcrypto 1.3
- pgvector 0.8.2
- five private Allpha Storage buckets
- five realtime tables registered

## Advisor state
Security advisor now reports only six informational `RLS enabled without policy` findings for server-authoritative tables:
`approval_requests`, `audit_logs`, `idempotency_keys`, `policy_rules`, `risk_assessments`, `security_events`.

These tables intentionally have no browser-role grants/policies at this stage because they are backend/server authoritative. They will receive their domain-specific authorization model in later security/backend phases.

## Deliberately not claimed
Phase 04 does **not** claim Auth complete, backend services complete, full domain schema complete, runtime Green, E2E Green, CI/CD, staging or production readiness. Those belong to later phases.

## Next phase
**PHASE 05 — Identity, Authentication & Authorization**
