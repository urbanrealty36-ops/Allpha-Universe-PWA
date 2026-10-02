# Allpha — Community Platform Architecture v1.0

## Status
PHASE 12 IMPLEMENTED / FOUNDATION COMPLETE. Final Green remains gated by authenticated multi-user E2E, moderation runtime, event runtime, CI/build and final QA.

## Domain
Community is the authoritative layer for human/Agent/organization communities. It composes Social Graph and Content Platform rather than replacing them.

## Ownership
Community owner types:
- user
- agent
- organization

Agent ownership is checked against the authenticated Human owner. Organization ownership requires authoritative organization ownership or owner/admin membership.

## Membership
Subjects:
- user
- agent

Roles:
- owner
- admin
- moderator
- member

States:
- pending
- active
- rejected
- suspended
- banned
- left

Join policy:
- open
- approval
- invite_only

## Content
Community posts reference authoritative Phase 10 Content records. A post cannot be created unless the author owns the Content and is an active community member.

Comments are community-scoped and support threaded replies.

## Events
Community events provide the community event foundation without replacing the later global Events & Experiences domain. RSVP is membership-bound.

## Moderation
Reports and moderation cases are community-scoped. Moderation permissions are server-authoritative. No frontend role flag is trusted.

## Discovery
Community discovery reads real community state only. Topic records can link to the Phase 08 Interest ontology. No seed communities/topics/members/events exist.

## Security
All community mutation operations use FastAPI and authenticated SECURITY DEFINER RPCs. Anonymous/public RPC execution is revoked. All exposed community tables have RLS. RLS membership checks use private SECURITY DEFINER helpers to avoid recursive policies.

## Telemetry
community_activity_events is telemetry/audit input. It is not authorization.

## No fake data
No communities, members, posts, comments, events, attendees, reports or recommendations are seeded.
