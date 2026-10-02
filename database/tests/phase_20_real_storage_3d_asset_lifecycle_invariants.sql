-- Phase 20 real Storage 3D asset lifecycle invariants.
-- Read-only assertions; this test must not create Booths, assets, slots or Storage objects.

do $$
begin
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='booth_display_assets' and column_name='storage_bucket') then raise exception 'MISSING_STORAGE_BUCKET_COLUMN'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='booth_display_assets' and column_name='content_size_bytes') then raise exception 'MISSING_CONTENT_SIZE_COLUMN'; end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='prepare_booth_3d_asset') then raise exception 'MISSING_PREPARE_RPC'; end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='finalize_booth_3d_asset') then raise exception 'MISSING_FINALIZE_RPC'; end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='archive_booth_display_asset') then raise exception 'MISSING_ARCHIVE_RPC'; end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='allpha_world_assets_booth_visible_read') then raise exception 'MISSING_STORAGE_READ_POLICY'; end if;
  if not has_function_privilege('authenticated','public.prepare_booth_3d_asset(uuid,text,jsonb)','execute') then raise exception 'PREPARE_AUTH_EXECUTE_MISSING'; end if;
  if has_function_privilege('anon','public.prepare_booth_3d_asset(uuid,text,jsonb)','execute') then raise exception 'PREPARE_ANON_EXECUTE_PRESENT'; end if;
  if has_function_privilege('anon','public.finalize_booth_3d_asset(uuid,text)','execute') then raise exception 'FINALIZE_ANON_EXECUTE_PRESENT'; end if;
  if has_function_privilege('anon','public.archive_booth_display_asset(uuid)','execute') then raise exception 'ARCHIVE_ANON_EXECUTE_PRESENT'; end if;
end $$;

select
  (select count(*) from public.booths) as booths,
  (select count(*) from public.booth_display_assets) as booth_display_assets,
  (select count(*) from public.booth_display_slots) as booth_display_slots,
  (select count(*) from storage.objects where bucket_id='allpha-world-assets') as world_storage_objects;
