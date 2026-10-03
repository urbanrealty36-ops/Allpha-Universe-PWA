-- Phase 21/21.5 — Platform Universe Instance Provisioning
-- Activates the existing platform Theme/World Template catalog as canonical public Universe instances.
-- No user/agent/organization business records are fabricated.

alter table public.districts alter column owner_id drop not null;
alter table public.districts alter column created_by_user_id drop not null;
do $$ begin
  alter table public.districts drop constraint if exists districts_owner_type_check;
  alter table public.districts add constraint districts_owner_type_check check (owner_type in ('platform','user','agent','organization'));
end $$;

alter table public.booths add column if not exists platform_owned boolean not null default false;
alter table public.booths drop constraint if exists booths_check;
alter table public.booths add constraint booths_check check (platform_owned or num_nonnulls(owner_user_id, owner_organization_id, agent_id) = 1);

do $$
declare
  v_galaxy uuid; v_world uuid; v_theme record; v_template record; v_asset record;
  v_zone jsonb; v_district uuid; v_booth uuid; v_component text; v_idx integer;
  v_zone_idx integer; v_slug text; v_zone_type text;
begin
  select id into v_galaxy from public.universe_galaxies where owner_type='platform' and slug='allpha-universe' limit 1;
  if v_galaxy is null then
    insert into public.universe_galaxies(owner_type,owner_id,name,slug,description,visibility,status,metadata)
    values('platform',null,'Allpha Universe','allpha-universe','Canonical platform Universe containing the built-in Allpha Theme Worlds.','public','active',jsonb_build_object('provisioning_source','phase_21_5_platform_theme_catalog','presentation_only',true))
    returning id into v_galaxy;
  else
    update public.universe_galaxies set status='active',visibility='public',updated_at=timezone('utc',now()),metadata=jsonb_build_object('provisioning_source','phase_21_5_platform_theme_catalog','presentation_only',true) where id=v_galaxy;
  end if;

  for v_template in
    select wt.id template_id, wt.name template_name, wt.slug template_slug, wt.catalog_order,
           wtv.id version_id, wtv.world_schema, wtv.theme_id, wtv.theme_version_id
    from public.world_templates wt
    join public.world_template_versions wtv on wtv.world_template_id=wt.id and wtv.status='published'
    where wt.source='platform' and wt.status='published'
    order by wt.catalog_order
  loop
    select t.* into v_theme from public.themes t where t.id=v_template.theme_id and t.source='platform' and t.status='published';
    if v_theme.id is null then continue; end if;
    select ta.* into v_asset from public.theme_assets ta
      where ta.theme_id=v_theme.id and ta.theme_version_id=v_template.theme_version_id
        and ta.asset_type='3d_scene' and ta.status='active' and ta.moderation_status='approved'
        and ta.safety_status='passed' and ta.performance_status='passed'
      order by ta.sort_order limit 1;
    if v_asset.id is null then continue; end if;

    insert into public.universe_worlds(galaxy_id,owner_type,owner_id,name,slug,description,world_type,visibility,status,theme_key,spatial_config,metadata)
    values(v_galaxy,'platform',null,v_template.template_name,v_template.template_slug,
      'Canonical platform World instance generated from the published platform World Template.','social','public','active',v_theme.catalog_key,
      jsonb_build_object('renderer','allpha-3d-progressive','theme_key',v_theme.catalog_key,'theme_id',v_theme.id,'theme_version_id',v_template.theme_version_id,'world_template_id',v_template.template_id,'world_template_version_id',v_template.version_id,'theme_asset_id',v_asset.id,'theme_asset_component','WorldGround','presentation_only',true,'world_schema',v_template.world_schema),
      jsonb_build_object('provisioning_source','phase_21_5_platform_theme_catalog','platform_catalog_order',v_template.catalog_order,'platform_owned',true))
    on conflict (galaxy_id,slug) do update set
      name=excluded.name,description=excluded.description,status='active',visibility='public',theme_key=excluded.theme_key,
      spatial_config=excluded.spatial_config,metadata=excluded.metadata,updated_at=timezone('utc',now())
    returning id into v_world;

    v_idx:=0;
    for v_component in select unnest(array['District_A','District_B','District_C','District_D']) loop
      v_idx:=v_idx+1;
      v_slug:=v_template.template_slug||'-district-'||lower(right(v_component,1));
      insert into public.districts(world_id,owner_type,owner_id,name,slug,description,district_type,visibility,status,theme_key,spatial_config,metadata,created_by_user_id)
      values(v_world,'platform',null,v_template.template_name||' · District '||right(v_component,1),v_slug,
        'Canonical platform District composition node for the published Theme World.','general','public','active',v_theme.catalog_key,
        jsonb_build_object('renderer','allpha-3d-progressive','theme_key',v_theme.catalog_key,'theme_asset_id',v_asset.id,'asset_component',v_component,'district_index',v_idx,'presentation_only',true),
        jsonb_build_object('provisioning_source','phase_21_5_platform_theme_catalog','platform_owned',true,'world_template_version_id',v_template.version_id),null)
      on conflict (world_id,slug) do update set
        owner_type='platform',owner_id=null,visibility='public',status='active',theme_key=excluded.theme_key,
        spatial_config=excluded.spatial_config,metadata=excluded.metadata,created_by_user_id=null,updated_at=timezone('utc',now())
      returning id into v_district;

      update public.district_access_policies set status='archived',updated_at=timezone('utc',now())
      where district_id=v_district and status='active';
      insert into public.district_access_policies(district_id,access_mode,required_tier,organization_only,allowlisted,policy_version,status,rules)
      values(v_district,'public',null,false,false,coalesce((select max(policy_version)+1 from public.district_access_policies where district_id=v_district),1),'active',jsonb_build_object('platform_world',true,'presentation_only',true));

      for v_zone in select value from jsonb_array_elements(coalesce(v_template.world_schema->'zones','[]'::jsonb)) loop
        v_zone_idx:=coalesce((v_zone->>'capacity')::integer,0);
        v_zone_type:='public';
        insert into public.district_zones(district_id,zone_key,name,zone_type,status,spatial_config,metadata)
        values(v_district,v_zone->>'id',
          v_template.template_name||' · District '||right(v_component,1)||' · '||initcap(replace(v_zone->>'id','-',' ')),
          v_zone_type,'active',
          jsonb_build_object('renderer','allpha-3d-progressive','theme_key',v_theme.catalog_key,'asset_component',v_component,'template_zone_id',v_zone->>'id','capacity',v_zone_idx,'presentation_only',true,'booth_anchor',case when v_zone->>'type'='booth' then jsonb_build_object('x',0,'y',0,'z',0) else null end),
          jsonb_build_object('provisioning_source','phase_21_5_platform_theme_catalog','world_template_version_id',v_template.version_id))
        on conflict (district_id,zone_key) do update set
          name=excluded.name,zone_type=excluded.zone_type,status='active',spatial_config=excluded.spatial_config,
          metadata=excluded.metadata,updated_at=timezone('utc',now());
      end loop;

      select id into v_booth from public.booths
      where district_id=v_district and platform_owned=true and slug=v_template.template_slug||'-booth';

      if v_booth is null then
        insert into public.booths(owner_user_id,owner_organization_id,agent_id,district_id,district_zone_id,booth_type,tier,name,slug,description,theme_key,display_config,scene_config,catalog_config,live_entry_config,status,moderation_status,created_by_user_id,branding_config,portal_config,platform_owned)
        select null,null,null,v_district,z.id,'studio','free',
          v_template.template_name||' · Platform Booth',v_template.template_slug||'-booth',
          'Canonical platform Booth template composition.',v_theme.catalog_key,
          jsonb_build_object('renderer','allpha-3d-progressive','presentation_only',true,'theme_asset_id',v_asset.id,'asset_component','BoothTemplate'),
          jsonb_build_object('renderer','allpha-3d-progressive','presentation_only',true,'theme_asset_id',v_asset.id,'asset_component','BoothTemplate','position',jsonb_build_object('x',0,'y',0,'z',0)),
          jsonb_build_object('source','platform_theme_catalog','theme_key',v_theme.catalog_key),
          jsonb_build_object('phase_22_ready',true,'presentation_only',true),
          'active','approved',null,jsonb_build_object('platform',true),jsonb_build_object('presentation_only',true),true
        from public.district_zones z where z.district_id=v_district and z.zone_key='booth' limit 1;
      else
        update public.booths b set district_zone_id=z.id,theme_key=v_theme.catalog_key,status='active',moderation_status='approved',
          platform_owned=true,
          display_config=jsonb_build_object('renderer','allpha-3d-progressive','presentation_only',true,'theme_asset_id',v_asset.id,'asset_component','BoothTemplate'),
          scene_config=jsonb_build_object('renderer','allpha-3d-progressive','presentation_only',true,'theme_asset_id',v_asset.id,'asset_component','BoothTemplate','position',jsonb_build_object('x',0,'y',0,'z',0)),
          catalog_config=jsonb_build_object('source','platform_theme_catalog','theme_key',v_theme.catalog_key),
          live_entry_config=jsonb_build_object('phase_22_ready',true,'presentation_only',true),
          updated_at=timezone('utc',now())
        from public.district_zones z where b.id=v_booth and z.district_id=v_district and z.zone_key='booth';
      end if;
    end loop;
  end loop;
end $$;