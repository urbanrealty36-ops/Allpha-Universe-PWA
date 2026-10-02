-- Phase 20/18 Booth 3D + Spatial Composition invariants.
-- Read-only; must not create business data or Storage objects.

do $$
begin
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='booths' and column_name='scene_config') then raise exception 'MISSING_BOOTH_SCENE_CONFIG'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='district_zones' and column_name='spatial_config') then raise exception 'MISSING_ZONE_SPATIAL_CONFIG'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='agent_spatial_states' and column_name='zone_key') then raise exception 'MISSING_SPATIAL_ZONE_KEY'; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='agent_spatial_states') then raise exception 'SPATIAL_REALTIME_MISSING'; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='booths') then raise exception 'BOOTH_REALTIME_MISSING'; end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='booths' and policyname='booths_select') then raise exception 'BOOTH_RLS_POLICY_MISSING'; end if;
end $$;

select
  (select count(*) from public.districts) as districts,
  (select count(*) from public.district_zones) as zones,
  (select count(*) from public.booths) as booths,
  (select count(*) from public.booth_display_assets where asset_type='3d_scene' and status='active') as active_3d_assets,
  (select count(*) from public.agent_spatial_states) as spatial_states,
  (select count(*) from storage.objects where bucket_id='allpha-world-assets') as storage_objects;
