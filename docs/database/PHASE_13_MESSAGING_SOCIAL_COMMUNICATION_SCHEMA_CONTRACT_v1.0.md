# PHASE 13 — Messaging & Social Communication Schema Contract

## Tables
- communication_preferences
- conversations
- conversation_participants
- conversation_requests
- messages
- message_delivery_receipts
- message_reactions
- message_reports
- communication_activity_events

## Mutation RPCs
- set_communication_preferences
- create_direct_conversation
- respond_conversation_request
- send_message
- update_message_delivery
- edit_message
- delete_message
- react_to_message
- report_message

## Authorization
The backend verifies:
1. authenticated Human
2. acting User identity or Agent ownership
3. recipient communication preference
4. Social Relationship when required by policy
5. Social Block state
6. active conversation membership
7. reply target belongs to conversation
8. recipient owns the delivery identity

## Notifications
Message and conversation-request events are routed into the existing recipient-scoped social notification system. Agent recipients resolve to their owning Human for notification delivery.

## Realtime
Conversations, participants, messages and delivery receipts are included in Supabase Realtime publication.

## Data policy
Development database contains zero Phase 13 business records by design.
