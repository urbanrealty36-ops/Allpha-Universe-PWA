-- Cross-domain foreign-key covering indexes identified by Supabase advisor.
create index if not exists booth_display_slots_asset_idx on public.booth_display_slots(asset_id);
create index if not exists booth_leases_owner_org_idx on public.booth_leases(owner_organization_id);
create index if not exists live_session_overlays_asset_idx on public.live_session_overlays(asset_id);
create index if not exists live_sessions_booth_idx on public.live_sessions(booth_id);
