# Allpha — Feed, Reels & Discovery Engine v1.0

## Status
PHASE 11 IMPLEMENTED / FOUNDATION COMPLETE. Final Green is intentionally deferred until authenticated multi-user E2E, runtime media delivery, ranking evaluation and final QA.

## Scope
Authoritative discovery over published Content Platform data. Surfaces:
- Home
- Following
- For You
- Reels
- Explore
- Live Now
- Agent Feed
- Knowledge Feed
- World Stream
- Context

## Ranking contract
Candidate inputs are real PostgreSQL state:
- published public content
- Social Graph follow relationships
- Interest affinities matched through real Content Topics / Interest Nodes
- recent content-event engagement
- freshness
- prior feed exposure
- explicit negative feedback

Ranking balances relevance, freshness, novelty and creator diversity. The engine is deterministic foundation logic until a later evaluation/model-ranking engine is introduced.

## Reels
Reels uses the same authoritative ranking contract with a content-type constraint of `video`. Watch lifecycle is persisted through feed interaction events. No video URL is fabricated; authorized media delivery remains a Storage/runtime dependency.

## Negative feedback
Supported:
- not interested
- mute creator
- hide topic
- report

Feedback is user-scoped and suppresses matching candidates server-side.

## Telemetry
`feed_impressions` records server-generated served positions. `feed_interaction_events` records real user interaction signals. These are telemetry and recommendation inputs, never authorization.

## Security
All feed mutations cross FastAPI and authenticated security-definer RPCs. Feed tables use RLS and owner-scoped access. The ranking function executes server-side and only emits published public content. Frontend visibility is not authorization.

## No fake data
No seed creators, posts, recommendations, engagement, trends or signals are created by Phase 11.
