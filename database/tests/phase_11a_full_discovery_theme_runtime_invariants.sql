-- Phase 11A Full Discovery / Theme Runtime invariants
-- Read-only assertions. This test must not seed or mutate business data.

DO $$
DECLARE
  theme_count integer;
  version_count integer;
  renderer_count integer;
  invalid_authority_count integer;
  invalid_performance_count integer;
  invalid_accessibility_count integer;
BEGIN
  SELECT count(*)
    INTO theme_count
    FROM public.themes
   WHERE source = 'platform'
     AND status = 'published';

  IF theme_count <> 25 THEN
    RAISE EXCEPTION 'Expected 25 published platform themes, found %', theme_count;
  END IF;

  SELECT count(*)
    INTO version_count
    FROM public.theme_versions tv
    JOIN public.themes t ON t.id = tv.theme_id
   WHERE t.source = 'platform'
     AND t.status = 'published'
     AND tv.status = 'published'
     AND tv.version = 1;

  IF version_count <> 25 THEN
    RAISE EXCEPTION 'Expected 25 published v1 theme versions, found %', version_count;
  END IF;

  SELECT count(*)
    INTO renderer_count
    FROM public.theme_versions tv
    JOIN public.themes t ON t.id = tv.theme_id
   WHERE t.source = 'platform'
     AND t.status = 'published'
     AND tv.status = 'published'
     AND tv.world_schema ->> 'renderer' = 'allpha-3d-progressive';

  IF renderer_count <> 25 THEN
    RAISE EXCEPTION 'Expected all 25 published themes to use allpha-3d-progressive renderer, found %', renderer_count;
  END IF;

  SELECT count(*)
    INTO invalid_authority_count
    FROM public.theme_versions tv
    JOIN public.themes t ON t.id = tv.theme_id
   WHERE t.source = 'platform'
     AND t.status = 'published'
     AND tv.status = 'published'
     AND coalesce(tv.world_schema -> 'authority_boundary' ->> 'presentation_only', 'false') <> 'true';

  IF invalid_authority_count <> 0 THEN
    RAISE EXCEPTION 'Found % published theme versions without presentation-only authority boundary', invalid_authority_count;
  END IF;

  SELECT count(*)
    INTO invalid_performance_count
    FROM public.theme_versions tv
    JOIN public.themes t ON t.id = tv.theme_id
   WHERE t.source = 'platform'
     AND t.status = 'published'
     AND tv.status = 'published'
     AND (
       coalesce(tv.performance_budget ->> 'lod', '') <> 'required'
       OR coalesce((tv.performance_budget ->> 'mobile_fps')::integer, 0) < 30
       OR coalesce((tv.performance_budget ->> 'target_fps')::integer, 0) < 60
     );

  IF invalid_performance_count <> 0 THEN
    RAISE EXCEPTION 'Found % published theme versions with invalid performance budget', invalid_performance_count;
  END IF;

  SELECT count(*)
    INTO invalid_accessibility_count
    FROM public.theme_versions tv
    JOIN public.themes t ON t.id = tv.theme_id
   WHERE t.source = 'platform'
     AND t.status = 'published'
     AND tv.status = 'published'
     AND NOT (
       coalesce((tv.accessibility_constraints ->> 'high_contrast')::boolean, false)
       AND coalesce((tv.accessibility_constraints ->> 'reduced_motion')::boolean, false)
       AND coalesce((tv.accessibility_constraints ->> 'subtitle_safe_area')::boolean, false)
       AND coalesce((tv.accessibility_constraints ->> 'color_independent_state')::boolean, false)
     );

  IF invalid_accessibility_count <> 0 THEN
    RAISE EXCEPTION 'Found % published theme versions without required accessibility constraints', invalid_accessibility_count;
  END IF;

  RAISE NOTICE 'Phase 11A theme runtime invariants passed: 25 themes, 25 v1 versions, progressive renderer, authority, performance and accessibility contracts.';
END $$;
