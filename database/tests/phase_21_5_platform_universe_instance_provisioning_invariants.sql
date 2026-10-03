-- Phase 21/21.5 — Platform Universe Instance Provisioning invariants
select plan(8);
select is((select count(*)::int from public.universe_galaxies where owner_type='platform' and slug='allpha-universe'),1,'canonical platform galaxy exists');
select is((select count(*)::int from public.universe_worlds where owner_type='platform' and status='active' and visibility='public'),25,'25 platform worlds are active/public');
select is((select count(*)::int from public.districts where owner_type='platform' and status='active' and visibility='public'),100,'4 platform districts per world are provisioned');
select is((select count(*)::int from public.district_zones z join public.districts d on d.id=z.district_id where d.owner_type='platform' and z.status='active'),400,'4 active zones per platform district are provisioned');
select is((select count(*)::int from public.booths where platform_owned and status='active' and moderation_status='approved'),100,'1 approved platform booth per platform district is provisioned');
select is((select count(*)::int from public.universe_worlds w join public.themes t on t.catalog_key=w.theme_key and t.source='platform' and t.status='published'),25,'every platform world binds to a published platform theme');
select is((select count(*)::int from public.booths b join public.themes t on t.catalog_key=b.theme_key and t.source='platform' join public.theme_assets a on a.theme_id=t.id and a.asset_type='3d_scene' and a.status='active' and a.moderation_status='approved' and a.safety_status='passed' and a.performance_status='passed' where b.platform_owned),100,'every platform booth resolves a verified theme 3D asset');
select is((select count(*)::int from public.districts where owner_type='platform' and owner_id is null and created_by_user_id is null),100,'platform districts have no fabricated user ownership');
select * from finish();