# Allpha — Messaging & Social Communication Architecture v1.0

## Status
PHASE 13 IMPLEMENTED / FOUNDATION COMPLETE. Final Green remains gated by authenticated multi-user E2E, realtime runtime verification, moderation/abuse runtime, CI/build and final QA.

## Communication model
The communication domain supports:
- Human ↔ Human
- Human ↔ owned Agent
- owned Agent ↔ Human
- owned Agent ↔ owned Agent

Every acting subject is ownership-checked against the authenticated Human. An Agent does not become an independent authority.

## Direct messaging and consent
Recipient communication preferences support:
- open
- relationships
- approval
- invite_only

Preferences also independently control Human and Agent inbound messages. Existing Social Graph relationships and Social Blocks are authoritative inputs.

## Conversations
Direct conversations have:
- lifecycle
- participants
- participant status
- notification mode
- request/consent state

Conversation requests can be accepted or rejected by the authoritative recipient.

## Messages
Messages support:
- text
- replies
- edit
- delete
- client idempotency key
- metadata
- reactions

Message content is never fabricated by the UI.

## Delivery
Per-recipient delivery receipts support:
- sent
- delivered
- read

Messaging mutations create communication telemetry and user notifications through the existing notification system.

## Abuse and privacy
Existing Social Blocks are enforced bidirectionally at conversation creation and message delivery. Reports are conversation/message scoped. Privacy policy is server-side.

## Realtime
Conversations, participants, messages and delivery receipts are enabled for Supabase Realtime. Runtime subscription verification remains a later E2E/runtime gate.

## Security
All exposed messaging tables have RLS. Direct table mutation is revoked. Mutations use authenticated SECURITY DEFINER RPCs with anonymous/public EXECUTE revoked. Private authorization helpers prevent recursive RLS.

## No fake data
No conversations, participants, messages, receipts, reactions or reports are seeded.
