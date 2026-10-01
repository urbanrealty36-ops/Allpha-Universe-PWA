# Phase 06 — Human & AI Identity Foundation

Applied to AllphaDb-Universe.

## Database activation
- Human identity uses the existing Phase 05 users, profiles, and identities records.
- AI identity is represented by agent_identities and linked 1:1 to agents.
- Added agent_credentials, agent_budgets, and append-only agent_reputation_events.
- Strengthened Passport ownership from read-only to owner-scoped CRUD; removed the superseded duplicate SELECT policy.
- Added explicit autonomy-level validation: recommend, assist, conditional, autonomous.
- Added transactional, RLS-scoped create_agent_identity(...) RPC. It creates only caller-owned identity records and related persona/passport/policy/budget records in one database transaction.
- Added database audit triggers for identity/Agent security mutations.
- Verification status is server-authoritative; owner requests can move status to pending but cannot self-verify.
- Organization attachment is owner/member enforced inside the transactional creation function.
- No user, Agent, credential, reputation, or demo seed records were inserted.

## Backend activation
- Human identity/profile API.
- Agent creation and profile lifecycle API.
- Persona, Passport, AI Identity, verification request, Skills, Capabilities, Permissions, Policy, Budget, Credentials, Reputation APIs.
- All domain access is authenticated and owner-scoped through Supabase RLS.
- Agent runtime command remains intentionally deferred to Phase 15.

## Security
The creation RPC is SECURITY INVOKER and executable only by authenticated; no service-role credential is used. Browser access to the new tables is explicitly granted only where RLS policies provide owner-scoped access. Reputation events are readable by the owner but are not browser-writable.
