-- World Engine catalog invariants: no writes.
do $$
declare
  n integer;
  missing integer;
  invalid integer;
begin
  select count(*) into n from public.themes where source='platform';
  if n <> 25 then raise exception 'EXPECTED_25_PLATFORM_THEMES_GOT_%',n; end if;
  select count(*) into n from public.world_templates where source='platform';
  if n <> 25 then raise exception 'EXPECTED_25_PLATFORM_WORLD_TEMPLATES_GOT_%',n; end if;
  select count(*) into n from public.live_experience_templates where source='platform';
  if n <> 25 then raise exception 'EXPECTED_25_PLATFORM_LIVE_TEMPLATES_GOT_%',n; end if;
  select count(*) into missing
  from public.themes t
  left join public.theme_versions v on v.theme_id=t.id and v.status='published'
  where t.source='platform' and v.id is null;
  if missing <> 0 then raise exception 'PLATFORM_THEMES_WITHOUT_PUBLISHED_VERSION_%',missing; end if;
  select count(*) into missing
  from public.world_templates wt
  left join public.world_template_versions wv on wv.world_template_id=wt.id and wv.status='published'
  where wt.source='platform' and wv.id is null;
  if missing <> 0 then raise exception 'PLATFORM_WORLD_TEMPLATES_WITHOUT_PUBLISHED_VERSION_%',missing; end if;
  select count(*) into invalid
  from public.theme_versions v
  join public.themes t on t.id=v.theme_id
  where t.source='platform' and v.status='published'
    and (jsonb_typeof(v.world_schema)<>'object' or v.world_schema ? 'code' or v.world_schema ? 'script');
  if invalid <> 0 then raise exception 'INVALID_PLATFORM_THEME_SCENES_%',invalid; end if;
end $$;
select
  (select count(*) from public.themes where source='platform') as platform_themes,
  (select count(*) from public.world_templates where source='platform') as platform_world_templates,
  (select count(*) from public.live_experience_templates where source='platform') as platform_live_templates,
  (select count(*) from public.theme_assets ta join public.themes t on t.id=ta.theme_id where t.source='platform') as platform_theme_assets,
  (select count(*) from public.booths) as booths,
  (select count(*) from public.districts) as districts;

-- Asset/spatial foundation invariants: read-only.
do $$
declare
  invalid integer;
begin
  select count(*) into invalid
  from public.theme_assets
  where trim(storage_path) = '' or storage_path like 'http://%' or storage_path like 'https://%';
  if invalid <> 0 then raise exception 'THEME_ASSETS_MUST_STORE_PATHS_NOT_URLS_%',invalid; end if;

  select count(*) into invalid
  from public.booth_display_assets
  where trim(storage_path) = '' or storage_path like 'http://%' or storage_path like 'https://%';
  if invalid <> 0 then raise exception 'BOOTH_ASSETS_MUST_STORE_PATHS_NOT_URLS_%',invalid; end if;

  select count(*) into invalid
  from public.districts
  where jsonb_typeof(spatial_config) <> 'object';
  if invalid <> 0 then raise exception 'DISTRICT_SPATIAL_CONFIG_INVALID_%',invalid; end if;

  select count(*) into invalid
  from public.district_zones
  where jsonb_typeof(spatial_config) <> 'object';
  if invalid <> 0 then raise exception 'DISTRICT_ZONE_SPATIAL_CONFIG_INVALID_%',invalid; end if;

  select count(*) into invalid
  from public.booths
  where jsonb_typeof(scene_config) <> 'object'
     or jsonb_typeof(display_config) <> 'object';
  if invalid <> 0 then raise exception 'BOOTH_SPATIAL_CONFIG_INVALID_%',invalid; end if;
end $$;

select
  (select count(*) from public.theme_assets) as theme_assets,
  (select count(*) from public.booth_display_assets) as booth_display_assets,
  (select count(*) from public.booth_display_slots) as booth_display_slots,
  (select count(*) from public.districts) as districts,
  (select count(*) from public.district_zones) as district_zones,
  (select count(*) from public.booths) as booths;
