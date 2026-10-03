begin;

select plan(16);

select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.start_mission_run(uuid,uuid,uuid,jsonb)'::regprocedure),'Canonical Mission Run start exists');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.sync_mission_run(uuid)'::regprocedure),'Canonical Mission Run synchronization exists');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.create_shared_workflow_run(uuid,uuid,uuid,uuid,jsonb)'::regprocedure),'Mission uses shared Workflow Run boundary');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.prepare_workflow_run(uuid)'::regprocedure),'Mission Workflow preparation reuses canonical Workflow boundary');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.begin_agent_execution(uuid)'::regprocedure),'Mission execution reuses Agent Runtime boundary');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.oid='public.transition_agent_command(uuid,text,text,text,text)'::regprocedure),'Mission execution reuses command transition boundary');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='mission_runs' and column_name='workflow_run_id'),'Mission Run links Workflow Run');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='workflow_runs' and column_name='command_id'),'Workflow Run links Agent Command');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='workflow_run_steps' and column_name='agent_task_step_id'),'Workflow Run Step links Agent Runtime step');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='mission_runs' and column_name='participant_id'),'Mission Run retains participant boundary');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='start_mission_run' and p.prosecdef=true),'Mission start is SECURITY DEFINER');
select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='sync_mission_run' and p.prosecdef=true),'Mission sync is SECURITY DEFINER');
select ok(not has_function_privilege('anon','public.start_mission_run(uuid,uuid,uuid,jsonb)','EXECUTE'),'Anon cannot start Mission Run');
select ok(has_function_privilege('authenticated','public.start_mission_run(uuid,uuid,uuid,jsonb)','EXECUTE'),'Authenticated can start Mission Run through boundary');
select is((select count(*)::integer from public.mission_runs),0,'No synthetic Mission Run data is seeded');
select is((select count(*)::integer from public.workflow_runs),0,'No synthetic Workflow Run data is seeded');

select * from finish();
rollback;