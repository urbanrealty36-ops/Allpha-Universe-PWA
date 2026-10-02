# Phase 20 — Booth / Tenant Schema Contract v1.0

## Core tables
Existing cross-domain Booth foundation:
- booths
- booth_leases
- booth_display_assets
- booth_display_slots

Phase 20 adds:
- booth_activity_events
- theme_key / scene_config / catalog_config / live_entry_config / created_by_user_id on booths
- District/Zone foreign-key hardening.

## RPCs
- create_booth
- update_booth
- add_booth_asset
- bind_booth_slot
- submit_booth
- publish_booth
- request_booth_lease
- activate_booth_lease

All mutations are SECURITY DEFINER with empty search_path and execute granted only to authenticated.

## Access
Booth reads require ownership or active approved Booth in an accessible District. Mutations require authoritative ownership. Organization membership and Agent ownership are server checked.

## Asset safety
Asset registration requires an owner-scoped Storage path prefix. Assets start pending and cannot be bound to display slots until active.

## Phase 22
live_entry_config is a declarative integration contract only; no Live runtime is fabricated in Phase 20.
