# WEB-14 — Content Capsule / Content Experience Audit

Date: 2026-10-05
Repository: urbanrealty36-ops/Allpha-Universe-PWA
Branch: main
Status: SOURCE IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFICATION PENDING / BROWSER QA PENDING

## Objective

WEB-14 turns the WEB-13 Moments Capsule into a full Universe Content Experience.

The target is not a conventional article/post detail page.

Canonical journey:

Moments Capsule → Content Experience → AI Summary → Discussion → Related Content → Community → Agent → Ask → Live → World

## Implemented

### Web surface

Route:
- /content/{content_id}

Files:
- apps/web/app/content/[content_id]/page.tsx
- apps/web/components/content/content-capsule-experience.tsx
- apps/web/components/content/content-capsule-experience.module.css

The surface provides:
- Content Capsule identity and creator/Agent context
- original Content body and topics
- authoritative Content Media references
- reviewed AI Summary presentation
- Ask the Content
- Community discussion and visible comments
- Related Content derived from canonical topic relationships
- Agent relationship when Content is Agent-owned
- Live transition only for an authoritative linked Live Session
- World transition only for authoritative World Content placement
- direct Community transition
- explicit empty/unavailable states
- mobile-safe 44px interaction controls and reduced-motion handling

### Existing backend composition

WEB-14 reuses:
- GET /api/v1/discovery/content/{content_id}/evolution
- POST /api/v1/discovery/content/{content_id}/ask
- POST /api/v1/content/{content_id}/events

The existing Content Evolution service was enriched to return:
- Content body/context
- Content Topics
- Content Media references
- reviewed AI Capsule
- Community Posts
- Community Comments
- Community records
- topic-related published Content
- Live Session relationship
- World placement + World details
- owner Agent relationship

No new database table or migration was required.

### WEB-13 integration

The Moments quick Capsule now provides a direct transition to:
- /content/{content_id}

The quick Capsule remains useful as a preview; the full Content Experience is the canonical deep destination.

## Architecture compliance

Confirmed by source design:
- No second Content engine.
- No second Feed/Discovery/Recommendation engine.
- No second AI Summary engine.
- No second Community engine.
- No second Agent Runtime.
- No second AI Gateway.
- No second Live engine.
- No second World/Spatial engine.
- No frontend authority decision.
- No synthetic Content, AI Summary, Agent, Live or World state.
- No fabricated media URL.
- CSS/spatial visual treatment is presentation only.

Ask the Content remains behind the existing permission-scoped AI Gateway path and does not execute Agent actions.

## Validation gates

Not yet claimed:
- Railway build success
- Railway deployment success
- browser/device visual QA
- authenticated E2E
- Production GREEN

CW-02 remains OPEN / ACTIVATING / NOT GREEN.

## Next

WEB-15 — Ask the Content.

WEB-15 should build on the existing ask_content service and AI Gateway boundary rather than introducing another question-answer engine.
