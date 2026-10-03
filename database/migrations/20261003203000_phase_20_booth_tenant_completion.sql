-- Phase 20 completion: Booth builder metadata + tenant lease hardening.
-- Keeps Booth as the canonical spatial tenant. No duplicate commerce/live/review engines.

alter table public.booths
  add column if not exists branding_config jsonb not null default '{}'::jsonb,
  add column if not exists portal_config jsonb not null default '{}'::jsonb,
  add column if not exists host_agent_id uuid references public.agents(id) on delete set null;

create index if not exists booths_host_agent_idx
  on public.booths(host_agent_id)
  where host_agent_id is not null;

alter table public.booth_leases
  drop constraint if exists booth_leases_traffic_score_check;
alter table public.booth_leases
  add constraint booth_leases_traffic_score_check
  check (traffic_score is null or (traffic_score >= 0 and traffic_score <= 100));

create unique index if not exists booth_leases_one_active_per_booth_idx
  on public.booth_leases(booth_id)
  where status='active';

create or replace function public.create_booth(
  p_district_id uuid,p_district_zone_id uuid,p_owner_type text,p_owner_id uuid,
  p_agent_id uuid,p_booth_type text,p_tier text,p_name text,p_slug text,
  p_description text,p_theme_key text,p_display_config jsonb,p_scene_config jsonb,
  p_catalog_config jsonb,p_live_entry_config jsonb
)
returns public.booths language plpgsql security definer set search_path='' as $$
declare
  b public.booths; d public.districts; entitlement_user uuid;
  host_agent uuid;
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
  if d.theme_key is not null and p_theme_key is distinct from d.theme_key then raise exception 'BOOTH_THEME_INCOMPATIBLE'; end if;
  if p_district_zone_id is not null and not exists(select 1 from public.district_zones z where z.id=p_district_zone_id and z.district_id=p_district_id and z.status='active') then raise exception 'BOOTH_ZONE_INVALID'; end if;
  host_agent:=nullif(coalesce(p_scene_config,'{}'::jsonb)->>'host_agent_id','')::uuid;
  if host_agent is not null and not exists(select 1 from public.agents a where a.id=host_agent and a.owner_user_id=auth.uid()) then raise exception 'BOOTH_HOST_AGENT_DENIED'; end if;
  insert into public.booths(
    owner_user_id,owner_organization_id,agent_id,district_id,district_zone_id,
    booth_type,tier,name,slug,description,theme_id,theme_key,display_config,
    scene_config,catalog_config,live_entry_config,branding_config,portal_config,
    host_agent_id,status,moderation_status,created_by_user_id,created_at,updated_at
  )
  values(
    case when p_owner_type='user' then p_owner_id end,
    case when p_owner_type='organization' then p_owner_id end,
    case when p_owner_type='agent' then p_agent_id end,
    p_district_id,p_district_zone_id,p_booth_type,p_tier,p_name,p_slug,p_description,
    null,p_theme_key,coalesce(p_display_config,'{}'::jsonb),coalesce(p_scene_config,'{}'::jsonb),
    coalesce(p_catalog_config,'{}'::jsonb),coalesce(p_live_entry_config,'{}'::jsonb),
    coalesce(p_display_config,'{}'::jsonb)->'branding',
    coalesce(p_live_entry_config,'{}'::jsonb)->'portal',host_agent,
    'draft','pending',auth.uid(),timezone('utc',now()),timezone('utc',now())
  ) returning * into b;
  insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id) values(b.id,'booth_created','user',auth.uid());
  if p_theme_key is not null then
    insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload)
    values(b.id,'booth_theme_selected','user',auth.uid(),jsonb_build_object('theme_key',p_theme_key));
  end if;
  return b;
end $$;

create or replace function public.update_booth(
  p_booth_id uuid,p_name text,p_description text,p_theme_key text,
  p_display_config jsonb,p_scene_config jsonb,p_catalog_config jsonb,p_live_entry_config jsonb
)
returns public.booths language plpgsql security definer set search_path='' as $$
declare b public.booths; d public.districts; host_agent uuid;
begin
  if not private.booth_owner(p_booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
  select d.* into d from public.districts d join public.booths x on x.district_id=d.id where x.id=p_booth_id;
  if d.theme_key is not null and p_theme_key is distinct from d.theme_key then raise exception 'BOOTH_THEME_INCOMPATIBLE'; end if;
  host_agent:=nullif(coalesce(p_scene_config,'{}'::jsonb)->>'host_agent_id','')::uuid;
  if host_agent is not null and not exists(select 1 from public.agents a where a.id=host_agent and a.owner_user_id=auth.uid()) then raise exception 'BOOTH_HOST_AGENT_DENIED'; end if;
  update public.booths set
    name=p_name,description=p_description,theme_key=p_theme_key,
    display_config=coalesce(p_display_config,display_config),
    scene_config=coalesce(p_scene_config,scene_config),
    catalog_config=coalesce(p_catalog_config,catalog_config),
    live_entry_config=coalesce(p_live_entry_config,live_entry_config),
    branding_config=coalesce(p_display_config,'{}'::jsonb)->'branding',
    portal_config=coalesce(p_live_entry_config,'{}'::jsonb)->'portal',
    host_agent_id=host_agent,updated_at=timezone('utc',now())
  where id=p_booth_id returning * into b;
  insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id) values(b.id,'booth_updated','user',auth.uid());
  return b;
end $$;

create or replace function public.request_booth_lease(
  p_booth_id uuid,p_tier text,p_size_class text,p_visibility_class text,
  p_price_amount numeric,p_currency text,p_billing_cycle text,
  p_starts_at timestamptz,p_ends_at timestamptz,p_metadata jsonb
)
returns public.booth_leases language plpgsql security definer set search_path='' as $$
declare b public.booths; l public.booth_leases; traffic numeric;
begin
  if not private.booth_owner(p_booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
  select * into b from public.booths where id=p_booth_id;
  if not found then raise exception 'BOOTH_NOT_FOUND'; end if;
  if b.tier<>p_tier then raise exception 'BOOTH_LEASE_TIER_MISMATCH'; end if;
  if p_ends_at is not null and p_ends_at<=p_starts_at then raise exception 'BOOTH_LEASE_DATES_INVALID'; end if;
  traffic:=nullif(coalesce(p_metadata,'{}'::jsonb)->>'traffic_score','')::numeric;
  if traffic is not null and (traffic<0 or traffic>100) then raise exception 'BOOTH_LEASE_TRAFFIC_SCORE_INVALID'; end if;
  if exists(
    select 1 from public.booth_leases x where x.booth_id=b.id and x.status in ('pending','active')
      and x.starts_at <= coalesce(p_ends_at,'infinity'::timestamptz)
      and coalesce(x.ends_at,'infinity'::timestamptz) >= p_starts_at
  ) then raise exception 'BOOTH_LEASE_OVERLAP'; end if;
  insert into public.booth_leases(
    booth_id,owner_user_id,owner_organization_id,tier,size_class,visibility_class,
    traffic_score,price_amount,currency,billing_cycle,starts_at,ends_at,status,
    entitlement_snapshot,metadata
  )
  values(
    b.id,b.owner_user_id,b.owner_organization_id,b.tier,p_size_class,p_visibility_class,
    traffic,p_price_amount,p_currency,p_billing_cycle,p_starts_at,p_ends_at,'pending',
    jsonb_build_object('booth_tier',b.tier,'district_id',b.district_id,'zone_id',b.district_zone_id),
    coalesce(p_metadata,'{}'::jsonb)
  ) returning * into l;
  insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload)
  values(b.id,'booth_lease_requested','user',auth.uid(),jsonb_build_object('lease_id',l.id,'traffic_score',l.traffic_score));
  return l;
end $$;

revoke all on function public.create_booth(uuid,uuid,text,uuid,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.create_booth(uuid,uuid,text,uuid,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,jsonb) to authenticated;
revoke all on function public.update_booth(uuid,text,text,text,jsonb,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.update_booth(uuid,text,text,text,jsonb,jsonb,jsonb,jsonb) to authenticated;
revoke all on function public.request_booth_lease(uuid,text,text,text,numeric,text,text,timestamptz,timestamptz,jsonb) from public,anon;
grant execute on function public.request_booth_lease(uuid,text,text,text,numeric,text,text,timestamptz,timestamptz,jsonb) to authenticated;

alter table public.booths enable row level security;
alter table public.booth_leases enable row level security;
