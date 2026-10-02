# PHASE 11 — Feed, Reels & Discovery Schema Contract

## Tables
### feed_impressions
User-scoped server-generated impressions:
- user_id
- content_id
- surface
- position
- rank_score
- reason_codes
- request_id
- created_at

### feed_interaction_events
Real interaction telemetry:
- user_id
- content_id
- surface
- event_type
- position
- watch_duration_ms
- metadata
- created_at

### feed_feedback
Explicit negative feedback:
- user_id
- optional content/owner/topic target
- feedback_type
- reason
- metadata
- created_at

All three tables have RLS enabled. Authenticated direct mutation is revoked; writes use security-definer RPCs.

## RPCs
- get_feed(surface, limit, offset, query)
- record_feed_interaction(...)
- record_feed_feedback(...)

## Ranking inputs
Content status/visibility, social follow state, interest affinity, content event engagement, freshness, exposure count, feedback suppression and owner diversity.

## Data policy
No seed rows are inserted. Empty results are legitimate.
