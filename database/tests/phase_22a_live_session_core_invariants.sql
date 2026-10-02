-- Phase 22A Live Session Core invariants.
-- Structural tests only: no fake users, Agents, sessions or streams are inserted.

do $$
declare c integer;
begin
  select count(*) into c from information_schema.columns where table_schema='public' and table_name='live_sessions' and column_name in ('experience_template_id','experience_template_version_id','scheduled_at');
  if c <> 3 then raise exception 'LIVE_SESSION_CORE_COLUMNS_MISSING'; end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and tablename='live_sessions' and indexname='live_sessions_template_idx') then raise exception 'LIVE_SESSION_TEMPLATE_INDEX_MISSING'; end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_sessions' and policyname='live_sessions_insert_owner' and cmd='INSERT') then raise exception 'LIVE_SESSION_INSERT_POLICY_MISSING'; end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_sessions' and policyname='live_sessions_update_owner' and cmd='UPDATE') then raise exception 'LIVE_SESSION_UPDATE_POLICY_MISSING'; end if;
  if not exists (select 1 from pg_trigger where tgrelid='public.live_sessions'::regclass and tgname='live_sessions_validate_core' and not tgisinternal) then raise exception 'LIVE_SESSION_CORE_TRIGGER_MISSING'; end if;
  if not exists (select 1 from pg_trigger where tgrelid='public.live_sessions'::regclass and tgname='live_sessions_updated_at' and not tgisinternal) then raise exception 'LIVE_SESSION_UPDATED_AT_TRIGGER_MISSING'; end if;
  select count(*) into c from public.live_sessions;
  if c <> 0 then raise exception 'LIVE_SESSION_TEST_EXPECTS_ZERO_SESSIONS'; end if;
  select count(*) into c from public.live_experience_templates where source='platform' and status='published' and moderation_status='approved';
  if c <> 25 then raise exception 'PLATFORM_LIVE_TEMPLATE_CATALOG_CHANGED'; end if;
  select count(*) into c from public.live_experience_template_versions where status='published' and validation_status='passed' and performance_status='passed' and moderation_status='approved';
  if c <> 25 then raise exception 'PLATFORM_LIVE_TEMPLATE_VERSION_CATALOG_CHANGED'; end if;
end $$;

select (select count(*) from public.live_sessions) as live_sessions,
       (select count(*) from public.live_experience_templates where source='platform' and status='published' and moderation_status='approved') as platform_templates,
       (select count(*) from public.live_experience_template_versions where status='published' and validation_status='passed' and performance_status='passed' and moderation_status='approved') as approved_template_versions;