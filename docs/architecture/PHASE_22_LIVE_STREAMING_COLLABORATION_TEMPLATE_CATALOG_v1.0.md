# Phase 22 — Live Streaming Collaboration Template Catalog v1.0

## Scope

This document defines the built-in platform catalog consumed by the Phase 22 Live Stories / Streaming / Experiences surface.

The catalog is a presentation/configuration layer. It does not create Live Sessions, Agents, viewers, ownership, permissions, policy, risk, approvals, billing, stream credentials or media assets.

## Canonical collaboration model

Human Owner → Live Session → owned AI Agent collaboration

Activation remains server-authoritative:

Ownership → capability → live policy → consent → risk → character/voice → activation → AI Gateway → Agent Runtime → realtime media → audience → audit.

The Human Owner retains authoritative pause/stop control.

## Template contract

Each published version contains:

- stage layout
- participant role slots
- Human Owner control surface
- AI collaboration role suggestions
- overlay placement
- audience interaction surfaces
- responsive behavior
- accessibility requirements
- semantic theme.* visual tokens
- Phase 22 runtime dependency metadata

Templates cannot contain executable code/script or authority namespaces such as permission, policy, risk, security, ownership, entitlement, billing or approval.

## Built-in platform catalog

1. Podcast Studio
2. Talkshow Prime
3. Interview Lab
4. Product Showcase
5. News & Discussion
6. Webinar Vision
7. Conference Stage
8. Investor Pitch
9. Product Launch
10. AMA Arena
11. Debate Forum
12. Education Classroom
13. Research Panel
14. Community Show
15. Creator Show
16. Shopping Live
17. Virtual Concert
18. Music Session
19. Gaming Live
20. Workshop Live
21. Demo Day
22. Town Hall
23. Roundtable
24. Coaching Room
25. Agent-to-Agent Show

## Source lanes

- platform: Allpha-owned built-in configuration; no fake creator/user ownership.
- creator: reserved for future creator-authored Live templates and its own validation/review/moderation/publish lifecycle.

## Database

- live_experience_templates
- live_experience_template_versions

Published platform templates are readable only through authenticated RLS and FastAPI.

## Runtime boundary

This catalog does not claim that camera transport, TTS, realtime conversation, AI Character rendering, audience runtime, stream-provider integration or full Live Session activation is complete. Those depend on the existing live_sessions, live_agent_collaborations, live_character_assets, live_session_overlays, live_session_viewers, Agent Runtime, AI Gateway, moderation and realtime authorization layers.

## Verification

Live AllphaDb-Universe verification:

- 25 platform templates
- 25 published/validated/performance-passed/approved v1 records
- 0 platform creator ownership records
- 0 unsafe template schemas
- existing Live Session records remain 0
- existing Live Agent collaboration records remain 0
- existing Live viewer records remain 0
- Phase 22 template invariant SQL passes
