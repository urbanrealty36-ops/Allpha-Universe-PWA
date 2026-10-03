-- Phase 21.5 read-only invariants.
-- No seed data, no Storage writes, no business records.

do $$
begin
  if (select count(*) from public.themes where source='platform' and status='published' and moderation_status='approved') <> 25
    then raise exception 'PLATFORM_THEME_CATALOG_COUNT_NOT_25'; end if;
  if (select count(*) from public.theme_versions tv join public.themes t on t.id=tv.theme_id
      where t.source='platform' and tv.status='published' and tv.moderation_status='approved') <> 25
    then raise exception 'PLATFORM_THEME_VERSION_COUNT_NOT_25'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='theme_assets' and column_name='storage_bucket')
    then raise exception 'MISSING_THEME_ASSET_STORAGE_BUCKET'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='theme_assets' and column_name='content_size_bytes')
    then raise exception 'MISSING_THEME_ASSET_CONTENT_SIZE'; end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='prepare_platform_theme_3d_asset')
    then raise exception 'MISSING_PLATFORM_PREPARE_RPC'; end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='finalize_platform_theme_3d_asset')
    then raise exception 'MISSING_PLATFORM_FINALIZE_RPC'; end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='archive_platform_theme_3d_asset')
    then raise exception 'MISSING_PLATFORM_ARCHIVE_RPC'; end if;
  if has_function_privilege('anon','public.prepare_platform_theme_3d_asset(uuid,text,text,jsonb,integer)','execute')
    then raise exception 'PLATFORM_PREPARE_ANON_EXECUTE_PRESENT'; end if;
  if has_function_privilege('anon','public.finalize_platform_theme_3d_asset(uuid,text)','execute')
    then raise exception 'PLATFORM_FINALIZE_ANON_EXECUTE_PRESENT'; end if;
  if has_function_privilege('anon','public.archive_platform_theme_3d_asset(uuid)','execute')
    then raise exception 'PLATFORM_ARCHIVE_ANON_EXECUTE_PRESENT'; end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='allpha_world_assets_platform_theme_visible_read')
    then raise exception 'MISSING_PLATFORM_THEME_STORAGE_READ_POLICY'; end if;
end $$;

select
  (select count(*) from public.themes where source='platform' and status='published' and moderation_status='approved') as platform_themes,
  (select count(*) from public.theme_versions tv join public.themes t on t.id=tv.theme_id
    where t.source='platform' and tv.status='published' and tv.moderation_status='approved') as platform_theme_versions,
  (select count(*) from public.theme_assets where asset_type in ('3d_scene','model','texture','preview')) as theme_3d_assets,
  (select count(*) from storage.objects where bucket_id='allpha-world-assets') as storage_objects;