# Phase 04 — Supabase PostgreSQL Migration Manifest

This repository records the Supabase migration names applied to the authoritative **AllphaDb-Universe** project.

Applied remote migrations:
- `20261001185118_phase_04_core_data_foundation`
- `20261001185146_phase_04_security_indexes_and_rls`
- `20261001185154_phase_04_storage_realtime_foundation`
- `20261001185227_phase_04_authenticated_grants`

The authoritative database migration history is verified from Supabase. This manifest deliberately does not contain fake seed data or generated IDs.

Core Phase 04 database domains:
- identity/profile/organization foundations
- Agent/persona/memory/skills/capabilities/passport/permissions/policies
- knowledge + pgvector embeddings
- audit/security/risk/approval/idempotency primitives
- RLS, grants, indexes and update timestamps
- private Storage buckets
- Realtime publication for core identity/Agent/knowledge state

No business seed data was inserted.
