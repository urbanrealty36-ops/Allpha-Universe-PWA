# PHASE 13 — Messaging & Social Communication Completion Audit — 2026-10-03

## Status
**WEB ACTIVATED / IMPLEMENTED / NOT GREEN**

Phase 13 now uses the canonical Messaging Engine and adds the missing cross-owner AI Agent service/economy layer. Runtime deployment/E2E remains intentionally deferred by project policy.

## Completed
- Conversation lifecycle and participants.
- Human ↔ Human messaging.
- Human ↔ owned AI Agent messaging.
- Conversation requests, DM policies, block checks.
- Message send/reply/edit/delete.
- Delivery/read receipts foundation.
- Reactions and reports.
- Supabase Realtime transport.
- Contextual conversation metadata for Content/Agent service requests.
- Public cross-owner AI Agent discovery by published Skill.
- Skill-scoped Agent Service execution through the canonical Phase 15 Agent Runtime → Policy/Capability/Risk/Approval path → AI Gateway.
- Cross-owner Agent message authoring through a dedicated authorized RPC.
- AI Credit debit/reward/refund ledger.
- Cross-owner Agent Runtime command adapter with requester/owner separation.
- Service-scoped Agent Memory/Knowledge context; only public Knowledge and explicitly `metadata.service_visible=true` Memory can cross the service boundary.
- Per-request idempotency.
- Per-requester advisory lock for credit reservation concurrency.
- Content detail → Agent Service entry point.
- Feed/Moments → Agent Service entry point.
- Explicit anonymous RPC execution revoked for new privileged functions.
- RLS on new service/credit tables.
- Repository migration committed.

## Cross-owner Agent Service workflow
Human → public Agent → published Skill → block/privacy validation → AI Credit reservation/debit → Agent Policy / Passport / Capability boundary → canonical AI Gateway → model execution → Agent-authored message → service completion → AI Credit reward to Agent Owner

Generation failure:
- service is released;
- requester receives a refund ledger entry;
- no owner reward is posted.

## Credit semantics
No Credits are seeded. Balance is authoritative from ai_credit_ledger.
- requester: debit
- successful Agent Owner: reward
- failed service: refund
- future purchase/grant/economy flows may use purchase / grant
No monetary conversion is hard-coded in Phase 13.

## Safety / skill boundary
The service endpoint resolves Skill configuration server-side. The client cannot choose a lower credit cost.
Health/medical Skills are educational only in this layer and must not claim professional diagnosis, prescriptions or individualized treatment authority.

## Database
New:
- public.agent_service_requests
- public.ai_credit_ledger

New RPCs:
- get_ai_credit_balance
- list_public_agent_services
- reserve_agent_service_request
- complete_agent_service_request
- release_agent_service_request
- create_contextual_direct_conversation
- append_agent_service_message

Reconciled:
- create_ai_gateway_request permits a foreign Agent only when an active Agent Service reservation exists.

## API
- GET /api/v1/messaging/agent-services
- GET /api/v1/messaging/credits
- POST /api/v1/messaging/agent-services/generate

## Web
- /messages Agent Services surface.
- /content/[id] Ask an Agent / Generate Content.
- Feed/Moments Agent Service action.
- Existing Realtime Messaging surface remains canonical.

## Current live state
- Conversations: 0
- Messages: 0
- Agent Service Requests: 0
- AI Credit Ledger: 0
- Seeded AI Credits: 0
- Public Agents: 0
- Enabled Agent Skills: 0

These zero counts are intentional; no synthetic business data was inserted.

## Deferred gates
- Authenticated multi-user E2E.
- Human ↔ Human runtime.
- Human ↔ Agent runtime.
- Cross-owner Agent Skill execution against a real configured Agent through Agent Runtime.
- Agent Owner approval → requester resume workflow when policy requires approval.
- Real AI Gateway provider execution.
- Credit debit/reward/refund runtime settlement.
- Realtime delivery/read verification.
- Notification delivery.
- Attachments/media storage runtime.
- Accessibility/performance.
- CI/build.
- Vercel/Railway deployment.
- Production Green.