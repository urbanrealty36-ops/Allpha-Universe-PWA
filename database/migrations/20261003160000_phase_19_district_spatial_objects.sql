-- Phase 19 — District spatial object completion
-- Extends the existing District domain with authoritative spatial objects.
-- No second spatial renderer or runtime engine is introduced.

create table if not exists public.district_spatial_objects (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  zone_id uuid references public.district_zones(id) on delete set null,
  object_type text not null check (object_type in (
    'building','road','coworking','meeting_room','event','marketplace','agent_zone','community_zone'
  )),
  name text not null check (length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  capacity integer check (capacity is null or capacity >= 0),
  availability text not null default 'available' check (availability in ('available','limited','reserved','unavailable')),
  spatial_config jsonb not null default '{}'::jsonb,
  presentation_config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(district_id,slug)
);

create index if not exists idx_district_spatial_objects_district
  on public.district_spatial_objects(district_id, status);
create index if not exists idx_district_spatial_objects_zone
  on public.district_spatial_objects(zone_id, status);

alter table public.district_spatial_objects enable row level security;

create policy district_spatial_objects_select
  on public.district_spatial_objects
  for select to authenticated
  using (private.district_access_allowed(district_id));

create policy district_spatial_objects_insert
  on public.district_spatial_objects
  for insert to authenticated
  with check (private.district_owner(district_id) and created_by_user_id=auth.uid());

create policy district_spatial_objects_update
  on public.district_spatial_objects
  for update to authenticated
  using (private.district_owner(district_id))
  with check (private.district_owner(district_id));

revoke all on public.district_spatial_objects from anon,authenticated;
grant select,insert,update on public.district_spatial_objects to authenticated;

create or replace function public.create_district_spatial_object(
  p_district_id uuid,
  p_zone_id uuid,
  p_object_type text,
  p_name text,
  p_slug text,
  p_capacity integer,
  p_availability text,
  p_spatial_config jsonb,
  p_presentation_config jsonb,
  p_metadata jsonb
)
returns public.district_spatial_objects
language plpgsql
security definer
set search_path=''
as $$
declare o public.district_spatial_objects;
begin
  if not private.district_owner(p_district_id) then
    raise exception 'DISTRICT_OWNER_DENIED';
  end if;
  if p_zone_id is not null and not exists(
    select 1 from public.district_zones z
    where z.id=p_zone_id and z.district_id=p_district_id
  ) then
    raise exception 'DISTRICT_ZONE_MISMATCH';
  end if;
  insert into public.district_spatial_objects(
    district_id,zone_id,object_type,name,slug,status,capacity,availability,
    spatial_config,presentation_config,metadata,created_by_user_id
  )
  values(
    p_district_id,p_zone_id,p_object_type,p_name,p_slug,'draft',p_capacity,
    coalesce(p_availability,'available'),coalesce(p_spatial_config,'{}'::jsonb),
    coalesce(p_presentation_config,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb),auth.uid()
  )
  returning * into o;

  insert into public.district_activity_events(
    district_id,event_type,actor_type,actor_id,payload
  )
  values(
    p_district_id,'spatial_object_created','user',auth.uid(),
    jsonb_build_object('object_id',o.id,'object_type',o.object_type,'zone_id',o.zone_id)
  );
  return o;
end
$$;

create or replace function public.activate_district_spatial_object(p_object_id uuid)
returns public.district_spatial_objects
language plpgsql
security definer
set search_path=''
as $$
declare o public.district_spatial_objects;
begin
  select * into o from public.district_spatial_objects where id=p_object_id;
  if not found or not private.district_owner(o.district_id) then
    raise exception 'DISTRICT_OWNER_DENIED';
  end if;
  update public.district_spatial_objects
  set status='active',updated_at=timezone('utc',now())
  where id=o.id
  returning * into o;

  insert into public.district_activity_events(
    district_id,event_type,actor_type,actor_id,payload
  )
  values(
    o.district_id,'spatial_object_activated','user',auth.uid(),
    jsonb_build_object('object_id',o.id,'object_type',o.object_type)
  );
  return o;
end
$$;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('create_district_spatial_object','activate_district_spatial_object')
  loop
    execute 'revoke all on function '||r.fn||' from public,anon';
    execute 'grant execute on function '||r.fn||' to authenticated';
  end loop;
end
$$;

do $$
begin
  begin alter publication supabase_realtime add table public.district_spatial_objects;
  exception when duplicate_object then null; end;
end
$$;
