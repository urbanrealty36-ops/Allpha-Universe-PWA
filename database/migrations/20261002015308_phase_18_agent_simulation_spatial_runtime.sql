-- Phase 18 — Agent Simulation & Spatial Runtime
-- Depends on Phase 17 AI Universe.

create table if not exists public.agent_spatial_states (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete restrict,
  movement_state text not null default 'idle' check (movement_state in ('idle','moving','exploring','interacting','collaborating','shopping','negotiating','awaiting_approval','sleeping')),
  position jsonb not null default jsonb_build_object('x',0,'y',0,'z',0),
  rotation jsonb not null default jsonb_build_object('x',0,'y',0,'z',0),
  zone_key text,
  target_position jsonb,
  speed numeric not null default 0 check (speed >= 0),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc',now()),
  unique(world_id,agent_id)
);

create table if not exists public.spatial_interactions (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  initiator_type text not null check (initiator_type in ('user','agent')),
  initiator_id uuid not null,
  target_type text not null check (target_type in ('user','agent')),
  target_id uuid not null,
  interaction_type text not null check (interaction_type in ('proximity','conversation','collaboration','shopping','negotiation','handoff','custom')),
  status text not null default 'requested' check (status in ('requested','accepted','declined','completed','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  check (initiator_type <> target_type or initiator_id <> target_id)
);

create table if not exists public.simulation_sessions (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  status text not null default 'stopped' check (status in ('starting','running','paused','stopped','failed')),
  tick_rate_hz numeric not null default 10 check (tick_rate_hz > 0 and tick_rate_hz <= 60),
  current_tick bigint not null default 0 check (current_tick >= 0),
  started_by_user_id uuid references public.users(id) on delete set null,
  started_at timestamptz,
  stopped_at timestamptz,
  last_tick_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create unique index if not exists simulation_sessions_one_live_world_idx on public.simulation_sessions(world_id) where status in ('starting','running','paused');

create table if not exists public.simulation_ticks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.simulation_sessions(id) on delete cascade,
  tick_number bigint not null check (tick_number >= 1),
  started_at timestamptz not null default timezone('utc',now()),
  completed_at timestamptz,
  event_count integer not null default 0 check (event_count >= 0),
  state_hash text,
  metadata jsonb not null default '{}'::jsonb,
  unique(session_id,tick_number)
);

create table if not exists public.spatial_runtime_events (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.universe_worlds(id) on delete cascade,
  session_id uuid references public.simulation_sessions(id) on delete set null,
  event_type text not null check (event_type in ('agent_entered','agent_exited','agent_moved','agent_state_changed','agent_encountered','interaction_requested','interaction_updated','simulation_started','simulation_paused','simulation_resumed','simulation_stopped','simulation_tick','custom')),
  actor_type text check (actor_type in ('user','agent','system')),
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  correlation_id uuid,
  occurred_at timestamptz not null default timezone('utc',now())
);

create index if not exists agent_spatial_states_world_idx on public.agent_spatial_states(world_id,movement_state,updated_at desc);
create index if not exists agent_spatial_states_agent_idx on public.agent_spatial_states(agent_id,updated_at desc);
create index if not exists spatial_interactions_world_idx on public.spatial_interactions(world_id,status,created_at desc);
create index if not exists spatial_interactions_target_idx on public.spatial_interactions(target_type,target_id,status,created_at desc);
create index if not exists simulation_sessions_world_idx on public.simulation_sessions(world_id,updated_at desc);
create index if not exists simulation_ticks_session_idx on public.simulation_ticks(session_id,tick_number desc);
create index if not exists spatial_runtime_events_world_idx on public.spatial_runtime_events(world_id,occurred_at desc);
create index if not exists spatial_runtime_events_correlation_idx on public.spatial_runtime_events(correlation_id) where correlation_id is not null;

alter table public.agent_spatial_states enable row level security;
alter table public.spatial_interactions enable row level security;
alter table public.simulation_sessions enable row level security;
alter table public.simulation_ticks enable row level security;
alter table public.spatial_runtime_events enable row level security;

create or replace function private.spatial_world_owned(p_world_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.universe_worlds w where w.id=p_world_id and private.universe_subject_owned(w.owner_type,w.owner_id))
$$;
revoke all on function private.spatial_world_owned(uuid) from public,anon,authenticated;

create or replace function private.spatial_agent_owned(p_agent_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=auth.uid())
$$;
revoke all on function private.spatial_agent_owned(uuid) from public,anon,authenticated;

create or replace function private.spatial_subject_in_world(p_world_id uuid,p_subject_type text,p_subject_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.universe_world_memberships m where m.world_id=p_world_id and m.subject_type=p_subject_type and m.subject_id=p_subject_id and m.status='active')
or (p_subject_type='agent' and exists(select 1 from public.universe_world_agents wa where wa.world_id=p_world_id and wa.agent_id=p_subject_id and wa.status='active'))
$$;
revoke all on function private.spatial_subject_in_world(uuid,text,uuid) from public,anon,authenticated;

create policy agent_spatial_states_select on public.agent_spatial_states for select to authenticated using (private.universe_world_visible(world_id));
create policy spatial_interactions_select on public.spatial_interactions for select to authenticated using (private.universe_world_visible(world_id) and ((initiator_type='user' and initiator_id=auth.uid()) or (target_type='user' and target_id=auth.uid()) or (initiator_type='agent' and private.spatial_agent_owned(initiator_id)) or (target_type='agent' and private.spatial_agent_owned(target_id)) or private.spatial_world_owned(world_id)));
create policy simulation_sessions_select on public.simulation_sessions for select to authenticated using (private.universe_world_visible(world_id));
create policy simulation_ticks_select on public.simulation_ticks for select to authenticated using (exists(select 1 from public.simulation_sessions s where s.id=session_id and private.universe_world_visible(s.world_id)));
create policy spatial_runtime_events_select on public.spatial_runtime_events for select to authenticated using (private.universe_world_visible(world_id));

revoke all on public.agent_spatial_states,public.spatial_interactions,public.simulation_sessions,public.simulation_ticks,public.spatial_runtime_events from anon,authenticated;
grant select on public.agent_spatial_states,public.spatial_interactions,public.simulation_sessions,public.simulation_ticks,public.spatial_runtime_events to authenticated;

create or replace function public.enter_agent_simulation(p_world_id uuid,p_agent_id uuid,p_position jsonb,p_rotation jsonb,p_zone_key text)
returns public.agent_spatial_states language plpgsql security definer set search_path='' as $$
declare s public.agent_spatial_states;
begin
 if not exists(select 1 from public.universe_worlds w where w.id=p_world_id and w.status='active') then raise exception 'SPATIAL_WORLD_NOT_ACTIVE'; end if;
 if not private.spatial_agent_owned(p_agent_id) then raise exception 'SPATIAL_AGENT_OWNER_DENIED'; end if;
 if not exists(select 1 from public.universe_world_agents wa where wa.world_id=p_world_id and wa.agent_id=p_agent_id and wa.status='active') then raise exception 'SPATIAL_AGENT_NOT_LINKED'; end if;
 insert into public.agent_spatial_states(world_id,agent_id,movement_state,position,rotation,zone_key,updated_at)
 values(p_world_id,p_agent_id,'idle',coalesce(p_position,jsonb_build_object('x',0,'y',0,'z',0)),coalesce(p_rotation,jsonb_build_object('x',0,'y',0,'z',0)),p_zone_key,timezone('utc',now()))
 on conflict(world_id,agent_id) do update set movement_state='idle',position=excluded.position,rotation=excluded.rotation,zone_key=excluded.zone_key,updated_at=timezone('utc',now()) returning * into s;
 perform public.upsert_universe_agent_presence(p_world_id,p_agent_id,'present','spatial_runtime',jsonb_build_object('movement_state','idle'));
 insert into public.spatial_runtime_events(world_id,event_type,actor_type,actor_id,payload) values(p_world_id,'agent_entered','agent',p_agent_id,jsonb_build_object('position',s.position,'zone_key',s.zone_key));
 return s;
end $$;

create or replace function public.update_agent_spatial_state(p_world_id uuid,p_agent_id uuid,p_movement_state text,p_position jsonb,p_rotation jsonb,p_zone_key text,p_target_position jsonb,p_speed numeric,p_metadata jsonb)
returns public.agent_spatial_states language plpgsql security definer set search_path='' as $$
declare s public.agent_spatial_states; old_state text;
begin
 if not private.spatial_agent_owned(p_agent_id) then raise exception 'SPATIAL_AGENT_OWNER_DENIED'; end if;
 select movement_state into old_state from public.agent_spatial_states where world_id=p_world_id and agent_id=p_agent_id;
 if not found then raise exception 'SPATIAL_STATE_NOT_FOUND'; end if;
 update public.agent_spatial_states set movement_state=p_movement_state,position=coalesce(p_position,position),rotation=coalesce(p_rotation,rotation),zone_key=p_zone_key,target_position=p_target_position,speed=coalesce(p_speed,speed),metadata=coalesce(p_metadata,metadata),updated_at=timezone('utc',now()) where world_id=p_world_id and agent_id=p_agent_id returning * into s;
 if old_state is distinct from s.movement_state then insert into public.spatial_runtime_events(world_id,event_type,actor_type,actor_id,payload) values(p_world_id,'agent_state_changed','agent',p_agent_id,jsonb_build_object('from',old_state,'to',s.movement_state)); else insert into public.spatial_runtime_events(world_id,event_type,actor_type,actor_id,payload) values(p_world_id,'agent_moved','agent',p_agent_id,jsonb_build_object('position',s.position,'rotation',s.rotation,'zone_key',s.zone_key)); end if;
 perform public.upsert_universe_agent_presence(p_world_id,p_agent_id,case p_movement_state when 'exploring' then 'exploring' when 'collaborating' then 'collaborating' when 'negotiating' then 'negotiating' when 'awaiting_approval' then 'awaiting_approval' when 'sleeping' then 'sleeping' else 'present' end,'spatial_runtime',jsonb_build_object('movement_state',p_movement_state,'position',s.position,'zone_key',s.zone_key));
 return s;
end $$;

create or replace function public.exit_agent_simulation(p_world_id uuid,p_agent_id uuid)
returns public.agent_spatial_states language plpgsql security definer set search_path='' as $$
declare s public.agent_spatial_states;
begin
 if not private.spatial_agent_owned(p_agent_id) then raise exception 'SPATIAL_AGENT_OWNER_DENIED'; end if;
 update public.agent_spatial_states set movement_state='sleeping',speed=0,target_position=null,updated_at=timezone('utc',now()) where world_id=p_world_id and agent_id=p_agent_id returning * into s;
 if not found then raise exception 'SPATIAL_STATE_NOT_FOUND'; end if;
 perform public.exit_universe_agent_presence(p_world_id,p_agent_id);
 insert into public.spatial_runtime_events(world_id,event_type,actor_type,actor_id) values(p_world_id,'agent_exited','agent',p_agent_id);
 return s;
end $$;

create or replace function public.create_spatial_interaction(p_world_id uuid,p_initiator_type text,p_initiator_id uuid,p_target_type text,p_target_id uuid,p_interaction_type text,p_payload jsonb)
returns public.spatial_interactions language plpgsql security definer set search_path='' as $$
declare x public.spatial_interactions;
begin
 if not private.spatial_subject_in_world(p_world_id,p_initiator_type,p_initiator_id) then raise exception 'SPATIAL_INITIATOR_NOT_IN_WORLD'; end if;
 if not ((p_initiator_type='user' and p_initiator_id=auth.uid()) or (p_initiator_type='agent' and private.spatial_agent_owned(p_initiator_id))) then raise exception 'SPATIAL_INITIATOR_OWNER_DENIED'; end if;
 if not private.spatial_subject_in_world(p_world_id,p_target_type,p_target_id) then raise exception 'SPATIAL_TARGET_NOT_IN_WORLD'; end if;
 insert into public.spatial_interactions(world_id,initiator_type,initiator_id,target_type,target_id,interaction_type,payload) values(p_world_id,p_initiator_type,p_initiator_id,p_target_type,p_target_id,p_interaction_type,coalesce(p_payload,'{}'::jsonb)) returning * into x;
 insert into public.spatial_runtime_events(world_id,event_type,actor_type,actor_id,payload,correlation_id) values(p_world_id,'interaction_requested',p_initiator_type,p_initiator_id,jsonb_build_object('interaction_id',x.id,'target_type',p_target_type,'target_id',p_target_id,'interaction_type',p_interaction_type),x.correlation_id);
 return x;
end $$;

create or replace function public.resolve_spatial_interaction(p_interaction_id uuid,p_status text,p_result jsonb)
returns public.spatial_interactions language plpgsql security definer set search_path='' as $$
declare x public.spatial_interactions;
begin
 select * into x from public.spatial_interactions where id=p_interaction_id;
 if not found then raise exception 'SPATIAL_INTERACTION_NOT_FOUND'; end if;
 if not ((x.target_type='user' and x.target_id=auth.uid()) or (x.target_type='agent' and private.spatial_agent_owned(x.target_id)) or private.spatial_world_owned(x.world_id)) then raise exception 'SPATIAL_INTERACTION_RESOLVE_DENIED'; end if;
 update public.spatial_interactions set status=p_status,result=coalesce(p_result,result),updated_at=timezone('utc',now()) where id=x.id returning * into x;
 insert into public.spatial_runtime_events(world_id,event_type,actor_type,actor_id,payload,correlation_id) values(x.world_id,'interaction_updated',case when x.target_type='agent' then 'agent' else 'user' end,x.target_id,jsonb_build_object('interaction_id',x.id,'status',x.status),x.correlation_id);
 return x;
end $$;

create or replace function public.start_world_simulation(p_world_id uuid,p_tick_rate_hz numeric,p_metadata jsonb)
returns public.simulation_sessions language plpgsql security definer set search_path='' as $$
declare s public.simulation_sessions;
begin
 if not private.spatial_world_owned(p_world_id) then raise exception 'SIMULATION_WORLD_OWNER_DENIED'; end if;
 if not exists(select 1 from public.universe_worlds where id=p_world_id and status='active') then raise exception 'SIMULATION_WORLD_NOT_ACTIVE'; end if;
 if exists(select 1 from public.simulation_sessions where world_id=p_world_id and status in ('starting','running','paused')) then raise exception 'SIMULATION_ALREADY_ACTIVE'; end if;
 insert into public.simulation_sessions(world_id,status,tick_rate_hz,current_tick,started_by_user_id,started_at,metadata) values(p_world_id,'running',coalesce(p_tick_rate_hz,10),0,auth.uid(),timezone('utc',now()),coalesce(p_metadata,'{}'::jsonb)) returning * into s;
 insert into public.spatial_runtime_events(world_id,session_id,event_type,actor_type,actor_id) values(p_world_id,s.id,'simulation_started','user',auth.uid());
 return s;
end $$;

create or replace function public.pause_world_simulation(p_session_id uuid)
returns public.simulation_sessions language plpgsql security definer set search_path='' as $$
declare s public.simulation_sessions;
begin
 select * into s from public.simulation_sessions where id=p_session_id;
 if not found or not private.spatial_world_owned(s.world_id) then raise exception 'SIMULATION_CONTROL_DENIED'; end if;
 if s.status<>'running' then raise exception 'SIMULATION_NOT_RUNNING'; end if;
 update public.simulation_sessions set status='paused',updated_at=timezone('utc',now()) where id=s.id returning * into s;
 insert into public.spatial_runtime_events(world_id,session_id,event_type,actor_type,actor_id) values(s.world_id,s.id,'simulation_paused','user',auth.uid());
 return s;
end $$;

create or replace function public.resume_world_simulation(p_session_id uuid)
returns public.simulation_sessions language plpgsql security definer set search_path='' as $$
declare s public.simulation_sessions;
begin
 select * into s from public.simulation_sessions where id=p_session_id;
 if not found or not private.spatial_world_owned(s.world_id) then raise exception 'SIMULATION_CONTROL_DENIED'; end if;
 if s.status<>'paused' then raise exception 'SIMULATION_NOT_PAUSED'; end if;
 update public.simulation_sessions set status='running',updated_at=timezone('utc',now()) where id=s.id returning * into s;
 insert into public.spatial_runtime_events(world_id,session_id,event_type,actor_type,actor_id) values(s.world_id,s.id,'simulation_resumed','user',auth.uid());
 return s;
end $$;

create or replace function public.stop_world_simulation(p_session_id uuid)
returns public.simulation_sessions language plpgsql security definer set search_path='' as $$
declare s public.simulation_sessions;
begin
 select * into s from public.simulation_sessions where id=p_session_id;
 if not found or not private.spatial_world_owned(s.world_id) then raise exception 'SIMULATION_CONTROL_DENIED'; end if;
 if s.status='stopped' then return s; end if;
 update public.simulation_sessions set status='stopped',stopped_at=timezone('utc',now()),updated_at=timezone('utc',now()) where id=s.id returning * into s;
 insert into public.spatial_runtime_events(world_id,session_id,event_type,actor_type,actor_id) values(s.world_id,s.id,'simulation_stopped','user',auth.uid());
 return s;
end $$;

create or replace function public.record_simulation_tick(p_session_id uuid,p_tick_number bigint,p_event_count integer,p_state_hash text,p_metadata jsonb)
returns public.simulation_ticks language plpgsql security definer set search_path='' as $$
declare t public.simulation_ticks; s public.simulation_sessions;
begin
 select * into s from public.simulation_sessions where id=p_session_id;
 if not found or not private.spatial_world_owned(s.world_id) then raise exception 'SIMULATION_TICK_DENIED'; end if;
 if s.status<>'running' then raise exception 'SIMULATION_NOT_RUNNING'; end if;
 if p_tick_number<>s.current_tick+1 then raise exception 'SIMULATION_TICK_SEQUENCE_INVALID'; end if;
 insert into public.simulation_ticks(session_id,tick_number,completed_at,event_count,state_hash,metadata) values(s.id,p_tick_number,timezone('utc',now()),coalesce(p_event_count,0),p_state_hash,coalesce(p_metadata,'{}'::jsonb)) returning * into t;
 update public.simulation_sessions set current_tick=p_tick_number,last_tick_at=timezone('utc',now()),updated_at=timezone('utc',now()) where id=s.id;
 insert into public.spatial_runtime_events(world_id,session_id,event_type,actor_type,actor_id,payload) values(s.world_id,s.id,'simulation_tick','system',null,jsonb_build_object('tick_number',p_tick_number,'event_count',coalesce(p_event_count,0)));
 return t;
end $$;

do $$
declare r record;
begin
 for r in select proname,pg_get_function_identity_arguments(oid) args from pg_proc where pronamespace='public'::regnamespace and proname in ('enter_agent_simulation','update_agent_spatial_state','exit_agent_simulation','create_spatial_interaction','resolve_spatial_interaction','start_world_simulation','pause_world_simulation','resume_world_simulation','stop_world_simulation','record_simulation_tick')
 loop
   execute format('revoke all on function public.%I(%s) from public,anon,authenticated',r.proname,r.args);
   execute format('grant execute on function public.%I(%s) to authenticated',r.proname,r.args);
   execute format('alter function public.%I(%s) set search_path=''''',r.proname,r.args);
 end loop;
end $$;

alter publication supabase_realtime add table public.agent_spatial_states;
alter publication supabase_realtime add table public.spatial_interactions;
alter publication supabase_realtime add table public.simulation_sessions;
alter publication supabase_realtime add table public.spatial_runtime_events;
