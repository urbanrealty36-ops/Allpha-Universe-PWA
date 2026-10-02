-- Phase 21.x Built-in Platform Theme Catalog invariants

do $$
declare
  c integer;
begin
  select count(*) into c from public.themes where source='platform';
  if c <> 25 then raise exception 'Expected 25 platform themes, got %', c; end if;

  select count(*) into c from public.world_templates where source='platform';
  if c <> 25 then raise exception 'Expected 25 platform world templates, got %', c; end if;

  select count(*) into c
  from public.theme_versions v
  join public.themes t on t.id=v.theme_id
  where t.source='platform' and v.version=1 and v.status='published'
    and v.validation_status='passed' and v.performance_status='passed'
    and v.moderation_status='approved';
  if c <> 25 then raise exception 'Expected 25 approved platform theme versions, got %', c; end if;

  select count(*) into c
  from public.world_template_versions v
  join public.world_templates t on t.id=v.world_template_id
  where t.source='platform' and v.version=1 and v.status='published'
    and v.validation_status='passed' and v.performance_status='passed'
    and v.moderation_status='approved';
  if c <> 25 then raise exception 'Expected 25 approved platform world versions, got %', c; end if;

  select count(*) into c
  from public.themes
  where source='platform'
    and (creator_user_id is not null or creator_organization_id is not null or created_by_user_id is not null);
  if c <> 0 then raise exception 'Platform themes must not have creator ownership fields'; end if;

  select count(*) into c
  from public.world_templates
  where source='platform'
    and (creator_user_id is not null or creator_organization_id is not null or created_by_user_id is not null);
  if c <> 0 then raise exception 'Platform templates must not have creator ownership fields'; end if;

  select count(*) into c
  from public.theme_versions v
  join public.themes t on t.id=v.theme_id
  cross join lateral jsonb_object_keys(v.tokens) k(key)
  where t.source='platform' and k.key not like 'theme.%';
  if c <> 0 then raise exception 'Platform theme token namespace violation'; end if;

  select count(*) into c
  from public.theme_versions v
  join public.themes t on t.id=v.theme_id
  where t.source='platform' and not private.scene_schema_safe(v.world_schema);
  if c <> 0 then raise exception 'Platform theme world schema safety violation'; end if;

  select count(*) into c
  from public.world_template_versions v
  join public.world_templates t on t.id=v.world_template_id
  where t.source='platform' and not private.scene_schema_safe(v.world_schema);
  if c <> 0 then raise exception 'Platform world template schema safety violation'; end if;

  select count(*) into c
  from public.theme_versions v
  join public.themes t on t.id=v.theme_id
  where t.source='platform' and (v.theme_id is null or v.version <> 1);
  if c <> 0 then raise exception 'Invalid platform theme version binding'; end if;

  select count(*) into c
  from public.world_template_versions v
  join public.world_templates t on t.id=v.world_template_id
  where t.source='platform' and (v.theme_id is null or v.theme_version_id is null);
  if c <> 0 then raise exception 'Invalid platform world template theme binding'; end if;

  raise notice 'Phase 21.x built-in platform catalog invariants passed: 25 themes + 25 world templates';
end $$;
