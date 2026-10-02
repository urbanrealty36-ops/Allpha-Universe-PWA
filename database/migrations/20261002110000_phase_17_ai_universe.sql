-- Phase 17 — AI Universe foundation
create table if not exists public.universe_galaxies (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('platform','user','agent','organization')),
  owner_id uuid,
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  visibility text not null default 'public' check (visibility in ('private','connections','community','public')),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(owner_type,owner_id,slug)
);

create table if not exists public.universe_worlds (
  id uuid primary key default gen_random_uuid(),
  galaxy_id uuid not null references public.universe_galaxies(id) on delete cascade,
  owner_type text not null check (owner_type in ('platform','user','agent','organization')),
  owner_id uuid,
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  world_type text not null default 'social' check (world_type in ('social','interest','community','creator','enterprise','event','private')),
  visibility text not null default 'public' check (visibility in ('private','connections','community','public')),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  theme_key text,
  spatial_config jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(galaxy_id,slug)
);

create table if not exists public.universe_world_memberships (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  subject_type text not null check (subject_type in ('user','agent')),
  subject_id uuid not null,
  role text not null default 'member' check (role in ('owner','host','member','visitor')),
  status text not null default 'active' check (status in ('pending','active','left','removed')),
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(world_id,subject_type,subject_id)
);

create table if not exists public.universe_world_interests (
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  interest_id uuid not null references public.interest_nodes(id) on delete restrict,
  relevance numeric not null default 1 check (relevance >= 0 and relevance <= 1),
  created_at timestamptz not null default timezone('utc',now()),
  primary key(world_id,interest_id)
);

create table if not exists public.universe_world_content (
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete restrict,
  placement text not null default 'feed' check (placement in ('feed','featured','spatial','portal')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc',now()),
  primary key(world_id,content_id,placement)
);

create table if not exists public.universe_world_communities (
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete restrict,
  placement text not null default 'community' check (placement in ('community','featured','portal')),
  created_at timestamptz not null default timezone('utc',now()),
  primary key(world_id,community_id,placement)
);

create table if not exists public.universe_world_agents (
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete restrict,
  presence_role text not null default 'resident' check (presence_role in ('owner','host','resident','visitor')),
  status text not null default 'active' check (status in ('pending','active','left','removed')),
  created_at timestamptz not null default timezone('utc',now()),
  primary key(world_id,agent_id)
);

create table if not exists public.universe_world_portals (
  id uuid primary key default gen_random_uuid(),
  source_world_id uuid not null references public.universe_worlds(id) on delete cascade,
  target_world_id uuid not null references public.universe_worlds(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  access_policy text not null default 'public' check (access_policy in ('public','membership','owner','enterprise')),
  status text not null default 'active' check (status in ('draft','active','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  check(source_world_id <> target_world_id),
  unique(source_world_id,target_world_id,name)
);

create table if not exists public.universe_agent_presences (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete restrict,
  state text not null default 'present' check (state in ('present','exploring','creating','collaborating','negotiating','awaiting_approval','sleeping')),
  activity text,
  context jsonb not null default '{}'::jsonb,
  entered_at timestamptz not null default timezone('utc',now()),
  last_seen_at timestamptz not null default timezone('utc',now()),
  exited_at timestamptz,
  unique(world_id,agent_id)
);

create index if not exists universe_galaxies_owner_idx on public.universe_galaxies(owner_type,owner_id,status);
create index if not exists universe_worlds_galaxy_idx on public.universe_worlds(galaxy_id,status,visibility);
create index if not exists universe_world_memberships_subject_idx on public.universe_world_memberships(subject_type,subject_id,status);
create index if not exists universe_world_interests_interest_idx on public.universe_world_interests(interest_id);
create index if not exists universe_world_content_content_idx on public.universe_world_content(content_id);
create index if not exists universe_world_communities_community_idx on public.universe_world_communities(community_id);
create index if not exists universe_world_agents_agent_idx on public.universe_world_agents(agent_id,status);
create index if not exists universe_world_portals_source_idx on public.universe_world_portals(source_world_id,status);
create index if not exists universe_world_portals_target_idx on public.universe_world_portals(target_world_id,status);
create index if not exists universe_agent_presences_agent_idx on public.universe_agent_presences(agent_id,last_seen_at desc);

alter table public.universe_galaxies enable row level security;
alter table public.universe_worlds enable row level security;
alter table public.universe_world_memberships enable row level security;
alter table public.universe_world_interests enable row level security;
alter table public.universe_world_content enable row level security;
alter table public.universe_world_communities enable row level security;
alter table public.universe_world_agents enable row level security;
alter table public.universe_world_portals enable row level security;
alter table public.universe_agent_presences enable row level security;

create or replace function private.universe_subject_owned(p_type text,p_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select case
 when p_type='user' then p_id=auth.uid()
 when p_type='agent' then exists(select 1 from public.agents a where a.id=p_id and a.owner_user_id=auth.uid())
 else false end
$$;
revoke all on function private.universe_subject_owned(text,uuid) from public,anon,authenticated;

create or replace function private.universe_world_visible(p_world_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(
 select 1 from public.universe_worlds w
 where w.id=p_world_id and (
   w.visibility='public'
   or private.universe_subject_owned(w.owner_type,w.owner_id)
   or exists(select 1 from public.universe_world_memberships m where m.world_id=w.id and ((m.subject_type='user' and m.subject_id=auth.uid()) or (m.subject_type='agent' and exists(select 1 from public.agents a where a.id=m.subject_id and a.owner_user_id=auth.uid()))) and m.status='active')
 )
)
$$;
revoke all on function private.universe_world_visible(uuid) from public,anon,authenticated;

create policy universe_galaxies_select on public.universe_galaxies for select to authenticated using (visibility='public' or private.universe_subject_owned(owner_type,owner_id));
create policy universe_worlds_select on public.universe_worlds for select to authenticated using (private.universe_world_visible(id));
create policy universe_world_memberships_select on public.universe_world_memberships for select to authenticated using ((subject_type='user' and subject_id=auth.uid()) or private.universe_subject_owned((select owner_type from public.universe_worlds w where w.id=world_id),(select owner_id from public.universe_worlds w where w.id=world_id)));
create policy universe_world_interests_select on public.universe_world_interests for select to authenticated using (private.universe_world_visible(world_id));
create policy universe_world_content_select on public.universe_world_content for select to authenticated using (private.universe_world_visible(world_id));
create policy universe_world_communities_select on public.universe_world_communities for select to authenticated using (private.universe_world_visible(world_id));
create policy universe_world_agents_select on public.universe_world_agents for select to authenticated using (private.universe_world_visible(world_id));
create policy universe_world_portals_select on public.universe_world_portals for select to authenticated using (private.universe_world_visible(source_world_id));
create policy universe_agent_presences_select on public.universe_agent_presences for select to authenticated using (private.universe_world_visible(world_id));

revoke all on public.universe_galaxies,public.universe_worlds,public.universe_world_memberships,public.universe_world_interests,public.universe_world_content,public.universe_world_communities,public.universe_world_agents,public.universe_world_portals,public.universe_agent_presences from anon,authenticated;
grant select on public.universe_galaxies,public.universe_worlds,public.universe_world_memberships,public.universe_world_interests,public.universe_world_content,public.universe_world_communities,public.universe_world_agents,public.universe_world_portals,public.universe_agent_presences to authenticated;

create or replace function public.create_universe_galaxy(p_owner_type text,p_owner_id uuid,p_name text,p_slug text,p_description text,p_visibility text,p_metadata jsonb)
returns public.universe_galaxies language plpgsql security definer set search_path='' as $$
declare g public.universe_galaxies;
begin
 if p_owner_type not in ('user','agent') or not private.universe_subject_owned(p_owner_type,p_owner_id) then raise exception 'UNIVERSE_OWNER_DENIED'; end if;
 insert into public.universe_galaxies(owner_type,owner_id,name,slug,description,visibility,metadata) values(p_owner_type,p_owner_id,p_name,p_slug,p_description,p_visibility,coalesce(p_metadata,'{}'::jsonb)) returning * into g;
 return g;
end $$;

create or replace function public.create_universe_world(p_galaxy_id uuid,p_owner_type text,p_owner_id uuid,p_name text,p_slug text,p_description text,p_world_type text,p_visibility text,p_theme_key text,p_spatial_config jsonb,p_metadata jsonb)
returns public.universe_worlds language plpgsql security definer set search_path='' as $$
declare w public.universe_worlds;
begin
 if not private.universe_subject_owned(p_owner_type,p_owner_id) then raise exception 'UNIVERSE_OWNER_DENIED'; end if;
 if not exists(select 1 from public.universe_galaxies g where g.id=p_galaxy_id and private.universe_subject_owned(g.owner_type,g.owner_id)) then raise exception 'UNIVERSE_GALAXY_OWNER_DENIED'; end if;
 insert into public.universe_worlds(galaxy_id,owner_type,owner_id,name,slug,description,world_type,visibility,theme_key,spatial_config,metadata) values(p_galaxy_id,p_owner_type,p_owner_id,p_name,p_slug,p_description,p_world_type,p_visibility,p_theme_key,coalesce(p_spatial_config,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb)) returning * into w;
 return w;
end $$;

create or replace function public.publish_universe_world(p_world_id uuid)
returns public.universe_worlds language plpgsql security definer set search_path='' as $$
declare w public.universe_worlds;
begin
 select * into w from public.universe_worlds where id=p_world_id;
 if not found or not private.universe_subject_owned(w.owner_type,w.owner_id) then raise exception 'UNIVERSE_WORLD_OWNER_DENIED'; end if;
 if not exists(select 1 from public.universe_galaxies g where g.id=w.galaxy_id and g.status='active') then raise exception 'UNIVERSE_GALAXY_NOT_ACTIVE'; end if;
 update public.universe_worlds set status='active',updated_at=timezone('utc',now()) where id=w.id returning * into w;
 return w;
end $$;

create or replace function public.join_universe_world(p_world_id uuid,p_subject_type text,p_subject_id uuid)
returns public.universe_world_memberships language plpgsql security definer set search_path='' as $$
declare m public.universe_world_memberships; w public.universe_worlds; sid uuid;
begin
 select * into w from public.universe_worlds where id=p_world_id and status='active'; if not found then raise exception 'UNIVERSE_WORLD_NOT_ACTIVE'; end if;
 sid=case when p_subject_type='user' then auth.uid() else p_subject_id end;
 if p_subject_type='user' and p_subject_id<>auth.uid() then raise exception 'UNIVERSE_SUBJECT_DENIED'; end if;
 if p_subject_type='agent' and not exists(select 1 from public.agents a where a.id=sid and a.owner_user_id=auth.uid()) then raise exception 'UNIVERSE_AGENT_OWNER_DENIED'; end if;
 insert into public.universe_world_memberships(world_id,subject_type,subject_id,role,status) values(w.id,p_subject_type,sid,'member','active') on conflict(world_id,subject_type,subject_id) do update set status='active',updated_at=timezone('utc',now()) returning * into m;
 return m;
end $$;

create or replace function public.link_universe_world_interest(p_world_id uuid,p_interest_id uuid,p_relevance numeric)
returns public.universe_world_interests language plpgsql security definer set search_path='' as $$
declare x public.universe_world_interests; w public.universe_worlds;
begin
 select * into w from public.universe_worlds where id=p_world_id; if not found or not private.universe_subject_owned(w.owner_type,w.owner_id) then raise exception 'UNIVERSE_WORLD_OWNER_DENIED'; end if;
 if not exists(select 1 from public.interest_nodes i where i.id=p_interest_id and i.status='active') then raise exception 'UNIVERSE_INTEREST_NOT_AVAILABLE'; end if;
 insert into public.universe_world_interests(world_id,interest_id,relevance) values(w.id,p_interest_id,coalesce(p_relevance,1)) on conflict(world_id,interest_id) do update set relevance=excluded.relevance returning * into x;
 return x;
end $$;

create or replace function public.link_universe_world_content(p_world_id uuid,p_content_id uuid,p_placement text,p_sort_order integer)
returns public.universe_world_content language plpgsql security definer set search_path='' as $$
declare x public.universe_world_content; w public.universe_worlds;
begin
 select * into w from public.universe_worlds where id=p_world_id; if not found or not private.universe_subject_owned(w.owner_type,w.owner_id) then raise exception 'UNIVERSE_WORLD_OWNER_DENIED'; end if;
 if not exists(select 1 from public.content_items c where c.id=p_content_id and c.status='published') then raise exception 'UNIVERSE_CONTENT_NOT_PUBLISHED'; end if;
 insert into public.universe_world_content(world_id,content_id,placement,sort_order) values(w.id,p_content_id,p_placement,coalesce(p_sort_order,0)) on conflict(world_id,content_id,placement) do update set sort_order=excluded.sort_order returning * into x;
 return x;
end $$;

create or replace function public.link_universe_world_community(p_world_id uuid,p_community_id uuid,p_placement text)
returns public.universe_world_communities language plpgsql security definer set search_path='' as $$
declare x public.universe_world_communities; w public.universe_worlds;
begin
 select * into w from public.universe_worlds where id=p_world_id; if not found or not private.universe_subject_owned(w.owner_type,w.owner_id) then raise exception 'UNIVERSE_WORLD_OWNER_DENIED'; end if;
 if not exists(select 1 from public.communities c where c.id=p_community_id and c.status='active') then raise exception 'UNIVERSE_COMMUNITY_NOT_ACTIVE'; end if;
 insert into public.universe_world_communities(world_id,community_id,placement) values(w.id,p_community_id,p_placement) on conflict(world_id,community_id,placement) do nothing returning * into x;
 return x;
end $$;

create or replace function public.link_universe_world_agent(p_world_id uuid,p_agent_id uuid,p_presence_role text)
returns public.universe_world_agents language plpgsql security definer set search_path='' as $$
declare x public.universe_world_agents; w public.universe_worlds;
begin
 select * into w from public.universe_worlds where id=p_world_id; if not found or not private.universe_subject_owned(w.owner_type,w.owner_id) then raise exception 'UNIVERSE_WORLD_OWNER_DENIED'; end if;
 if not exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=auth.uid() and a.status='active') then raise exception 'UNIVERSE_AGENT_OWNER_DENIED'; end if;
 insert into public.universe_world_agents(world_id,agent_id,presence_role,status) values(w.id,p_agent_id,p_presence_role,'active') on conflict(world_id,agent_id) do update set presence_role=excluded.presence_role,status='active' returning * into x;
 return x;
end $$;

create or replace function public.create_universe_portal(p_source_world_id uuid,p_target_world_id uuid,p_name text,p_access_policy text,p_metadata jsonb)
returns public.universe_world_portals language plpgsql security definer set search_path='' as $$
declare x public.universe_world_portals; w public.universe_worlds;
begin
 select * into w from public.universe_worlds where id=p_source_world_id; if not found or not private.universe_subject_owned(w.owner_type,w.owner_id) then raise exception 'UNIVERSE_PORTAL_OWNER_DENIED'; end if;
 if not exists(select 1 from public.universe_worlds t where t.id=p_target_world_id and t.status='active') then raise exception 'UNIVERSE_TARGET_WORLD_NOT_ACTIVE'; end if;
 insert into public.universe_world_portals(source_world_id,target_world_id,name,access_policy,metadata) values(p_source_world_id,p_target_world_id,p_name,p_access_policy,coalesce(p_metadata,'{}'::jsonb)) returning * into x;
 return x;
end $$;

create or replace function public.upsert_universe_agent_presence(p_world_id uuid,p_agent_id uuid,p_state text,p_activity text,p_context jsonb)
returns public.universe_agent_presences language plpgsql security definer set search_path='' as $$
declare x public.universe_agent_presences; w public.universe_worlds;
begin
 select * into w from public.universe_worlds where id=p_world_id and status='active'; if not found then raise exception 'UNIVERSE_WORLD_NOT_ACTIVE'; end if;
 if not exists(select 1 from public.universe_world_agents wa join public.agents a on a.id=wa.agent_id where wa.world_id=w.id and wa.agent_id=p_agent_id and wa.status='active' and a.owner_user_id=auth.uid()) then raise exception 'UNIVERSE_AGENT_PRESENCE_DENIED'; end if;
 insert into public.universe_agent_presences(world_id,agent_id,state,activity,context,last_seen_at) values(w.id,p_agent_id,p_state,p_activity,coalesce(p_context,'{}'::jsonb),timezone('utc',now())) on conflict(world_id,agent_id) do update set state=excluded.state,activity=excluded.activity,context=excluded.context,last_seen_at=timezone('utc',now()),exited_at=null returning * into x;
 return x;
end $$;

create or replace function public.exit_universe_agent_presence(p_world_id uuid,p_agent_id uuid)
returns public.universe_agent_presences language plpgsql security definer set search_path='' as $$
declare x public.universe_agent_presences;
begin
 update public.universe_agent_presences p set state='sleeping',exited_at=timezone('utc',now()),last_seen_at=timezone('utc',now()) where p.world_id=p_world_id and p.agent_id=p_agent_id and exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=auth.uid()) returning * into x;
 if not found then raise exception 'UNIVERSE_AGENT_PRESENCE_DENIED'; end if;
 return x;
end $$;

do $$
declare r record;
begin
 for r in select proname,pg_get_function_identity_arguments(oid) args from pg_proc where pronamespace='public'::regnamespace and proname in ('create_universe_galaxy','create_universe_world','publish_universe_world','join_universe_world','link_universe_world_interest','link_universe_world_content','link_universe_world_community','link_universe_world_agent','create_universe_portal','upsert_universe_agent_presence','exit_universe_agent_presence')
 loop
   execute format('revoke all on function public.%I(%s) from public,anon,authenticated',r.proname,r.args);
   execute format('grant execute on function public.%I(%s) to authenticated',r.proname,r.args);
   execute format('alter function public.%I(%s) set search_path=''''',r.proname,r.args);
 end loop;
end $$;
