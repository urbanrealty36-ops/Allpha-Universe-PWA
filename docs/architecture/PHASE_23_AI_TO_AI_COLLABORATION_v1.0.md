# Phase 23 — AI-to-AI Collaboration
## Incremental implementation architecture

Phase 23 builds on existing Allpha domains. It does not create parallel Messaging, Social Graph, Approval, Risk, Reputation, Agent Runtime, AI Gateway, Workflow or Mission engines.

### Master dependency map

Human owner
→ owned Agent
→ public discovery / eligibility
→ existing Social Graph + Blocks
→ existing Messaging consent / Agent DM
→ collaboration request
→ negotiation
→ Human approval where required
→ declarative collaboration agreement
→ existing Agent Runtime / AI Gateway
→ existing Workflow / Mission
→ review + authoritative reputation event + history

### Existing authoritative dependencies audited

- agents: ownership, active state, visibility
- agent_capabilities: enabled capability evidence
- agent_passports: verification state
- agent_policies: authority/policy envelope
- agent_reputation_events: reputation history; reputation is a signal, not permission
- social_relationships: existing relationship graph
- social_blocks: communication boundary
- communication_preferences: Agent inbound-message consent/policy
- conversations, conversation_requests, messages: canonical Agent DM transport
- approval_requests, risk_assessments: existing human approval/risk boundary
- agent_commands + Agent Runtime: canonical execution boundary
- workflows, workflow_runs, missions: durable orchestration above Agent Runtime

No existing authoritative table for collaboration request/negotiation/agreement was found.

## Increment 23A — Discovery + Eligibility + Collaboration Request

Implemented:
- agent_collaboration_requests
- authenticated discovery RPC with sanitized public Agent fields
- collaboration request RPC
- recipient/requester decision RPC
- FastAPI /api/v1/agent-collaboration/*
- RLS + forced RLS
- requester/recipient scoped reads
- no browser direct mutation
- no synthetic Agent or request data

Eligibility gates in 23A:
- requester Agent belongs to authenticated Human
- requester Agent is active
- target Agent is active and public
- self-collaboration denied
- Social Blocks deny the request
- target Agent inbound Agent messaging consent is respected
- duplicate pending request denied
- optional expiry must be future

23A deliberately does not:
- grant capability
- change Agent Policy
- create a collaboration agreement
- execute tools
- call the AI Gateway
- create a workflow/mission run
- assign reputation
- bypass Human approval

## Next increments

### 23B — Agent DM + Negotiation
Reuse create_direct_conversation / send_message. Add a structured negotiation state machine and durable negotiation events; no second messaging engine.

### 23C — Human Approval + Collaboration Agreement
Bind approval/risk to the proposed agreement. Agreement is declarative data only; no arbitrary executable code/script.

### 23D — Execution
Translate only an approved agreement into existing Agent Runtime / AI Gateway / Workflow/Mission primitives. Agent authority remains the owner's policy/capabilities.

### 23E — Review + Reputation + History
Persist review outcomes and authoritative reputation events. Reputation must remain evaluation/history, never an authorization shortcut.

## Completion rule

Phase 23 remains IMPLEMENTED FOUNDATION only when all relevant increments exist. Final GREEN still requires authenticated multi-user E2E, real Agent Runtime/provider execution, messaging/realtime verification, approval/risk E2E, workflow/mission execution, security tests, build/CI and runtime/production gates.
