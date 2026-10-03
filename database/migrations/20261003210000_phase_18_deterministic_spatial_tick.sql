-- Phase 18 — deterministic spatial simulation tick advancement
-- Completes the server-side tick slice without introducing an LLM/frame loop.

create or replace function public.advance_world_simulation_tick(p_session_id uuid)
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
  dx numeric;
  dy numeric;
  dz numeric;
  distance numeric;
  nx numeric;
  ny numeric;
  nz numeric;
  changed_count integer := 0;
begin
  select * into s
  from public.simulation_sessions
  where id = p_session_id
  for update;

  if not found or not private.spatial_world_owned(s.world_id) then
    raise exception 'SIMULATION_TICK_DENIED';
  end if;

  if s.status <> 'running' then
    raise exception 'SIMULATION_NOT_RUNNING';
  end if;

  next_tick := s.current_tick + 1;

  for state_row in
    select *
    from public.agent_spatial_states
    where world_id = s.world_id
    order by agent_id
    for update
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
        set position = jsonb_build_object('x', nx, 'y', ny, 'z', nz),
            movement_state = 'idle',
            target_position = null,
            speed = 0,
            updated_at = timezone('utc', now())
        where id = state_row.id;

        perform public.upsert_universe_agent_presence(
          s.world_id,
          state_row.agent_id,
          'present',
          'spatial_runtime',
          jsonb_build_object(
            'movement_state', 'idle',
            'position', jsonb_build_object('x', nx, 'y', ny, 'z', nz),
            'zone_key', state_row.zone_key
          )
        );
        changed_count := changed_count + 1;
      else
        nx := (state_row.position->>'x')::numeric + (dx / distance) * step_distance;
        ny := (state_row.position->>'y')::numeric + (dy / distance) * step_distance;
        nz := (state_row.position->>'z')::numeric + (dz / distance) * step_distance;

        update public.agent_spatial_states
        set position = jsonb_build_object('x', nx, 'y', ny, 'z', nz),
            updated_at = timezone('utc', now())
        where id = state_row.id;

        perform public.upsert_universe_agent_presence(
          s.world_id,
          state_row.agent_id,
          'present',
          'spatial_runtime',
          jsonb_build_object(
            'movement_state', 'moving',
            'position', jsonb_build_object('x', nx, 'y', ny, 'z', nz),
            'target_position', state_row.target_position,
            'zone_key', state_row.zone_key
          )
        );
        changed_count := changed_count + 1;
      end if;

      insert into public.spatial_runtime_events(
        world_id,
        session_id,
        event_type,
        actor_type,
        actor_id,
        payload
      )
      values (
        s.world_id,
        s.id,
        'agent_moved',
        'agent',
        state_row.agent_id,
        jsonb_build_object(
          'tick_number', next_tick,
          'movement_state', case
            when distance <= step_distance or distance = 0 then 'idle'
            else 'moving'
          end
        )
      );
    end if;
  end loop;

  insert into public.simulation_ticks(
    session_id,
    tick_number,
    completed_at,
    event_count,
    metadata
  )
  values (
    s.id,
    next_tick,
    timezone('utc', now()),
    changed_count,
    jsonb_build_object(
      'runtime', 'deterministic_spatial_tick',
      'movement_updates', changed_count
    )
  )
  returning * into t;

  update public.simulation_sessions
  set current_tick = next_tick,
      last_tick_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = s.id;

  insert into public.spatial_runtime_events(
    world_id,
    session_id,
    event_type,
    actor_type,
    payload
  )
  values (
    s.world_id,
    s.id,
    'simulation_tick',
    'system',
    jsonb_build_object(
      'tick_number', next_tick,
      'event_count', changed_count,
      'runtime', 'deterministic_spatial_tick'
    )
  );

  return t;
end
$function$;

revoke all on function public.advance_world_simulation_tick(uuid) from public, anon, authenticated;
grant execute on function public.advance_world_simulation_tick(uuid) to authenticated;
alter function public.advance_world_simulation_tick(uuid) set search_path = '';
