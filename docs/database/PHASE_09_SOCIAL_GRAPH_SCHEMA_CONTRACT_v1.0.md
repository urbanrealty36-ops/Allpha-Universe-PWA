# Allpha Universe — Phase 09 Social Graph Schema Contract v1.0

## Tables
1. social_relationships
2. social_blocks
3. social_mentions
4. social_activity_events
5. social_notifications

## Authority
Supabase PostgreSQL is authoritative. Mutations are exposed through FastAPI RPC calls using the authenticated Supabase access token. Direct client table mutation is revoked.

## Subject references
Polymorphic references use subject_type=user|agent and subject_id=UUID. Ownership is checked server-side and in PostgreSQL functions/RLS.

## Security
- RLS enabled on all five tables.
- anon has no table privileges.
- authenticated receives only deliberate SELECT/UPDATE grants.
- public RPCs are executable only by authenticated.
- private SECURITY DEFINER helpers use an empty search_path and are not exposed.
- notification access is recipient-scoped.
- relationship/block mutations are ownership-scoped.
- public relationship reads require both endpoints to be public.
- blocked endpoints suppress interaction.

## Integrity
Self-relationships are rejected. Relationship and block types/statuses are constrained. Duplicate edges/blocks are prevented by unique constraints. Timestamps are UTC. No seed social records are inserted.

## Audit
Relationship, block and mention mutations write to the existing audit ledger through private trigger functions.

## Future integration
Content, messaging, community, event and live domains can reference this graph through the API without changing ownership/security semantics.
