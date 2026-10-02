-- Phase 21 continuation hardening — Theme & World Builder runtime lifecycle

create or replace function private.theme_tokens_safe(p_tokens jsonb) returns boolean
language plpgsql immutable set search_path=''
as $$
declare k text;
begin
  if jsonb_typeof(coalesce(p_tokens,'{}'::jsonb)) <> 'object' then return false; end if;
  for k in select jsonb_object_keys(coalesce(p_tokens,'{}'::jsonb)) loop
    if k !~ '^theme\\.' then return false; end if;
    if k ~ '^theme\\.(security|permission|policy|risk|ownership|verification|reputation|audit)(\\.|$)' then return false; end if;
  end loop;
  return true;
end $$;

create or replace function private.scene_schema_safe(p_value jsonb) returns boolean
language plpgsql immutable set search_path=''
as $$
declare e record;
begin
  if p_value is null then return false; end if;
  if jsonb_typeof(p_value)='object' then
    for e in select key,value from jsonb_each(p_value) loop
      if e.key in ('code','script') then return false; end if;
      if e.key ~ '^(security|permission|policy|risk|ownership|verification|reputation|audit)(\\.|$)' then return false; end if;
      if not private.scene_schema_safe(e.value) then return false; end if;
    end loop;
  elsif jsonb_typeof(p_value)='array' then
    for e in select value from jsonb_array_elements(p_value) loop
      if not private.scene_schema_safe(e.value) then return false; end if;
    end loop;
  end if;
  return true;
end $$;

create or replace function public.validate_theme_version(p_theme_version_id uuid)
returns public.theme_versions language plpgsql security definer set search_path=''
as $$
declare v public.theme_versions; safe boolean; perf_ok boolean; access_ok boolean;
begin
  select * into v from public.theme_versions where id=p_theme_version_id;
  if not found or not private.theme_owner(v.theme_id) then raise exception 'THEME_OWNER_DENIED'; end if;
  safe := private.theme_tokens_safe(v.tokens) and private.scene_schema_safe(v.world_schema) and jsonb_typeof(v.component_config)='object' and jsonb_typeof(v.compatibility)='object';
  perf_ok := jsonb_typeof(v.performance_budget)='object';
  access_ok := jsonb_typeof(v.accessibility_constraints)='object';
  update public.theme_versions
  set validation_status=case when safe then 'passed' else 'failed' end,
      performance_status=case when perf_ok then 'passed' else 'failed' end,
      checksum=md5(v.tokens::text||v.component_config::text||v.world_schema::text||v.compatibility::text),
      status=case when safe and perf_ok and access_ok then 'review' else 'draft' end
  where id=v.id returning * into v;
  return v;
end $$;

create or replace function public.create_world_template_version(p_world_template_id uuid,p_theme_id uuid,p_theme_version_id uuid,p_world_schema jsonb,p_builder_schema jsonb)
returns public.world_template_versions language plpgsql security definer set search_path=''
as $$
declare v public.world_template_versions; next_version integer;
begin
  if not private.world_template_owner(p_world_template_id) then raise exception 'WORLD_TEMPLATE_OWNER_DENIED'; end if;
  if p_theme_version_id is not null then
    if p_theme_id is null or not exists(select 1 from public.theme_versions tv where tv.id=p_theme_version_id and tv.theme_id=p_theme_id) then raise exception 'WORLD_TEMPLATE_THEME_VERSION_INVALID'; end if;
    if not exists(select 1 from public.themes t join public.theme_versions tv on tv.theme_id=t.id where tv.id=p_theme_version_id and t.status='published' and t.moderation_status='approved' and tv.status='published' and tv.moderation_status='approved') then raise exception 'WORLD_TEMPLATE_THEME_NOT_PUBLISHED'; end if;
  end if;
  if not private.scene_schema_safe(coalesce(p_world_schema,'{}'::jsonb)) or not private.scene_schema_safe(coalesce(p_builder_schema,'{}'::jsonb)) then raise exception 'WORLD_TEMPLATE_SCHEMA_DENIED'; end if;
  select coalesce(max(version),0)+1 into next_version from public.world_template_versions where world_template_id=p_world_template_id;
  insert into public.world_template_versions(world_template_id,version,theme_id,theme_version_id,world_schema,builder_schema,created_by_user_id)
  values(p_world_template_id,next_version,p_theme_id,p_theme_version_id,coalesce(p_world_schema,'{}'::jsonb),coalesce(p_builder_schema,'{}'::jsonb),auth.uid())
  returning * into v;
  return v;
end $$;

create or replace function public.validate_world_template_version(p_world_template_version_id uuid)
returns public.world_template_versions language plpgsql security definer set search_path=''
as $$
declare v public.world_template_versions; safe boolean; perf_ok boolean;
begin
  select * into v from public.world_template_versions where id=p_world_template_version_id;
  if not found or not private.world_template_owner(v.world_template_id) then raise exception 'WORLD_TEMPLATE_OWNER_DENIED'; end if;
  safe := private.scene_schema_safe(v.world_schema) and private.scene_schema_safe(v.builder_schema);
  perf_ok := jsonb_typeof((select compatibility from public.world_templates where id=v.world_template_id))='object';
  update public.world_template_versions
  set validation_status=case when safe then 'passed' else 'failed' end,
      performance_status=case when perf_ok then 'passed' else 'failed' end,
      checksum=md5(v.world_schema::text||v.builder_schema::text||coalesce(v.theme_version_id::text,'')),
      status=case when safe and perf_ok then 'review' else 'draft' end
  where id=v.id returning * into v;
  return v;
end $$;

create or replace function public.submit_world_template(p_world_template_id uuid)
returns public.world_templates language plpgsql security definer set search_path=''
as $$
declare t public.world_templates;
begin
  if not private.world_template_owner(p_world_template_id) then raise exception 'WORLD_TEMPLATE_OWNER_DENIED'; end if;
  if not exists(select 1 from public.world_template_versions v where v.world_template_id=p_world_template_id and v.status='review' and v.validation_status='passed' and v.performance_status='passed') then raise exception 'WORLD_TEMPLATE_VALID_VERSION_REQUIRED'; end if;
  update public.world_templates set status='review',moderation_status='pending',updated_at=timezone('utc',now()) where id=p_world_template_id returning * into t;
  return t;
end $$;

create or replace function public.publish_world_template(p_world_template_id uuid)
returns public.world_templates language plpgsql security definer set search_path=''
as $$
declare t public.world_templates; v public.world_template_versions;
begin
  if not private.world_template_owner(p_world_template_id) then raise exception 'WORLD_TEMPLATE_OWNER_DENIED'; end if;
  select * into t from public.world_templates where id=p_world_template_id;
  select * into v from public.world_template_versions where world_template_id=t.id and status='review' and validation_status='passed' and performance_status='passed' and moderation_status='approved' order by version desc limit 1;
  if not found or t.moderation_status<>'approved' then raise exception 'WORLD_TEMPLATE_PUBLISH_GATES_NOT_MET'; end if;
  update public.world_templates set status='published',updated_at=timezone('utc',now()) where id=t.id returning * into t;
  update public.world_template_versions set status='published',published_at=timezone('utc',now()) where id=v.id;
  return t;
end $$;

create or replace function public.moderate_theme(p_theme_id uuid,p_theme_version_id uuid,p_decision text)
returns public.theme_versions language plpgsql security definer set search_path=''
as $$
declare v public.theme_versions; d text;
begin
  if not private.has_platform_permission('admin.manage') then raise exception 'THEME_MODERATION_DENIED'; end if;
  d:=lower(trim(p_decision));
  if d not in ('approved','restricted','removed','appealed') then raise exception 'THEME_MODERATION_DECISION_INVALID'; end if;
  select * into v from public.theme_versions where id=p_theme_version_id and theme_id=p_theme_id;
  if not found then raise exception 'THEME_VERSION_NOT_FOUND'; end if;
  update public.theme_versions set moderation_status=d,approved_by_user_id=case when d='approved' then auth.uid() else approved_by_user_id end where id=v.id returning * into v;
  update public.themes set moderation_status=d,updated_at=timezone('utc',now()) where id=p_theme_id;
  return v;
end $$;

create or replace function public.moderate_world_template(p_world_template_id uuid,p_world_template_version_id uuid,p_decision text)
returns public.world_template_versions language plpgsql security definer set search_path=''
as $$
declare v public.world_template_versions; d text;
begin
  if not private.has_platform_permission('admin.manage') then raise exception 'WORLD_TEMPLATE_MODERATION_DENIED'; end if;
  d:=lower(trim(p_decision));
  if d not in ('approved','restricted','removed','appealed') then raise exception 'WORLD_TEMPLATE_MODERATION_DECISION_INVALID'; end if;
  select * into v from public.world_template_versions where id=p_world_template_version_id and world_template_id=p_world_template_id;
  if not found then raise exception 'WORLD_TEMPLATE_VERSION_NOT_FOUND'; end if;
  update public.world_template_versions set moderation_status=d,approved_by_user_id=case when d='approved' then auth.uid() else approved_by_user_id end where id=v.id returning * into v;
  update public.world_templates set moderation_status=d,updated_at=timezone('utc',now()) where id=p_world_template_id;
  return v;
end $$;

do $$ declare r record; begin
  for r in select p.oid::regprocedure as fn from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('validate_world_template_version','submit_world_template','publish_world_template','moderate_theme','moderate_world_template') loop
    execute 'revoke all on function '||r.fn||' from public,anon';
    execute 'grant execute on function '||r.fn||' to authenticated';
  end loop;
end $$;
