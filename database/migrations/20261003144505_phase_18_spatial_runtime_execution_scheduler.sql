create extension if not exists pg_cron;

create or replace function private.upsert_universe_agent_presence_runtime(
  p_world_id uuid, p_agent_id uuid, p_state text, p_activity text, p_context jsonb
)
returns public.universe_agent_presences
language plpgsql
security definer
set search_path to ''
as $function$
declare
  x public.universe_agent_presences;
  w public.universe_worlds;
begin
  select * into w from public.universe_worlds where id = p_world_id and status = 'active';
  if not found then raise exception 'UNIVERSE_WORLD_NOT_ACTIVE'; end if;
  if not exists (
    select 1 from public.universe_world_agents wa
    join public.agents a on a.id = wa.agent_id
    where wa.world_id = w.id and wa.agent_id = p_agent_id and wa.status = 'active'
  ) then raise exception 'UNIVERSE_AGENT_PRESENCE_DENIED'; end if;
  insert into public.universe_agent_presences(world_id,agent_id,state,activity,context,last_seen_at)
  values(w.id,p_agent_id,p_state,p_activity,coalesce(p_context,'{}'::jsonb),timezone('utc',now()))
  on conflict(world_id,agent_id) do update set
    state=excluded.state, activity=excluded.activity, context=excluded.context,
    last_seen_at=timezone('utc',now()), exited_at=null
  returning * into x;
  return x;
end
$function$;

revoke all on function private.upsert_universe_agent_presence_runtime(uuid,uuid,text,text,jsonb)
from public, anon, authenticated;

create or replace function private.advance_world_simulation_tick_internal(p_session_id uuid)
returns public.simulation_ticks
language plpgsql
security definer
set search_path to ''
as $function$
declare
  s public.simulation_sessions;
  t public.simulation_ticks;
  state_row public.agent_spatial_states;
  next_tick bigint;
  step_distance numeric;
  dx numeric; dy numeric; dz numeric; distance numeric;
  nx numeric; ny numeric; nz numeric;
  changed_count integer := 0;
begin
  select * into s from public.simulation_sessions where id = p_session_id for update;
  if not found then raise exception 'SIMULATION_NOT_FOUND'; end if;
  if s.status <> 'running' then raise exception 'SIMULATION_NOT_RUNNING'; end if;
  next_tick := s.current_tick + 1;

  for state_row in
    select * from public.agent_spatial_states
    where world_id = s.world_id order by agent_id for update
  loop
    if state_row.movement_state = 'moving'
       and state_row.target_position is not null
       and jsonb_typeof(state_row.target_position) = 'object'
       and state_row.target_position ? 'x'
       and state_row.target_position ? 'y'
       and state_row.target_position ? 'z'
       and state_row.speed > 0
    then
      dx := (state_row.target_position->>'x')::numeric - (state_row.position->>'x')::numeric;
      dy := (state_row.target_position->>'y')::numeric - (state_row.position->>'y')::numeric;
      dz := (state_row.target_position->>'z')::numeric - (state_row.position->>'z')::numeric;
      distance := sqrt((dx * dx) + (dy * dy) + (dz * dz));
      step_distance := state_row.speed / s.tick_rate_hz;

      if distance <= step_distance or distance = 0 then
        nx := (state_row.target_position->>'x')::numeric;
        ny := (state_row.target_position->>'y')::numeric;
        nz := (state_row.target_position->>'z')::numeric;
        update public.agent_spatial_states
        set position=jsonb_build_object('x',nx,'y',ny,'z',nz), movement_state='idle',
            target_position=null, speed=0, updated_at=timezone('utc',now())
        where id=state_row.id;
        perform private.upsert_universe_agent_presence_runtime(
          s.world_id,state_row.agent_id,'present','spatial_runtime',
          jsonb_build_object('movement_state','idle','position',jsonb_build_object('x',nx,'y',ny,'z',nz),'zone_key',state_row.zone_key)
        );
        changed_count := changed_count + 1;
      else
        nx := (state_row.position->>'x')::numeric + (dx / distance) * step_distance;
        ny := (state_row.position->>'y')::numeric + (dy / distance) * step_distance;
        nz := (state_row.position->>'z')::numeric + (dz / distance) * step_distance;
        update public.agent_spatial_states
        set position=jsonb_build_object('x',nx,'y',ny,'z',nz), updated_at=timezone('utc',now())
        where id=state_row.id;
        perform private.upsert_universe_agent_presence_runtime(
          s.world_id,state_row.agent_id,'present','spatial_runtime',
          jsonb_build_object('movement_state','moving','position',jsonb_build_object('x',nx,'y',ny,'z',nz),
            'target_position',state_row.target_position,'zone_key',state_row.zone_key)
        );
        changed_count := changed_count + 1;
      end if;

      insert into public.spatial_runtime_events(world_id,session_id,event_type,actor_type,actor_id,payload)
      values(s.world_id,s.id,'agent_moved','agent',state_row.agent_id,
        jsonb_build_object('tick_number',next_tick,'movement_state',
          case when distance <= step_distance or distance = 0 then 'idle' else 'moving' end));
    end if;
  end loop;

  insert into public.simulation_ticks(session_id,tick_number,completed_at,event_count,metadata)
  values(s.id,next_tick,timezone('utc',now()),changed_count,
    jsonb_build_object('runtime','deterministic_spatial_tick','movement_updates',changed_count))
  returning * into t;

  update public.simulation_sessions
  set current_tick=next_tick,last_tick_at=timezone('utc',now()),updated_at=timezone('utc',now())
  where id=s.id;

  insert into public.spatial_runtime_events(world_id,session_id,event_type,actor_type,payload)
  values(s.world_id,s.id,'simulation_tick','system',
    jsonb_build_object('tick_number',next_tick,'event_count',changed_count,'runtime','deterministic_spatial_tick'));
  return t;
end
$function$;

revoke all on function private.advance_world_simulation_tick_internal(uuid)
from public, anon, authenticated;

create or replace function public.advance_world_simulation_tick(p_session_id uuid)
returns public.simulation_ticks
language plpgsql
security definer
set search_path to ''
as $function$
declare s public.simulation_sessions;
begin
  select * into s from public.simulation_sessions where id=p_session_id for update;
  if not found or not private.spatial_world_owned(s.world_id) then
    raise exception 'SIMULATION_TICK_DENIED';
  end if;
  return private.advance_world_simulation_tick_internal(p_session_id);
end
$function$;

revoke all on function public.advance_world_simulation_tick(uuid) from public, anon, authenticated;
grant execute on function public.advance_world_simulation_tick(uuid) to authenticated;
alter function public.advance_world_simulation_tick(uuid) set search_path='';

create or replace function private.run_due_world_simulation_ticks()
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  s public.simulation_sessions;
  due_ticks integer;
  advanced_ticks integer := 0;
  i integer;
begin
  for s in
    select * from public.simulation_sessions
    where status='running'
    order by id
    for update skip locked
  loop
    due_ticks := least(60,greatest(1,floor(
      extract(epoch from (clock_timestamp()-coalesce(s.last_tick_at,s.started_at,clock_timestamp())))
      * s.tick_rate_hz
    )::integer));

    for i in 1..due_ticks loop
      begin
        perform private.advance_world_simulation_tick_internal(s.id);
        advanced_ticks := advanced_ticks + 1;
      exception when others then
        insert into public.spatial_runtime_events(world_id,session_id,event_type,actor_type,payload)
        values(s.world_id,s.id,'simulation_tick_failed','system',
          jsonb_build_object('runtime','deterministic_spatial_tick_scheduler','error',sqlerrm));
        exit;
      end;
    end loop;
  end loop;
  return advanced_ticks;
end
$function$;

revoke all on function private.run_due_world_simulation_ticks() from public, anon, authenticated;

select cron.unschedule(jobid)
from cron.job
where jobname='allpha-universe-spatial-runtime-dispatcher';

select cron.schedule(
  'allpha-universe-spatial-runtime-dispatcher',
  '1 second',
  $$select private.run_due_world_simulation_ticks();$$
);