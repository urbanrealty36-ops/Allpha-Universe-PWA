# Phase 22A — Live Session Core v1.0

## Scope
Phase 22A establishes the authoritative Live Session core:
- versioned binding to an approved Live Experience Template;
- Human Owner-scoped session access;
- Draft → Scheduled → Live → Ended lifecycle;
- Draft/Scheduled → Cancelled;
- immutable owner and template binding;
- optional schedule timestamp;
- public-live read surface for authenticated viewers;
- FastAPI CRUD and lifecycle endpoints;
- PWA session setup and owner lifecycle controls.

Phase 22B is intentionally not included: selecting and binding an owned AI Agent, capability verification, policy, consent, risk, and AI collaboration activation remain the next domain step.

## Authority
```text
PWA
  ↓
FastAPI
  ↓
Supabase PostgreSQL + RLS
  ↓
Live Session
```
The browser does not establish ownership, template validity, lifecycle authority, or Agent authority.

## Template binding
Every Phase 22 session created through the API must bind:
- `experience_template_id`
- `experience_template_version_id`

The bound version must be platform source, published, moderation approved, validation passed, and performance passed.
The binding is immutable after creation so a later template version cannot silently change an existing Live Session.

## Lifecycle
```text
draft
 ├── scheduled ── live ── ended
 │       └─────── cancelled
 └─────────────── cancelled
```
Terminal states are `ended` and `cancelled`.
`scheduled_at` is required for the `scheduled` state.
`started_at` and `ended_at` are server-populated by the database trigger.

## API
- `GET /api/v1/live/sessions`
- `POST /api/v1/live/sessions`
- `GET /api/v1/live/sessions/{session_id}`
- `PATCH /api/v1/live/sessions/{session_id}`
- `POST /api/v1/live/sessions/{session_id}/schedule`
- `POST /api/v1/live/sessions/{session_id}/start`
- `POST /api/v1/live/sessions/{session_id}/end`
- `POST /api/v1/live/sessions/{session_id}/cancel`

The session list is owner-scoped. Public sessions that are already live are readable through the existing read policy.

## Database
Migration: `20261002052000_phase_22a_live_session_core`
Added `live_sessions.experience_template_id`, `live_sessions.experience_template_version_id`, and `live_sessions.scheduled_at`.
Added owner/status/template indexes, RLS policies, and server-side lifecycle/template validation triggers.
No seed sessions, users, Agents, viewers, or stream references are created.

## Verification boundary
Phase 22A is an implementation milestone, not the final Allpha Green Gate.
Full authenticated E2E, realtime/media transport, AI Agent collaboration, CI/CD, runtime verification and production gates remain on their canonical later phases.