-- Phase 18 Agent Simulation & Spatial Runtime invariants
select plan(46);

select ok(to_regclass('public.agent_spatial_states') is not null,'spatial states exists');
select ok(to_regclass('public.spatial_interactions') is not null,'spatial interactions exists');
select ok(to_regclass('public.simulation_sessions') is not null,'simulation sessions exists');
select ok(to_regclass('public.simulation_ticks') is not null,'simulation ticks exists');
select ok(to_regclass('public.spatial_runtime_events') is not null,'runtime events exists');

select ok((select relrowsecurity from pg_class where oid='public.agent_spatial_states'::regclass),'spatial states RLS');
select ok((select relrowsecurity from pg_class where oid='public.spatial_interactions'::regclass),'interactions RLS');
select ok((select relrowsecurity from pg_class where oid='public.simulation_sessions'::regclass),'sessions RLS');
select ok((select relrowsecurity from pg_class where oid='public.simulation_ticks'::regclass),'ticks RLS');
select ok((select relrowsecurity from pg_class where oid='public.spatial_runtime_events'::regclass),'events RLS');

select ok(to_regprocedure('public.enter_agent_simulation(uuid,uuid,jsonb,jsonb,text)') is not null,'enter simulation RPC');
select ok(to_regprocedure('public.update_agent_spatial_state(uuid,uuid,text,jsonb,jsonb,text,jsonb,numeric,jsonb)') is not null,'update spatial RPC');
select ok(to_regprocedure('public.exit_agent_simulation(uuid,uuid)') is not null,'exit simulation RPC');
select ok(to_regprocedure('public.create_spatial_interaction(uuid,text,uuid,text,uuid,text,jsonb)') is not null,'create interaction RPC');
select ok(to_regprocedure('public.resolve_spatial_interaction(uuid,text,jsonb)') is not null,'resolve interaction RPC');
select ok(to_regprocedure('public.start_world_simulation(uuid,numeric,jsonb)') is not null,'start simulation RPC');
select ok(to_regprocedure('public.pause_world_simulation(uuid)') is not null,'pause simulation RPC');
select ok(to_regprocedure('public.resume_world_simulation(uuid)') is not null,'resume simulation RPC');
select ok(to_regprocedure('public.stop_world_simulation(uuid)') is not null,'stop simulation RPC');
select ok(to_regprocedure('public.record_simulation_tick(uuid,bigint,integer,text,jsonb)') is not null,'record tick RPC');
select ok(to_regprocedure('public.advance_world_simulation_tick(uuid)') is not null,'advance simulation tick RPC');

select ok((select prosecdef from pg_proc where oid='public.enter_agent_simulation(uuid,uuid,jsonb,jsonb,text)'::regprocedure),'enter is security definer');
select ok((select prosecdef from pg_proc where oid='public.update_agent_spatial_state(uuid,uuid,text,jsonb,jsonb,text,jsonb,numeric,jsonb)'::regprocedure),'update is security definer');
select ok((select prosecdef from pg_proc where oid='public.create_spatial_interaction(uuid,text,uuid,text,uuid,text,jsonb)'::regprocedure),'interaction is security definer');
select ok((select prosecdef from pg_proc where oid='public.start_world_simulation(uuid,numeric,jsonb)'::regprocedure),'start is security definer');
select ok((select prosecdef from pg_proc where oid='public.record_simulation_tick(uuid,bigint,integer,text,jsonb)'::regprocedure),'tick is security definer');
select ok((select prosecdef from pg_proc where oid='public.advance_world_simulation_tick(uuid)'::regprocedure),'advance tick is security definer');

select ok((select pg_get_function_result(oid) is not null from pg_proc where oid='public.enter_agent_simulation(uuid,uuid,jsonb,jsonb,text)'::regprocedure),'enter function valid');
select ok((select pg_get_function_result(oid) is not null from pg_proc where oid='public.update_agent_spatial_state(uuid,uuid,text,jsonb,jsonb,text,jsonb,numeric,jsonb)'::regprocedure),'update function valid');
select ok((select pg_get_function_result(oid) is not null from pg_proc where oid='public.create_spatial_interaction(uuid,text,uuid,text,uuid,text,jsonb)'::regprocedure),'interaction function valid');
select ok((select pg_get_function_result(oid) is not null from pg_proc where oid='public.start_world_simulation(uuid,numeric,jsonb)'::regprocedure),'start function valid');
select ok((select pg_get_function_result(oid) is not null from pg_proc where oid='public.record_simulation_tick(uuid,bigint,integer,text,jsonb)'::regprocedure),'tick function valid');

select ok(exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='agent_spatial_states'),'spatial states realtime');
select ok(exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='spatial_interactions'),'interactions realtime');
select ok(exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='simulation_sessions'),'sessions realtime');
select ok(exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='spatial_runtime_events'),'events realtime');

select ok((select count(*) from public.agent_spatial_states)=0,'no spatial seed data');
select ok((select count(*) from public.spatial_interactions)=0,'no interaction seed data');
select ok((select count(*) from public.simulation_sessions)=0,'no session seed data');
select ok((select count(*) from public.simulation_ticks)=0,'no tick seed data');
select ok((select count(*) from public.spatial_runtime_events)=0,'no runtime event seed data');

select ok((select relname from pg_class where relname='simulation_sessions_one_live_world_idx') is not null,'single live session index');
select ok((select relname from pg_class where relname='agent_spatial_states_world_idx') is not null,'spatial world index');
select ok((select relname from pg_class where relname='spatial_interactions_world_idx') is not null,'interaction world index');
select ok((select relname from pg_class where relname='spatial_runtime_events_world_idx') is not null,'runtime event index');
select ok((select relname from pg_class where relname='simulation_ticks_session_idx') is not null,'tick session index');

select * from finish();
