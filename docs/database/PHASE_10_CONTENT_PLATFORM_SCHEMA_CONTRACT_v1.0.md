# Allpha Universe — Phase 10 Content Platform Schema Contract v1.0

## Tables
- content_items
- content_media_assets
- content_media
- content_topics
- content_topic_links
- content_revisions
- content_moderation_cases
- ai_capsules
- content_events

## Security
All nine tables have RLS enabled. Direct anonymous/authenticated table mutation is revoked. Public mutation RPCs are authenticated-only. Private authorization helpers use SECURITY DEFINER with empty search_path.

## Ownership
Polymorphic owner references use owner_type=user|agent + owner_id. Agent ownership is checked against agents.owner_user_id.

## Visibility
Published public content is readable only when its owner is public. Draft/private/unlisted owner data is available only to the owner through RLS.

## Media
Media references use controlled Storage buckets and owner-scoped paths. Metadata includes MIME, size, checksum, dimensions, duration and moderation state.

## Publishing invariant
Publishing fails when any attached media is not approved and active.

## Moderation
A moderation case targets exactly one of content or media. Owner submission transitions content to pending_review.

## Audit / telemetry
Content creation/update and moderation/publish/archive flows write audit/event records. Content events remain telemetry and cannot grant authority.

## Seed policy
No users, Agents, content, media metadata, topics, moderation cases or AI Capsules are seeded.
