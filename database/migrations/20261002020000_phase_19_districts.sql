-- Phase 19 — Districts
-- Depends on Phase 17 AI Universe and Phase 18 Spatial Runtime.
-- Districts are an authorization/isolation boundary between World and Booth/Tenant.

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  owner_type text not null check (owner_type in ('user','agent','organization')),
  owner_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  district_type text not null default 'general' check (district_type in ('general','investor','founder','owner','director','pitching','creator','commerce','event','enterprise','private')),
  visibility text not null default 'public' check (visibility in ('public','restricted','private','enterprise')),
  status text not null default 'draft' check (status in ('draft','active','archived','suspended')),
  theme_key text,
  spatial_config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(world_id,slug)
);

create table if not exists public.district_memberships (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  subject_type text not null check (subject_type in ('user','agent','organization')),
  subject_id uuid not null,
  role text not null default 'member' check (role in ('owner','admin','moderator','member','visitor')),
  status text not null default 'pending' check (status in ('pending','active','suspended','revoked')),
  invited_by_user_id uuid references public.users(id) on delete set null,
  starts_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(district_id,subject_type,subject_id)
);

create table if not exists public.district_entitlements (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  subject_type text not null check (subject_type in ('user','organization')),
  subject_id uuid not null,
  tier text not null check (tier in ('free','standard','creator','business','prime','event','enterprise')),
  entitlement_key text not null,
  status text not null default 'active' check (status in ('active','suspended','expired','revoked')),
  starts_at timestamptz,
  expires_at timestamptz,
  granted_by_user_id uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(district_id,subject_type,subject_id,entitlement_key)
);

create table if not exists public.district_zones (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  zone_key text not null,
  name text not null,
  zone_type text not null default 'public' check (zone_type in ('public','member','restricted','enterprise','private')),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  spatial_config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(district_id,zone_key)
);

create table if not exists public.district_access_requests (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  requester_type text not null check (requester_type in ('user','agent','organization')),
  requester_id uuid not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled','expired')),
  requested_tier text check (requested_tier is null or requested_tier in ('free','standard','creator','business','prime','event','enterprise')),
  reason text,
  decided_by_user_id uuid references public.users(id) on delete set null,
  decided_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.district_activity_events (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  event_type text not null check (event_type in ('district_created','district_published','district_archived','district_suspended','member_joined','member_left','access_requested','access_granted','access_revoked','entitlement_granted','entitlement_revoked','zone_created','policy_changed','enterprise_access_denied','enterprise_access_granted')),
  actor_type text check (actor_type in ('user','agent','organization','system')),
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  correlation_id uuid,
  occurred_at timestamptz not null default timezone('utc',now())
);

create index if not exists districts_world_status_idx on public.districts(world_id,status,updated_at desc);
create index if not exists districts_owner_idx on public.districts(owner_type,owner_id,status);
create index if not exists district_memberships_subject_idx on public.district_memberships(subject_type,subject_id,status);
create index if not exists district_memberships_district_idx on public.district_memberships(district_id,status,role);
create index if not exists district_entitlements_subject_idx on public.district_entitlements(subject_type,subject_id,status,tier);
create index if not exists district_entitlements_district_idx on public.district_entitlements(district_id,status,tier);
create index if not exists district_zones_district_idx on public.district_zones(district_id,status);
create index if not exists district_access_requests_district_idx on public.district_access_requests(district_id,status,created_at desc);
create index if not exists district_access_requests_requester_idx on public.district_access_requests(requester_type,requester_id,status);
create index if not exists district_activity_events_district_idx on public.district_activity_events(district_id,occurred_at desc);

alter table public.districts enable row level security;
alter table public.district_memberships enable row level security;
alter table public.district_entitlements enable row level security;
alter table public.district_zones enable row level security;
alter table public.district_access_requests enable row level security;
alter table public.district_activity_events enable row level security;

-- Existing cross-domain policy/grant tables become owned by the District domain.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='district_access_policies_district_fk') then
    alter table public.district_access_policies add constraint district_access_policies_district_fk foreign key (district_id) references public.districts(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='district_access_grants_district_fk') then
    alter table public.district_access_grants add constraint district_access_grants_district_fk foreign key (district_id) references public.districts(id) on delete cascade;
  end if;
end $$;

create or replace function private.district_subject_user_id(p_subject_type text,p_subject_id uuid)
returns uuid language sql stable security definer set search_path='' as $$
select case
  when p_subject_type='user' and p_subject_id=auth.uid() then p_subject_id
  when p_subject_type='agent' then (select a.owner_user_id from public.agents a where a.id=p_subject_id and a.owner_user_id=auth.uid())
  else null::uuid
end
$$;
revoke all on function private.district_subject_user_id(text,uuid) from public,anon,authenticated;

create or replace function private.district_org_member(p_organization_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.organization_members m where m.organization_id=p_organization_id and m.user_id=auth.uid())
$$;
revoke all on function private.district_org_member(uuid) from public,anon,authenticated;

create or replace function private.district_owner(p_district_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(
  select 1 from public.districts d
  where d.id=p_district_id
    and (
      (d.owner_type='user' and d.owner_id=auth.uid())
      or (d.owner_type='agent' and exists(select 1 from public.agents a where a.id=d.owner_id and a.owner_user_id=auth.uid()))
      or (d.owner_type='organization' and private.district_org_member(d.owner_id))
    )
)
$$;
revoke all on function private.district_owner(uuid) from public,anon,authenticated;

create or replace function private.district_entitlement_active(p_district_id uuid,p_subject_type text,p_subject_id uuid,p_required_tier text)
returns boolean language sql stable security definer set search_path='' as $$
select exists(
  select 1 from public.district_entitlements e
  where e.district_id=p_district_id
    and e.subject_type=p_subject_type
    and e.subject_id=p_subject_id
    and e.status='active'
    and (e.starts_at is null or e.starts_at<=timezone('utc',now()))
    and (e.expires_at is null or e.expires_at>timezone('utc',now()))
    and (
      p_required_tier is null
      or e.tier=p_required_tier
      or (p_required_tier='enterprise' and e.tier='enterprise')
    )
)
$$;
revoke all on function private.district_entitlement_active(uuid,text,uuid,text) from public,anon,authenticated;

create or replace function private.district_explicit_grant(p_district_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(
  select 1 from public.district_access_grants g
  where g.district_id=p_district_id
    and g.status='active'
    and (g.starts_at is null or g.starts_at<=timezone('utc',now()))
    and (g.expires_at is null or g.expires_at>timezone('utc',now()))
    and (
      (g.grant_type in ('user','enterprise') and g.user_id=p_user_id)
      or (g.grant_type='organization' and exists(select 1 from public.organization_members m where m.organization_id=g.organization_id and m.user_id=p_user_id))
    )
)
$$;
revoke all on function private.district_explicit_grant(uuid,uuid) from public,anon,authenticated;

create or replace function private.district_access_allowed(p_district_id uuid,p_user_id uuid default auth.uid())
returns boolean language plpgsql stable security definer set search_path='' as $$
declare d public.districts; p public.district_access_policies; m boolean; ent boolean; grant_ok boolean;
begin
  select * into d from public.districts where id=p_district_id and status='active';
  if not found or p_user_id is null then return false; end if;
  if (d.owner_type='user' and d.owner_id=p_user_id) then return true; end if;
  if d.owner_type='agent' and exists(select 1 from public.agents a where a.id=d.owner_id and a.owner_user_id=p_user_id) then return true; end if;
  if d.owner_type='organization' and exists(select 1 from public.organization_members om where om.organization_id=d.owner_id and om.user_id=p_user_id) then return true; end if;

  select * into p from public.district_access_policies where district_id=d.id and status='active' order by policy_version desc limit 1;
  if not found then return false; end if;

  if p.access_mode='public' then return true; end if;

  m:=exists(select 1 from public.district_memberships dm where dm.district_id=d.id and dm.status='active' and dm.subject_type='user' and dm.subject_id=p_user_id and (dm.expires_at is null or dm.expires_at>timezone('utc',now())));
  if p.access_mode='private' then return m; end if;

  if p.access_mode='organization_only' then
    return exists(select 1 from public.organization_members om where om.user_id=p_user_id and (p.rules ? 'organization_ids') and om.organization_id::text in (select jsonb_array_elements_text(p.rules->'organization_ids')));
  end if;

  if p.access_mode='tier_restricted' then
    return m or private.district_entitlement_active(d.id,'user',p_user_id,p.required_tier);
  end if;

  if p.access_mode='enterprise_only' then
    if p.organization_only and not exists(select 1 from public.organization_members om where om.user_id=p_user_id) then return false; end if;
    ent:=private.district_entitlement_active(d.id,'user',p_user_id,'enterprise')
      or exists(select 1 from public.organization_members om where om.user_id=p_user_id and private.district_entitlement_active(d.id,'organization',om.organization_id,'enterprise'));
    if not ent then return false; end if;
    if p.allowlisted and not private.district_explicit_grant(d.id,p_user_id) then return false; end if;
    if not p.allowlisted and not private.district_explicit_grant(d.id,p_user_id) and p.rules ? 'require_explicit_grant' and (p.rules->>'require_explicit_grant')::boolean then return false; end if;
    return true;
  end if;
  return false;
end
$$;
revoke all on function private.district_access_allowed(uuid,uuid) from public,anon,authenticated;

create policy districts_select on public.districts for select to authenticated using (private.district_access_allowed(id));
create policy district_memberships_select on public.district_memberships for select to authenticated using (private.district_access_allowed(district_id));
create policy district_entitlements_select on public.district_entitlements for select to authenticated using (
  private.district_owner(district_id)
  or (subject_type='user' and subject_id=auth.uid())
  or (subject_type='organization' and private.district_org_member(subject_id))
);
create policy district_zones_select on public.district_zones for select to authenticated using (private.district_access_allowed(district_id));
create policy district_access_requests_select on public.district_access_requests for select to authenticated using (
  private.district_owner(district_id)
  or (requester_type='user' and requester_id=auth.uid())
  or (requester_type='agent' and exists(select 1 from public.agents a where a.id=requester_id and a.owner_user_id=auth.uid()))
  or (requester_type='organization' and private.district_org_member(requester_id))
);
create policy district_activity_events_select on public.district_activity_events for select to authenticated using (private.district_access_allowed(district_id));

revoke all on public.districts,public.district_memberships,public.district_entitlements,public.district_zones,public.district_access_requests,public.district_activity_events from anon,authenticated;
grant select on public.districts,public.district_memberships,public.district_entitlements,public.district_zones,public.district_access_requests,public.district_activity_events to authenticated;

create or replace function public.create_district(p_world_id uuid,p_owner_type text,p_owner_id uuid,p_name text,p_slug text,p_description text,p_district_type text,p_visibility text,p_theme_key text,p_spatial_config jsonb,p_metadata jsonb)
returns public.districts language plpgsql security definer set search_path='' as $$
declare d public.districts; mode text; org_only boolean:=false; allowlisted boolean:=false; rules jsonb:='{}'::jsonb;
begin
 if not exists(select 1 from public.universe_worlds w where w.id=p_world_id and w.status='active') then raise exception 'DISTRICT_WORLD_NOT_ACTIVE'; end if;
 if p_owner_type='user' and p_owner_id<>auth.uid() then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 if p_owner_type='agent' and not exists(select 1 from public.agents a where a.id=p_owner_id and a.owner_user_id=auth.uid()) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 if p_owner_type='organization' and not private.district_org_member(p_owner_id) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 if p_visibility='enterprise' then mode:='enterprise_only'; org_only:=true; allowlisted:=true; rules:=jsonb_build_object('require_explicit_grant',true); elsif p_visibility='private' then mode:='private'; elsif p_visibility='restricted' then mode:='tier_restricted'; else mode:='public'; end if;
 insert into public.districts(world_id,owner_type,owner_id,name,slug,description,district_type,visibility,status,theme_key,spatial_config,metadata,created_by_user_id)
 values(p_world_id,p_owner_type,p_owner_id,p_name,p_slug,p_description,p_district_type,p_visibility,'draft',p_theme_key,coalesce(p_spatial_config,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb),auth.uid()) returning * into d;
 insert into public.district_access_policies(district_id,access_mode,required_tier,organization_only,allowlisted,policy_version,status,rules)
 values(d.id,mode,case when mode='tier_restricted' then 'standard' else null end,org_only,allowlisted,1,'active',rules);
 insert into public.district_activity_events(district_id,event_type,actor_type,actor_id) values(d.id,'district_created','user',auth.uid());
 return d;
end
$$;

create or replace function public.publish_district(p_district_id uuid)
returns public.districts language plpgsql security definer set search_path='' as $$
declare d public.districts;
begin
 if not private.district_owner(p_district_id) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 update public.districts set status='active',updated_at=timezone('utc',now()) where id=p_district_id returning * into d;
 if not found then raise exception 'DISTRICT_NOT_FOUND'; end if;
 insert into public.district_activity_events(district_id,event_type,actor_type,actor_id) values(d.id,'district_published','user',auth.uid());
 return d;
end
$$;

create or replace function public.join_district(p_district_id uuid,p_subject_type text,p_subject_id uuid)
returns public.district_memberships language plpgsql security definer set search_path='' as $$
declare m public.district_memberships; allowed boolean;
begin
 if p_subject_type='user' and p_subject_id<>auth.uid() then raise exception 'DISTRICT_SUBJECT_DENIED'; end if;
 if p_subject_type='agent' and not exists(select 1 from public.agents a where a.id=p_subject_id and a.owner_user_id=auth.uid()) then raise exception 'DISTRICT_SUBJECT_DENIED'; end if;
 if p_subject_type='organization' and not private.district_org_member(p_subject_id) then raise exception 'DISTRICT_SUBJECT_DENIED'; end if;
 allowed:=private.district_access_allowed(p_district_id,auth.uid());
 if not allowed then raise exception 'DISTRICT_ACCESS_DENIED'; end if;
 insert into public.district_memberships(district_id,subject_type,subject_id,role,status,starts_at)
 values(p_district_id,p_subject_type,p_subject_id,'member','active',timezone('utc',now()))
 on conflict(district_id,subject_type,subject_id) do update set status='active',starts_at=excluded.starts_at,updated_at=timezone('utc',now()) returning * into m;
 insert into public.district_activity_events(district_id,event_type,actor_type,actor_id,payload) values(p_district_id,'member_joined',p_subject_type,p_subject_id,jsonb_build_object('role',m.role));
 return m;
end
$$;

create or replace function public.request_district_access(p_district_id uuid,p_requester_type text,p_requester_id uuid,p_requested_tier text,p_reason text,p_metadata jsonb)
returns public.district_access_requests language plpgsql security definer set search_path='' as $$
declare r public.district_access_requests;
begin
 if p_requester_type='user' and p_requester_id<>auth.uid() then raise exception 'DISTRICT_REQUESTER_DENIED'; end if;
 if p_requester_type='agent' and not exists(select 1 from public.agents a where a.id=p_requester_id and a.owner_user_id=auth.uid()) then raise exception 'DISTRICT_REQUESTER_DENIED'; end if;
 if p_requester_type='organization' and not private.district_org_member(p_requester_id) then raise exception 'DISTRICT_REQUESTER_DENIED'; end if;
 insert into public.district_access_requests(district_id,requester_type,requester_id,requested_tier,reason,metadata)
 values(p_district_id,p_requester_type,p_requester_id,p_requested_tier,p_reason,coalesce(p_metadata,'{}'::jsonb)) returning * into r;
 insert into public.district_activity_events(district_id,event_type,actor_type,actor_id,payload) values(p_district_id,'access_requested',p_requester_type,p_requester_id,jsonb_build_object('request_id',r.id));
 return r;
end
$$;

create or replace function public.decide_district_access(p_request_id uuid,p_decision text,p_role text,p_reason text)
returns public.district_access_requests language plpgsql security definer set search_path='' as $$
declare r public.district_access_requests; d public.districts; m public.district_memberships;
begin
 select * into r from public.district_access_requests where id=p_request_id;
 if not found then raise exception 'DISTRICT_REQUEST_NOT_FOUND'; end if;
 if not private.district_owner(r.district_id) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'DISTRICT_DECISION_INVALID'; end if;
 update public.district_access_requests set status=p_decision,decided_by_user_id=auth.uid(),decided_at=timezone('utc',now()),updated_at=timezone('utc',now()),metadata=jsonb_set(metadata,'{decision_reason}',to_jsonb(p_reason),true) where id=r.id returning * into r;
 if p_decision='approved' then
   insert into public.district_memberships(district_id,subject_type,subject_id,role,status,starts_at) values(r.district_id,r.requester_type,r.requester_id,coalesce(p_role,'member'),'active',timezone('utc',now()))
   on conflict(district_id,subject_type,subject_id) do update set status='active',role=excluded.role,updated_at=timezone('utc',now()) returning * into m;
   insert into public.district_activity_events(district_id,event_type,actor_type,actor_id,payload) values(r.district_id,'access_granted','user',auth.uid(),jsonb_build_object('request_id',r.id,'subject_type',r.requester_type,'subject_id',r.requester_id));
 end if;
 return r;
end
$$;

create or replace function public.grant_district_entitlement(p_district_id uuid,p_subject_type text,p_subject_id uuid,p_tier text,p_entitlement_key text,p_starts_at timestamptz,p_expires_at timestamptz,p_metadata jsonb)
returns public.district_entitlements language plpgsql security definer set search_path='' as $$
declare e public.district_entitlements;
begin
 if not private.district_owner(p_district_id) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 if p_subject_type='organization' and not exists(select 1 from public.organizations o where o.id=p_subject_id) then raise exception 'DISTRICT_ORGANIZATION_NOT_FOUND'; end if;
 insert into public.district_entitlements(district_id,subject_type,subject_id,tier,entitlement_key,status,starts_at,expires_at,granted_by_user_id,metadata)
 values(p_district_id,p_subject_type,p_subject_id,p_tier,p_entitlement_key,'active',p_starts_at,p_expires_at,auth.uid(),coalesce(p_metadata,'{}'::jsonb))
 on conflict(district_id,subject_type,subject_id,entitlement_key) do update set tier=excluded.tier,status='active',starts_at=excluded.starts_at,expires_at=excluded.expires_at,granted_by_user_id=auth.uid(),metadata=excluded.metadata,updated_at=timezone('utc',now()) returning * into e;
 insert into public.district_activity_events(district_id,event_type,actor_type,actor_id,payload) values(p_district_id,'entitlement_granted','user',auth.uid(),jsonb_build_object('subject_type',p_subject_type,'subject_id',p_subject_id,'tier',p_tier,'entitlement_key',p_entitlement_key));
 return e;
end
$$;

create or replace function public.revoke_district_entitlement(p_entitlement_id uuid)
returns public.district_entitlements language plpgsql security definer set search_path='' as $$
declare e public.district_entitlements;
begin
 select * into e from public.district_entitlements where id=p_entitlement_id;
 if not found or not private.district_owner(e.district_id) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 update public.district_entitlements set status='revoked',updated_at=timezone('utc',now()) where id=e.id returning * into e;
 insert into public.district_activity_events(district_id,event_type,actor_type,actor_id,payload) values(e.district_id,'entitlement_revoked','user',auth.uid(),jsonb_build_object('entitlement_id',e.id));
 return e;
end
$$;

create or replace function public.create_district_zone(p_district_id uuid,p_zone_key text,p_name text,p_zone_type text,p_spatial_config jsonb,p_metadata jsonb)
returns public.district_zones language plpgsql security definer set search_path='' as $$
declare z public.district_zones;
begin
 if not private.district_owner(p_district_id) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 insert into public.district_zones(district_id,zone_key,name,zone_type,status,spatial_config,metadata) values(p_district_id,p_zone_key,p_name,p_zone_type,'draft',coalesce(p_spatial_config,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb)) returning * into z;
 insert into public.district_activity_events(district_id,event_type,actor_type,actor_id,payload) values(p_district_id,'zone_created','user',auth.uid(),jsonb_build_object('zone_id',z.id,'zone_key',z.zone_key));
 return z;
end
$$;

create or replace function public.activate_district_zone(p_zone_id uuid)
returns public.district_zones language plpgsql security definer set search_path='' as $$
declare z public.district_zones;
begin
 select * into z from public.district_zones where id=p_zone_id;
 if not found or not private.district_owner(z.district_id) then raise exception 'DISTRICT_OWNER_DENIED'; end if;
 update public.district_zones set status='active',updated_at=timezone('utc',now()) where id=z.id returning * into z;
 return z;
end
$$;

do $$
declare r record;
begin
 for r in select p.oid::regprocedure as fn from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('create_district','publish_district','join_district','request_district_access','decide_district_access','grant_district_entitlement','revoke_district_entitlement','create_district_zone','activate_district_zone') loop
   execute 'revoke all on function '||r.fn||' from public,anon';
   execute 'grant execute on function '||r.fn||' to authenticated';
 end loop;
end $$;

revoke all on function private.district_subject_user_id(text,uuid) from public,anon,authenticated;
revoke all on function private.district_org_member(uuid) from public,anon,authenticated;
revoke all on function private.district_owner(uuid) from public,anon,authenticated;
revoke all on function private.district_entitlement_active(uuid,text,uuid,text) from public,anon,authenticated;
revoke all on function private.district_explicit_grant(uuid,uuid) from public,anon,authenticated;
revoke all on function private.district_access_allowed(uuid,uuid) from public,anon,authenticated;

do $$
begin
  begin alter publication supabase_realtime add table public.districts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.district_memberships; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.district_entitlements; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.district_zones; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.district_access_requests; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.district_activity_events; exception when duplicate_object then null; end;
end $$;
