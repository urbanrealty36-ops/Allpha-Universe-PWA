# Allpha Universe — Phase 21 Theme & World Builder Architecture v1.0

## Boundary
World → District → Booth/Tenant → Theme/Scene → Catalog/Media → Phase 22 Live Experience.

Phase 21 owns presentation configuration, templates, versioning, builder state, validation and moderation lifecycle. It never grants identity, ownership, entitlement, permission, billing, reputation, risk, approval authority or security authority.

## Theme
Themes contain metadata, compatibility, allowed components, performance/accessibility constraints and versioned presentation tokens. Theme token overrides are limited to the PRD namespaces:
- theme.color.*
- theme.typography.*
- theme.radius.*
- theme.background.*
- theme.effects.*
- theme.avatar.*
- theme.spatial.*

Protected namespaces are never theme-controlled: security, permission, policy, risk, ownership, verification, reputation and audit.

## Theme lifecycle
Draft → Version Draft → Structural Validation → Review → Moderation → Published → Archived/Suspended.

Theme assets are registered against a version. Assets carry moderation, safety and performance state and never fabricate Storage objects or URLs.

## World Templates
World templates are reusable presentation/spatial specifications. Versions reference a governed Theme/Theme Version and contain a deterministic World Scene Schema.

## Builder State
Builder state is persistent, user-owned draft state. If attached to a World, the backend verifies current World ownership. Builder state is not itself a World publication and cannot mutate authority.

## Scene safety
The renderer consumes validated JSON schema. Arbitrary code/script fields are rejected. AI may propose scene specifications but cannot directly mutate privileged state.

## Validation
Phase 21 records structural validation, performance validation state, accessibility report and moderation state. Runtime rendering/performance E2E remains a separate verification gate.

## Storage
Only already-owned Storage paths are registered. No fake URLs, synthetic assets or binary uploads are fabricated by this phase.

## API boundary
Web/Admin → FastAPI → Supabase. Browser/Admin clients do not write Theme/World Builder tables directly.
