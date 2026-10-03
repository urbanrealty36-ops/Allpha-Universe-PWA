# Phase 22I — AI Character Asset + Animation Contract v1

## Purpose
Expose a ready-to-use AI Agent Character runtime in the Allpha Web App without requiring the Human to upload a GLB.

## Platform character asset model
- Existing `agent_character_catalog` remains the logical character catalog.
- Each enabled catalog character receives a platform runtime asset in `live_character_assets` with `asset_source=platform_catalog`.
- Platform assets are deterministic procedural humanoids; no fake user/business records are created and no GLB upload is required.
- The canonical `select_live_character` RPC allows these platform assets while retaining ownership checks for user/Agent-owned assets.

## Animation contract
`live_character_asset_contracts` version `ai-character-animation-v1` defines:
- Full-body channels: root, pelvis, spine/chest, neck/head, both arms/hands, both legs/feet.
- Face channels: eyes, brows, mouth/jaw and cheeks.
- Voice→viseme presentation: realtime audio level drives mouth/jaw amplitude. This is an amplitude proxy, not phoneme-perfect lip-sync.
- Runtime states: idle, listening, thinking, speaking, emphasis, greeting, acknowledge, farewell.
- Gesture mapping and priorities are deterministic and client-side.
- No per-frame animation state is persisted in Postgres.

## OpenAI voice boundary
The existing Live voice runtime remains canonical: WebRTC full-duplex voice session → OpenAI GPT-Live → existing Allpha Live Collaboration / Agent Runtime delegation.
The animation layer consumes voice lifecycle and output-audio level signals; it does not create another AI or voice engine.

OpenAI's current pricing lists GPT-Live 1 as a voice-session model billed by the second, and distinguishes it from the Realtime audio models. citeturn1search0

## User flow
1. Human selects Live Session.
2. Human selects Theme/3D Stage.
3. Human selects an AI Character from the Ready Platform catalog.
4. Human selects an existing Live Collaboration.
5. Human activates camera + presentation readiness.
6. Human binds Human Presentation / Uniform.
7. Human starts OpenAI Live Voice.
8. AI Character animates body, face, eyes and lips from the realtime voice/lifecycle signals.
9. Governed business actions remain on the canonical Agent Runtime authority chain.

## Uniform
The current platform catalog contains 8 published/approved Allpha-original uniform presets. They are procedural presentation presets and do not require Human-owned GLB storage. The UI exposes them as Ready Platform uniforms; claiming creates user ownership through the existing `claim_platform_uniform` flow.

## Security
- Platform character assets are not owned by any user.
- Custom/Agent GLB assets remain ownership/moderation scoped.
- Anonymous execute is denied for character selection/runtime catalog RPCs.
- Presentation and animation never grant Agent authority.
- Camera frames, face embeddings and biometric templates are not persisted.
