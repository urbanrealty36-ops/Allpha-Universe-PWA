-- Phase 21 Theme/World binding completion
-- Harden existing World → District → Booth theme references against the
-- canonical published platform Theme catalog. No new engine or authority path.

create or replace function public.create_universe_world(
 p_galaxy_id uuid,p_owner_type text,p_owner_id uuid,p_name text,p_slug text,
 p_description text,p_world_type text,p_visibility text,p_theme_key text,
 p_spatial_config jsonb,p_metadata jsonb
) returns public.universe_worlds
language plpgsql security definer set search_path to ''
as $function$
declare w public.universe_worlds;
begin
 if not private.universe_subject_owned(p_owner_type,p_owner_id) then raise exception 'UNIVERSE_OWNER_DENIED'; end if;
 if not exists(select 1 from public.universe_galaxies g where g.id=p_galaxy_id and private.universe_subject_owned(g.owner_type,g.owner_id)) then raise exception 'UNIVERSE_GALAXY_OWNER_DENIED'; end if;
 if p_theme_key is not null and not exists(
   select 1 from public.themes t where t.source='platform' and t.status='published'
   and (t.catalog_key=p_theme_key or t.slug=p_theme_key)
 ) then raise exception 'UNIVERSE_THEME_NOT_PUBLISHED'; end if;
 insert into public.universe_worlds(galaxy_id,owner_type,owner_id,name,slug,description,world_type,visibility,theme_key,spatial_config,metadata)
 values(p_galaxy_id,p_owner_type,p_owner_id,p_name,p_slug,p_description,p_world_type,p_visibility,p_theme_key,coalesce(p_spatial_config,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb))
 returning * into w;
 return w;
end
$function$;

create or replace function public.create_district(
 p_world_id uuid,p_owner_type text,p_owner_id uuid,p_name text,p_slug text,p_description text,
 p_district_type text,p_visibility text,p_theme_key text,p_spatial_config jsonb,p_metadata jsonb
) returns public.districts
language plpgsql security definer set search_path to ''
as $function$
declare d public.districts; mode text; org_only boolean:=false; allowlisted boolean:=false; rules jsonb:='{}'::jsonb;
begin
 if not exists(select 1 from public.universe_worlds w where w.id=p_world_id and w.status='active') then raise exception 'DISTRICT_WORLD_NOT_ACTIVE'; end if;
 if p_owner_type='user' and p_owner_id<>auth.uid() then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 if p_owner_type='agent' and not exists(select 1 from public.agents a where a.id=p_owner_id and a.owner_user_id=auth.uid()) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 if p_owner_type='organization' and not private.district_org_member(p_owner_id) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 if p_theme_key is not null and not exists(
   select 1 from public.themes t where t.source='platform' and t.status='published'
   and (t.catalog_key=p_theme_key or t.slug=p_theme_key)
 ) then raise exception 'DISTRICT_THEME_NOT_PUBLISHED'; end if;
 if p_visibility='enterprise' then mode:='enterprise_only'; org_only:=true; allowlisted:=true; rules:=jsonb_build_object('require_explicit_grant',true);
 elsif p_visibility='private' then mode:='private';
 elsif p_visibility='restricted' then mode:='tier_restricted';
 else mode:='public'; end if;
 insert into public.districts(world_id,owner_type,owner_id,name,slug,description,district_type,visibility,status,theme_key,spatial_config,metadata,created_by_user_id)
 values(p_world_id,p_owner_type,p_owner_id,p_name,p_slug,p_description,p_district_type,p_visibility,'draft',p_theme_key,coalesce(p_spatial_config,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb),auth.uid()) returning * into d;
 insert into public.district_access_policies(district_id,access_mode,required_tier,organization_only,allowlisted,policy_version,status,rules)
 values(d.id,mode,case when mode='tier_restricted' then 'standard' else null end,org_only,allowlisted,1,'active',rules);
 insert into public.district_activity_events(district_id,event_type,actor_type,actor_id)
 values(d.id,'district_created','user',auth.uid());
 return d;
end
$function$;

create or replace function public.create_booth(
 p_district_id uuid,p_district_zone_id uuid,p_owner_type text,p_owner_id uuid,p_agent_id uuid,
 p_booth_type text,p_tier text,p_name text,p_slug text,p_description text,p_theme_key text,
 p_display_config jsonb,p_scene_config jsonb,p_catalog_config jsonb,p_live_entry_config jsonb
) returns public.booths
language plpgsql security definer set search_path to ''
as $function$
declare b public.booths; d public.districts; entitlement_user uuid; host_agent uuid;
begin
 select * into d from public.districts where id=p_district_id and status='active';
 if not found or not private.booth_district_access(p_district_id) then raise exception 'BOOTH_DISTRICT_ACCESS_DENIED'; end if;
 if not private.booth_subject_authorized(p_owner_type,p_owner_id,p_agent_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 entitlement_user:=case when p_owner_type='user' then p_owner_id when p_owner_type='agent' then (select owner_user_id from public.agents where id=p_agent_id) else null end;
 if p_tier<>'free' and not exists(
   select 1 from public.district_entitlements e
   where e.district_id=p_district_id and e.status='active'
   and (e.starts_at is null or e.starts_at<=timezone('utc',now()))
   and (e.expires_at is null or e.expires_at>timezone('utc',now()))
   and ((p_owner_type in ('user','agent') and e.subject_type='user' and e.subject_id=entitlement_user and (e.tier=p_tier or e.tier='enterprise'))
     or (p_owner_type='organization' and e.subject_type='organization' and e.subject_id=p_owner_id and (e.tier=p_tier or e.tier='enterprise')))
 ) then raise exception 'BOOTH_TIER_NOT_ENTITLED'; end if;
 if p_theme_key is not null and not exists(
   select 1 from public.themes t where t.source='platform' and t.status='published'
   and (t.catalog_key=p_theme_key or t.slug=p_theme_key)
 ) then raise exception 'BOOTH_THEME_NOT_PUBLISHED'; end if;
 if d.theme_key is not null and p_theme_key is distinct from d.theme_key then raise exception 'BOOTH_THEME_INCOMPATIBLE'; end if;
 if p_district_zone_id is not null and not exists(select 1 from public.district_zones z where z.id=p_district_zone_id and z.district_id=p_district_id and z.status='active') then raise exception 'BOOTH_ZONE_INVALID'; end if;
 host_agent := nullif(coalesce(p_scene_config,'{}'::jsonb)->>'host_agent_id','')::uuid;
 if host_agent is not null and not exists(select 1 from public.agents a where a.id=host_agent and a.owner_user_id=auth.uid()) then raise exception 'BOOTH_HOST_AGENT_DENIED'; end if;
 insert into public.booths(
   owner_user_id,owner_organization_id,agent_id,district_id,district_zone_id,booth_type,tier,name,slug,description,theme_id,theme_key,
   display_config,scene_config,catalog_config,live_entry_config,branding_config,portal_config,host_agent_id,status,moderation_status,created_by_user_id,created_at,updated_at
 )
 values(
   case when p_owner_type='user' then p_owner_id end,case when p_owner_type='organization' then p_owner_id end,
   case when p_owner_type='agent' then p_agent_id end,p_district_id,p_district_zone_id,p_booth_type,p_tier,p_name,p_slug,p_description,null,p_theme_key,
   coalesce(p_display_config,'{}'::jsonb),coalesce(p_scene_config,'{}'::jsonb),coalesce(p_catalog_config,'{}'::jsonb),coalesce(p_live_entry_config,'{}'::jsonb),
   coalesce(p_display_config,'{}'::jsonb)->'branding',coalesce(p_live_entry_config,'{}'::jsonb)->'portal',host_agent,'draft','pending',auth.uid(),timezone('utc',now()),timezone('utc',now())
 ) returning * into b;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id) values(b.id,'booth_created','user',auth.uid());
 if p_theme_key is not null then insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload)
 values(b.id,'booth_theme_selected','user',auth.uid(),jsonb_build_object('theme_key',p_theme_key)); end if;
 return b;
end
$function$;
