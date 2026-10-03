-- Phase 20 security/performance consolidation: remove superseded duplicate Booth SELECT policies.
drop policy if exists booths_owner_read on public.booths;
drop policy if exists booth_leases_owner_read on public.booth_leases;
drop policy if exists booth_assets_read on public.booth_display_assets;
drop policy if exists booth_slots_read on public.booth_display_slots;
