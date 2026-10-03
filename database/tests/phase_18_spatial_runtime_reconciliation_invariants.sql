begin;

select plan(12);

select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.start_world_simulation(uuid,numeric,jsonb)'::regprocedure),'Canonical simulation session start exists');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.advance_world_simulation_tick(uuid)'::regprocedure),'Deterministic spatial tick primitive exists');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.pause_world_simulation(uuid)'::regprocedure),'Simulation pause boundary exists');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.resume_world_simulation(uuid)'::regprocedure),'Simulation resume boundary exists');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.stop_world_simulation(uuid)'::regprocedure),'Simulation stop boundary exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='simulation_sessions' and column_name='current_tick'),'Simulation session retains authoritative tick counter');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='simulation_ticks' and column_name='tick_number'),'Simulation ticks retain tick number');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='spatial_runtime_events' and column_name='session_id'),'Spatial runtime events retain simulation session linkage');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='agent_spatial_states' and column_name='target_position'),'Agent spatial state retains deterministic movement target');
select ok(not has_function_privilege('anon','public.advance_world_simulation_tick(uuid)','EXECUTE'),'Anon cannot advance a simulation tick');
select ok(has_function_privilege('authenticated','public.advance_world_simulation_tick(uuid)','EXECUTE'),'Authenticated runtime boundary can invoke tick primitive');
select is((select count(*)::integer from public.simulation_sessions),0,'No synthetic simulation sessions are seeded');

select * from finish();
rollback;