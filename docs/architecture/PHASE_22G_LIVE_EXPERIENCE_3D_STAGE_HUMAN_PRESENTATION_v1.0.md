# Phase 22G — Live Experience 3D Stage + Human Presentation Runtime v1

## Canonical flow
Human Live Session → Live Experience Template → Theme 3D LiveExperienceStage → optional dedicated Stage GLB → Human-owned Agent Collaboration → real device camera → Face/Body presentation-readiness check → Human uniform/custom costume → Human Presentation Binding → activate_live_experience.

## 3D Stage source precedence
1. Dedicated approved live_experience_stage_assets for the selected template version.
2. Existing verified platform Theme 3D asset containing LiveExperienceStage.
3. No business-data placeholder is created when neither source is available.

The canonical renderer remains AllphaWorldRenderer. Phase 22G does not introduce a second renderer.

## Human camera
The browser obtains a real media stream with getUserMedia. The database stores only source metadata: source type, dimensions, frame rate, permission state and a non-sensitive optional device key. Raw frames are not persisted.

## Face / body check
Phase 22G stores presentation-readiness signals: face presence, body framing/presence, camera-stream liveness, quality scores, verification method, consent and expiry.
No face embedding, biometric template or raw frame is stored. This is not legal identity/KYC verification. A stronger detector/provider can be introduced later behind the same contract.

## Human costume
Platform/owned uniforms reuse uniform_catalog and user_uniforms. User-authored 3D costumes use live_human_costume_templates and private allpha-avatars Storage. Custom assets remain moderation-gated.

Supported category vocabulary: superhero, business_shirt, suit_tie, formal, nusantara, traditional, cultural, uniform, fantasy, sci_fi, creator, custom.

Licensed IP (for example Avengers) is not seeded by Allpha; users must supply assets under appropriate rights.

## Authority
Camera, face/body presence, Stage 3D, character, costume and presentation state never grant Agent authority. Agent execution remains governed by the existing Passport → Capability → Policy → Consent → Risk → Approval → Agent Runtime chain.

## Runtime gate
activate_live_experience() requires: owner-owned Live Session, active Stage binding, active/granted camera, unexpired verified presentation-readiness check, Human Presentation binding, and optional active Live Collaboration when supplied.

## Security
- RPC mutations are SECURITY DEFINER with empty search_path.
- Anonymous execute is revoked.
- Session ownership is checked server-side.
- Private Storage is exposed only through signed URLs.