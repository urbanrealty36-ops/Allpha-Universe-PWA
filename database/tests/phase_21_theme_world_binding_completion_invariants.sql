-- Phase 21 Theme/World binding completion invariants
-- Business records may remain empty; platform catalog/assets are product configuration.

-- 1. Every published platform Theme has a canonical catalog key.
select count(*) = 25 as ok
from public.themes
where source='platform' and status='published' and catalog_key is not null;

-- 2. Every published platform Theme has exactly one active verified 3D asset.
select count(*) = 25 as ok
from public.themes t
where t.source='platform'
  and t.status='published'
  and (
    select count(*)
    from public.theme_assets a
    where a.theme_id=t.id
      and a.asset_type='3d_scene'
      and a.status='active'
      and a.moderation_status='approved'
      and a.safety_status='passed'
      and a.performance_status='passed'
  ) = 1;

-- 3. Every verified Theme 3D asset has a real Storage object.
select count(*) = 25 as ok
from public.theme_assets a
join public.themes t on t.id=a.theme_id and t.source='platform'
join storage.objects o on o.bucket_id=a.storage_bucket and o.name=a.storage_path
where a.asset_type='3d_scene'
  and a.status='active'
  and a.moderation_status='approved'
  and a.safety_status='passed'
  and a.performance_status='passed';

-- 4. No business World/District/Booth rows are required for catalog readiness.
select
  (select count(*) from public.universe_worlds) as worlds,
  (select count(*) from public.districts) as districts,
  (select count(*) from public.booths) as booths;
