create or replace function public.create_booth(p_district_id uuid,p_district_zone_id uuid,p_owner_type text,p_owner_id uuid,p_agent_id uuid,p_booth_type text,p_tier text,p_name text,p_slug text,p_description text,p_theme_key text,p_display_config jsonb,p_scene_config jsonb,p_catalog_config jsonb,p_live_entry_config jsonb)
returns public.booths language plpgsql security definer set search_path='' as $$
declare b public.booths; d public.districts; entitlement_user uuid;
begin
 select * into d from public.districts where id=p_district_id and status='active';
 if not found or not private.booth_district_access(p_district_id) then raise exception 'BOOTH_DISTRICT_ACCESS_DENIED'; end if;
 if not private.booth_subject_authorized(p_owner_type,p_owner_id,p_agent_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
 entitlement_user:=case when p_owner_type='user' then p_owner_id when p_owner_type='agent' then (select owner_user_id from public.agents where id=p_agent_id) else null end;
 if p_tier<>'free' and not exists(select 1 from public.district_entitlements e where e.district_id=p_district_id and e.status='active' and (e.starts_at is null or e.starts_at<=timezone('utc',now())) and (e.expires_at is null or e.expires_at>timezone('utc',now())) and ((p_owner_type in ('user','agent') and e.subject_type='user' and e.subject_id=entitlement_user and (e.tier=p_tier or e.tier='enterprise')) or (p_owner_type='organization' and e.subject_type='organization' and e.subject_id=p_owner_id and (e.tier=p_tier or e.tier='enterprise')))) then raise exception 'BOOTH_TIER_NOT_ENTITLED'; end if;
 if d.theme_key is not null and p_theme_key is distinct from d.theme_key then raise exception 'BOOTH_THEME_INCOMPATIBLE'; end if;
 if p_district_zone_id is not null and not exists(select 1 from public.district_zones z where z.id=p_district_zone_id and z.district_id=p_district_id and z.status='active') then raise exception 'BOOTH_ZONE_INVALID'; end if;
 insert into public.booths(owner_user_id,owner_organization_id,agent_id,district_id,district_zone_id,booth_type,tier,name,slug,description,theme_id,theme_key,display_config,scene_config,catalog_config,live_entry_config,status,moderation_status,created_by_user_id,created_at,updated_at)
 values(case when p_owner_type='user' then p_owner_id end,case when p_owner_type='organization' then p_owner_id end,case when p_owner_type='agent' then p_agent_id end,p_district_id,p_district_zone_id,p_booth_type,p_tier,p_name,p_slug,p_description,null,p_theme_key,coalesce(p_display_config,'{}'::jsonb),coalesce(p_scene_config,'{}'::jsonb),coalesce(p_catalog_config,'{}'::jsonb),coalesce(p_live_entry_config,'{}'::jsonb),'draft','pending',auth.uid(),timezone('utc',now()),timezone('utc',now())) returning * into b;
 insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id) values(b.id,'booth_created','user',auth.uid());
 if p_theme_key is not null then insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload) values(b.id,'booth_theme_selected','user',auth.uid(),jsonb_build_object('theme_key',p_theme_key)); end if;
 return b;
end $$;
