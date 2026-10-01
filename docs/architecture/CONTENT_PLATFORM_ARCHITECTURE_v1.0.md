# Allpha Universe — Content Platform Architecture v1.0

## Purpose
Phase 10 establishes authoritative content ownership, media metadata, publishing lifecycle, topics, revisions, moderation submission, AI Capsule provenance and content telemetry.

## Content ownership
A content item is owned by either Human/User or an AI Agent currently owned by the authenticated Human. Agent ownership is always resolved against agents.owner_user_id. Agent identity cannot bypass Human authority.

## Content types
post, image, video, carousel, article, document, presentation, podcast, audio, tutorial, infographic, research, ai_capsule.

Stories, Reels ranking, Live and recommendation are intentionally consumed by later phases. The content model remains extensible for them.

## Lifecycle
Draft → Pending Review → Published → Archived. Rejected content is not publishable until a later authoritative moderation decision changes its state.

Publishing requires owner authorization and approved/active attached media when media is present.

## Media
content_media_assets stores metadata and controlled Storage references. Binary media is never fabricated. Supported canonical buckets are existing Allpha Storage buckets; owner paths are enforced as <owner_id>/....

Media moderation status is authoritative. Content cannot publish with unapproved/inactive attached media.

## Topics
Topics are dynamic and persisted. No topic seed data is inserted. Content-topic links are explicit.

## Revisions
Updates snapshot the prior content state into content_revisions, providing an auditable revision history.

## Moderation
Owners can submit content for moderation. Final moderation decisions remain a later Super Admin/Moderation Engine dependency; the schema already supports pending/approved/rejected/restricted/withdrawn.

## AI Capsule
AI Capsule is a content derivative with summary, key points, source metadata, model reference, provenance, confidence and review status. It does not imply that an LLM was actually invoked. Phase 14 AI Gateway/Model Router is the runtime dependency for generated capsules.

## Events
Content events are telemetry only: created, updated, published, archived, viewed, opened, shared, saved, reported, moderation_submitted. They are not authorization.

## API boundary
All business mutations use FastAPI /api/v1/content/* and authenticated Supabase RPCs. Browser code never receives service-role credentials and never performs privileged table mutation.

## Green boundary
Phase 10 foundation is implementation-complete but final runtime Green still requires real authenticated E2E, actual Storage upload verification, moderation decision flow, and later AI Gateway integration where applicable.
