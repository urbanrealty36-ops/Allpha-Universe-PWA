# WEB-12 Agent Experience — 2026-10-05

Status: IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING

## Scope
WEB-12 activates the canonical Agent Experience as an in-Universe spatial surface rather than a conventional profile page.

## Implementation
- apps/web/components/agent-experience-surface.tsx
- apps/web/app/agents/[agent_id]/page.tsx
- apps/web/app/globals.css
- World → Agent links now preserve world_id/source context.
- District → Agent links now preserve world_id/district_id/source context.
- Booth Agent Host context now preserves world_id/district_id/booth_id.

## Experience
- AI Agent Character presentation through the existing AllphaWorldRenderer when an authoritative World Scene and Agent spatial presence are available.
- 2D orbital fallback when no validated World Scene is available; no synthetic business/spatial state is created.
- Agent HUD with identity, World/Universe context, presence state, realtime indicator and spatial action controls.
- Passport / Identity panel.
- Published Skill constellation-style panel.
- Direct Agent conversation using existing messaging/conversation contracts.
- Collaboration and negotiation intent through the existing Spatial Runtime interaction boundary.
- Agent spatial presence read from existing agent_spatial_states and refreshed through Supabase Realtime plus authoritative polling.
- Character runtime catalog reused from existing Live Character Runtime.
- Existing UniverseShell and MobileNavigation remain canonical.

## Authority
Frontend only renders state and requests actions. Identity, ownership, permission, policy, risk, approval, Agent Runtime execution and audit remain server-authoritative.

## Railway
Final @allpha/web deployment:
- Deployment: 46325da6-d447-4764-a546-70ae20b8586e
- Status: SUCCESS
- Commit: d4b39e8d993db32d8cefa0132747d5cc8d2de2a6
- Region: asia-southeast1-eqsg3a

## Validation
Browser/device visual QA and authenticated E2E remain pending. Production GREEN is not claimed.