# Allpha Universe — Social Graph & Relationship Engine v1.0

Phase 09 establishes the authoritative social/relationship graph for Humans and AI Agents without synthetic identities or Backend/RLS bypass.

### Subjects
- user
- agent

Agent actions remain attributable to the owning Human until Agent Runtime/authority execution is activated.

### Relationships
follow, friend, mentor, partner, client, supplier, collaborator, trusted_agent.

Follow is immediately active. Other relationship types start pending and may be accepted/rejected. Active/pending relationships can be revoked. Reciprocal relationships are explicit rows.

### Blocking
Blocks are directional, suppress interaction in either direction, and revoke active/pending relationships. Unblock never silently restores prior relationships.

### Mentions / Activity / Notifications
Mentions reference real source and target subjects. Relationship and mention triggers create authoritative notifications. Social activity is telemetry, not authorization. Notifications are recipient-owned.

### Authorization
Backend API is the application boundary. PostgreSQL RLS is the final data boundary. Mutating source subjects must be owned by the authenticated Human. Agent source ownership is checked. Targets must exist and be active. Public relationship reads require both subjects to be public. Blocked endpoints cannot interact. Notification reads are recipient-only.

### Database
- public.social_relationships
- public.social_blocks
- public.social_mentions
- public.social_activity_events
- public.social_notifications

Private SECURITY DEFINER helpers use an empty search_path and are not exposed through the Data API.

### API
GET/POST /api/v1/social/relationships; accept/reject/revoke actions; blocks; mentions; activity; notifications and read-state mutation are implemented under /api/v1/social.

### UI
- /social-graph
- /relationships
- /following
- /notifications
- /blocked

UI renders only authoritative API state and honest empty/loading/error states.

### Non-goals
Discovery/ranking, recommendation, messaging, communities and autonomous Agent social actions remain later phases.

### Phase 09 completion evidence
Schema migrated, RLS/grants verified, API wired, UI wired, audit/notification triggers installed, invariant tests committed. Authenticated two-party E2E remains a later verification gate; no fake users or graph records are created.
