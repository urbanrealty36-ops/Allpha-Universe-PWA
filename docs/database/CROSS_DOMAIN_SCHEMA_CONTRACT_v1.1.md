# Cross-Domain Schema Contract v1.1

## Purpose

This document is the canonical schema contract for the cross-domain foundation added for Booth/Tenant, Enterprise District isolation and Story/Live AI Character collaboration.

## Tables

### District access
- district_access_policies
- district_access_grants

### Booth/Tenant
- booths
- booth_leases
- booth_display_assets
- booth_display_slots

### Live / AI Character
- live_sessions
- live_agent_collaborations
- live_character_assets
- live_session_overlays
- live_session_viewers

## Authority rules

- Business mutations occur through FastAPI.
- Supabase PostgreSQL is authoritative.
- RLS is mandatory.
- Ownership is server verified.
- Entitlement is evaluated server-side.
- District access is evaluated through ABAC.
- Theme compatibility is policy evaluated.
- Character assets require moderation/ownership metadata.
- Live Agent collaboration requires explicit owner consent.
- Viewer presence cannot grant authority.
- Client state cannot establish enterprise entitlement.
- No mock or seed records.

## Booth schema semantics

A Booth has exactly one ownership authority: user, organization or Agent whose owner is a Human.

Tier values are logical product tiers. Entitlement and billing engines later determine whether a user may create, publish or operate a given tier.

Booth display assets reference real Storage paths. PPT/presentation support is represented as presentation assets; conversion/rendering belongs to the media/display pipeline, not the database.

## District ABAC semantics

district_access_policies contains policy configuration.

district_access_grants contains explicit grants when configured.

Neither table is a substitute for the future entitlement engine. A grant cannot manufacture an entitlement that the platform policy disallows.

Enterprise access must fail closed.

## Live semantics

live_sessions is the session authority.

live_agent_collaborations binds one Agent to one live session under owner consent and policy.

live_character_assets contains presentation assets.

live_session_overlays binds approved assets to a session and anchor.

live_session_viewers records real authenticated audience presence.

## Realtime

Private/enterprise sessions must use authorization-aware channels. Public broadcast channels cannot be reused for private District state.

Realtime presence is ephemeral and must not become a source of truth for ownership or entitlement.

## Migration

Applied Supabase migration:
20261002040000_cross_domain_booth_district_live_foundation

No domain seed records were inserted.
