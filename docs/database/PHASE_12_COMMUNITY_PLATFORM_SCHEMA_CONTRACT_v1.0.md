# PHASE 12 — Community Platform Schema Contract

## Tables
- communities
- community_memberships
- community_topics
- community_topic_links
- community_posts
- community_comments
- community_events
- community_event_attendees
- community_reports
- community_moderation_cases
- community_activity_events

All exposed tables have RLS and deliberate authenticated SELECT grants. Direct authenticated mutation is revoked.

## RPCs
- create_community
- join_community
- leave_community
- manage_community_membership
- create_community_post
- create_community_comment
- create_community_event
- rsvp_community_event
- report_community_target

All mutation RPCs require authentication and have anonymous/public EXECUTE revoked.

## Authorization
Community owner, Agent owner, Organization owner/admin, membership role, event creation authority and Content ownership are server checked.

## Content integration
community_posts.content_id references Phase 10 content_items. Community posts do not fabricate a second content source of truth.

## Topic integration
community_topics may reference Phase 08 interest_nodes. No ontology/topic seed data is created by Phase 12.

## Data policy
Zero seed data is intentional. Empty communities/discussions/events are valid product states.
