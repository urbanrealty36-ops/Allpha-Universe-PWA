-- Phase 18 Spatial Runtime Adapter: bounded persistence and index.
create or replace function public.update_agent_spatial_state(
  p_world_id uuid,p_agent_id uuid,p_movement_state text,p_position jsonb,p_rotation jsonb,
  p_zone_key text,p_target_position jsonb,p_speed numeric,p_metadata jsonb
) returns public.agent_spatial_states
language plpgsql security definer set search_path to ''
as $function$
declare s public.agent_spatial_states; old_state text; previous_updated_at timestamptz;
begin
  if not private.spatial_agent_owned(p_agent_id) then raise exception 'SPATIAL_AGENT_OWNER_DENIED'; end if;
  if p_speed is not null and (p_speed < 0 or p_speed > 100) then raise exception 'SPATIAL_SPEED_OUT_OF_BOUNDS'; end if;
  if p_position is not null and (jsonb_typeof(p_position) <> 'object' or not (p_position ? 'x') or not (p_position ? 'y') or not (p_position ? 'z')) then raise exception 'SPATIAL_POSITION_INVALID'; end if;
  select movement_state,updated_at into old_state,previous_updated_at from public.agent_spatial_states where world_id=p_world_id and agent_id=p_agent_id for update;
  if not found then raise exception 'SPATIAL_STATE_NOT_FOUND'; end if;
  if previous_updated_at > timezone('utc',now()) - interval '100 milliseconds' then raise exception 'SPATIAL_UPDATE_RATE_LIMITED'; end if;
  update public.agent_spatial_states set movement_state=p_movement_state,position=coalesce(p_position,position),rotation=coalesce(p_rotation,rotation),zone_key=p_zone_key,target_position=p_target_position,speed=coalesce(p_speed,speed),metadata=coalesce(p_metadata,metadata),updated_at=timezone('utc',now()) where world_id=p_world_id and agent_id=p_agent_id returning * into s;
  if old_state is distinct from s.movement_state then
    insert into public.spatial_runtime_events(world_id,event_type,actor_type,actor_id,payload) values(p_world_id,'agent_state_changed','agent',p_agent_id,jsonb_build_object('from',old_state,'to',s.movement_state));
  else
    insert into public.spatial_runtime_events(world_id,event_type,actor_type,actor_id,payload) values(p_world_id,'agent_moved','agent',p_agent_id,jsonb_build_object('position',s.position,'rotation',s.rotation,'zone_key',s.zone_key));
  end if;
  perform public.upsert_universe_agent_presence(p_world_id,p_agent_id,case p_movement_state when 'exploring' then 'exploring' when 'collaborating' then 'collaborating' when 'negotiating' then 'negotiating' when 'awaiting_approval' then 'awaiting_approval' when 'sleeping' then 'sleeping' else 'present' end,'spatial_runtime',jsonb_build_object('movement_state',p_movement_state,'position',s.position,'zone_key',s.zone_key));
  return s;
end $function$;
revoke execute on function public.update_agent_spatial_state(uuid,uuid,text,jsonb,jsonb,text,jsonb,numeric,jsonb) from public,anon;
grant execute on function public.update_agent_spatial_state(uuid,uuid,text,jsonb,jsonb,text,jsonb,numeric,jsonb) to authenticated;
create index if not exists agent_spatial_states_world_updated_idx on public.agent_spatial_states(world_id,updated_at desc);
