-- Phase 22I invariants: AI Character Asset + Animation Contract.
select 1 as assertion where to_regclass('public.live_character_asset_contracts') is not null;
select 1 as assertion where exists(select 1 from information_schema.columns where table_schema='public' and table_name='live_character_assets' and column_name='catalog_character_id');
select 1 as assertion where exists(select 1 from information_schema.columns where table_schema='public' and table_name='live_character_assets' and column_name='asset_source');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='list_live_character_runtime_catalog');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='private'::regnamespace and proname='select_live_character');
select 1 as assertion where has_function_privilege('anon','public.select_live_character(uuid,uuid,uuid,jsonb)','execute')=false;
select 1 as assertion where has_function_privilege('authenticated','public.select_live_character(uuid,uuid,uuid,jsonb)','execute');
select 1 as assertion where has_function_privilege('anon','public.list_live_character_runtime_catalog(uuid)','execute')=false;
select 1 as assertion where has_function_privilege('authenticated','public.list_live_character_runtime_catalog(uuid)','execute');
select 1 as assertion where (select count(*) from public.agent_character_catalog where enabled=true) = (select count(*) from public.live_character_assets where asset_source='platform_catalog' and status='active' and moderation_status='approved');
select 1 as assertion where (select count(*) from public.live_character_assets where asset_source='platform_catalog') = (select count(*) from public.live_character_asset_contracts where status='active');
select 1 as assertion where not exists(select 1 from public.live_session_character_bindings);
select 1 as assertion where exists(select 1 from public.uniform_catalog where status='published' and moderation_status='approved');
select 1 as assertion where exists(select 1 from public.uniform_catalog where status='published' and moderation_status='approved' and storage_path is null);
