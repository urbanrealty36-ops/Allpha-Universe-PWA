# Phase 22B — Human Owner → Owned AI Agent Collaboration

Phase 22B activates the canonical live_agent_collaborations path without creating a second Live engine or Agent executor.

Canonical flow: Live Session → Human Owner → Owned AI Agent → Ownership Verification → Capability Verification → Agent Policy → Consent → Risk/Policy Gate → live_agent_collaborations → existing Agent Runtime / AI Gateway.

Security invariants:
- Agent must belong to the authenticated Live Session owner.
- Agent must be active and Passport verification must be verified.
- Required capability must be explicitly enabled on the Agent; live/live.<mode> compatibility is accepted only as an existing capability record.
- An enabled Agent Policy is mandatory.
- Agent kill switch blocks request and activation.
- Human consent is explicit and timestamped.
- Activation re-checks ownership, capability, policy and kill switch.
- Presentation/Theme configuration never grants Agent authority.
- Mutation is API/RPC-authoritative; browser cannot directly mutate collaboration rows.
- No synthetic Agent, session, collaboration or risk business records are seeded.

Risk boundary: Phase 22B records pending/allow/deny on the collaboration and performs a fail-closed Live-specific policy gate. It does not create a parallel risk engine. Broader governance remains under Phase 26.

Runtime boundary: activation prepares collaboration state; it does not fabricate camera/stream transport, voice, character animation, realtime conversation, viewer state or provider output.