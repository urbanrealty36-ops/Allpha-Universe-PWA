-- Scoped service-role validator for the canonical platform V3 theme.
-- Does not approve moderation, safety, or publication.
create or replace function public.validate_platform_theme_version_v3(p_theme_version_id uuid)
returns public.theme_versions
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v public.theme_versions;
  safe boolean;
  perf_ok boolean;
  access_ok boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'PLATFORM_THEME_VALIDATION_SERVICE_ROLE_REQUIRED' using errcode = '42501';
  end if;

  select tv.* into v
  from public.theme_versions tv
  join public.themes t on t.id = tv.theme_id
  where tv.id = p_theme_version_id
    and t.slug = 'allpha-universe-v3'
    and t.source = 'platform';

  if not found then
    raise exception 'CANONICAL_PLATFORM_V3_THEME_VERSION_NOT_FOUND' using errcode = 'P0002';
  end if;

  safe := private.theme_tokens_safe(v.tokens)
      and private.scene_schema_safe(v.world_schema)
      and jsonb_typeof(v.component_config) = 'object'
      and jsonb_typeof(v.compatibility) = 'object';
  perf_ok := jsonb_typeof(v.performance_budget) = 'object';
  access_ok := jsonb_typeof(v.accessibility_constraints) = 'object';

  update public.theme_versions
  set validation_status = case when safe then 'passed' else 'failed' end,
      performance_status = case when perf_ok then 'passed' else 'failed' end,
      checksum = md5(v.tokens::text || v.component_config::text || v.world_schema::text || v.compatibility::text),
      status = case when safe and perf_ok and access_ok then 'review' else 'draft' end
  where id = v.id
  returning * into v;

  return v;
end
$function$;

revoke all on function public.validate_platform_theme_version_v3(uuid) from public, anon, authenticated;
grant execute on function public.validate_platform_theme_version_v3(uuid) to service_role;
