-- Phase 18 — Spatial Runtime Execution Completion
-- Structural/runtime gate. Does not fabricate Agents, Worlds, sessions, or ticks.

do $$
declare
  v boolean;
begin
  select exists(select 1 from pg_extension where extname='pg_cron') into v;
  if not v then raise exception 'FAIL: pg_cron not installed'; end if;

  select exists(
    select 1 from cron.job
    where jobname='allpha-universe-spatial-runtime-dispatcher'
      and active
      and schedule='1 second'
  ) into v;
  if not v then raise exception 'FAIL: spatial runtime dispatcher is not active'; end if;

  select not has_function_privilege('anon','public.advance_world_simulation_tick(uuid)','execute') into v;
  if not v then raise exception 'FAIL: anon can execute spatial tick'; end if;

  select has_function_privilege('authenticated','public.advance_world_simulation_tick(uuid)','execute') into v;
  if not v then raise exception 'FAIL: authenticated cannot execute public spatial tick'; end if;

  select not has_function_privilege('authenticated','private.run_due_world_simulation_ticks()','execute') into v;
  if not v then raise exception 'FAIL: private scheduler is exposed'; end if;

  select count(*)=3
    from pg_publication_tables
   where pubname='supabase_realtime'
     and tablename in ('simulation_sessions','agent_spatial_states','spatial_runtime_events')
   into v;
  if not v then raise exception 'FAIL: spatial realtime publication surface incomplete'; end if;

  if (select private.run_due_world_simulation_ticks()) <> 0 then
    raise exception 'FAIL: scheduler advanced ticks without runtime sessions';
  end if;

  if exists(select 1 from public.simulation_sessions)
     or exists(select 1 from public.simulation_ticks)
     or exists(select 1 from public.spatial_runtime_events) then
    raise exception 'FAIL: test expected empty runtime dataset'; 
  end if;
end $$;

select 'PASS: Phase 18 Spatial Runtime Execution Completion structural gate' as result;