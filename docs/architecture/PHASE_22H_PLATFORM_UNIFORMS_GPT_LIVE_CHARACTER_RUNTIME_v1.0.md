# Phase 22H — Platform Human Uniform Catalog + OpenAI GPT-Live Character Voice Runtime

## Status
**IMPLEMENTED FOUNDATION / RUNTIME E2E PENDING**

## Scope
Phase 22H extends Phase 22G without creating a second Live engine or second Agent Runtime.

### Human Uniform
Allpha now provides platform-ready Human uniform presets in `uniform_catalog`. A Human can:
1. open the Live Experience setup;
2. select a ready Allpha uniform;
3. claim it through `claim_platform_uniform`;
4. receive an owned `user_uniforms` entitlement;
5. bind the owned uniform to `live_session_human_presentations`.

The platform catalog currently contains eight original ready presets:
- Allpha Classic White
- Allpha Business Navy
- Allpha Suit & Tie
- Allpha Formal Black
- Allpha Nusantara Batik
- Allpha Nusantara Modern
- Allpha Creator Street
- Allpha Future Tech

These are **presentation presets**, not tenant/business seed records and not copies of third-party IP. Custom GLB costume upload remains available separately with ownership + moderation.

### Voice
For the Live voice layer, Allpha uses OpenAI **GPT-Live** with WebRTC and client delegation. OpenAI's current documentation describes GPT-Live as a full-duplex voice layer that can listen while speaking and delegate substantive work to an application backend.

Canonical chain:
```
Human Live Session
→ Human Camera / Presence
→ Owned Agent Collaboration
→ GPT-Live (voice conversation)
→ client delegation
→ existing Allpha Live Conversation
→ existing Agent Runtime
→ existing AI Gateway / model routing
→ verified result
→ GPT-Live commentary
→ AI Character audio performance signal
→ AllphaWorldRenderer
```

No browser OpenAI project API key is exposed. The FastAPI backend validates the Live Session and Collaboration governance chain before creating the GPT-Live WebRTC session.

### Character performance
The canonical `AllphaWorldRenderer` now accepts an `agentCharacterPerformance` signal and applies a presentation-only procedural performance layer to an approved character GLB when one is selected.

Supported runtime signals:
- voice amplitude → mouth/jaw/viseme morph targets when available;
- speaking state → torso/shoulder/arm motion;
- idle eye movement;
- blink morphs when available;
- head/neck micro-motion;
- smile/happy morphs when available.

This is an **audio-driven presentation layer**, not a biometric or authority system. Accurate phoneme-level lip-sync, high-fidelity facial capture, emotion inference, hand gesture synthesis and full-body motion capture remain runtime-quality gates requiring compatible character rigs/assets and device performance verification.

## Security / governance
- GPT-Live session creation requires authenticated Human ownership of the Live Session.
- Collaboration must be active, consent approved, risk decision allow, capability verified and policy verified.
- Voice binding is stored without storing the OpenAI client secret.
- Platform uniforms are claimed through a SECURITY DEFINER RPC with authenticated-only execution.
- Presentation state never grants Agent authority.
- Camera frames, face embeddings and biometric templates are not persisted by this workflow.

## Database
- `live_session_voice_bindings`
- `claim_platform_uniform(uuid)`
- `prepare_live_voice_binding(uuid,uuid,text,text)`
- `transition_live_voice_binding(uuid,text)`

## Web/API
- `POST /api/v1/avatar/uniforms/{uniform_id}/claim`
- `POST /api/v1/live/sessions/{session_id}/voice/session`
- `POST /api/v1/live/sessions/{session_id}/voice/state`
- `GET /api/v1/live/sessions/{session_id}/voice`
- approved Live character asset signed runtime URLs

## Verification
Phase 22H invariant SQL: **10/10 passed, 0 failed** on the live AllphaDb-Universe project.

No Live voice binding or user-uniform ownership rows were seeded as test/business data.

## External OpenAI architecture reference
OpenAI currently documents GPT-Live as the recommended starting point for new conversational voice applications, with WebRTC for browser voice and client delegation for keeping an existing application agent/orchestrator. The Allpha implementation follows that separation: GPT-Live owns the spoken interaction while Allpha retains authorization, business state and Agent Runtime execution.
