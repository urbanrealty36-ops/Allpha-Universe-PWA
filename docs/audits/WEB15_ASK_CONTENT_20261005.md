# WEB-15 — Ask the Content Audit

Date: 2026-10-05
Repository: urbanrealty36-ops/Allpha-Universe-PWA
Branch: main
Status: SOURCE IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFICATION PENDING / BROWSER QA PENDING

## Objective

WEB-15 deepens the existing Ask the Content boundary from the WEB-14 inline interaction into a full Content-grounded Ask Experience.

It is not a generic chatbot, article Q&A page, or second AI engine.

## Canonical flow

Content Capsule
→ Ask the Content
→ permission-scoped Content context
→ optional existing Agent Memory / Knowledge RAG
→ canonical AI Gateway

Action requests remain explicit Agent Runtime handoffs and are never executed by Ask.

## Implemented

### Frontend

Route:
- /content/{content_id}/ask

Files:
- apps/web/app/content/[id]/ask/page.tsx
- apps/web/components/content/ask-content-experience.tsx
- apps/web/components/content/ask-content-experience.module.css

Experience:
- Content-bounded question workspace
- quick question prompts
- local follow-up turns within the current UI session
- grounded answer presentation
- visible Content/Topic/AI Summary/Discussion/Community/Related/Agent/World/Live context
- direct Content Capsule transition
- direct Universe relationship transitions
- mobile-safe controls
- reduced-motion handling

The local turn list is presentation state only. It does not create Memory or replace the canonical Messaging/Conversation system.

### Backend

Existing endpoint retained:
- POST /api/v1/discovery/content/{content_id}/ask

Existing service retained:
- apps/api/app/services/ask_content.py

Enhancement:
- Ask response now exposes grounding metadata:
  - Content grounding
  - topic count
  - media count
  - optional private RAG status
  - memory count
  - knowledge count
  - authorization scope indicator

Content Evolution now exposes:
- Community step
- Agent step
- Ask step

No new table or migration was required.

## Architecture compliance

No new:
- Q&A engine
- chatbot engine
- RAG engine
- AI Gateway
- Agent Runtime
- Conversation engine
- Content engine

Existing canonical boundaries remain:
- Content authorization
- Agent Memory/Knowledge retrieval
- AI Gateway
- Agent Runtime handoff

Security:
- Private RAG requires an owned Agent and a real query embedding.
- No embedding is fabricated.
- Vector similarity never grants authorization.
- Content is permission-scoped server-side.
- Ask does not execute Agent actions.
- Provider/model routing remains inside the existing AI Gateway.

## Validation gates

Not yet claimed:
- Railway build success
- Railway deployment success
- browser/device visual QA
- authenticated E2E
- Production GREEN

CW-02 remains OPEN / ACTIVATING / NOT GREEN.

## Next

WEB-16 — Create Experience.
