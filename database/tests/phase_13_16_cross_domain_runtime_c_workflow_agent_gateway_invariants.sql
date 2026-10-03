begin;

select plan(14);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.oid='public.create_workflow_run(uuid,uuid,jsonb)'::regprocedure),
  'Canonical Workflow Run creation RPC exists'
);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.oid='public.prepare_workflow_run(uuid)'::regprocedure),
  'Canonical Workflow Run preparation RPC exists'
);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.oid='public.sync_workflow_run(uuid)'::regprocedure),
  'Canonical Workflow Run synchronization RPC exists'
);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.oid='public.begin_agent_execution(uuid)'::regprocedure),
  'Workflow execution reuses canonical Agent Runtime boundary'
);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.oid='public.transition_agent_command(uuid,text,text,text,text)'::regprocedure),
  'Workflow completion reuses canonical command transition boundary'
);

select ok(
  exists(select 1 from public.agent_tool_definitions
    where tool_key='ai.generate' and enabled=true and system_owned=true),
  'Workflow AI generation uses canonical ai.generate tool'
);

select ok(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='workflow_runs' and column_name='command_id'),
  'Workflow Run is linked to canonical Agent Command'
);

select ok(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='workflow_run_steps' and column_name='agent_task_step_id'),
  'Workflow Run Step can reconcile to Agent Runtime task step'
);

select ok(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='agent_tool_runs' and column_name='step_id'),
  'Agent Tool Run retains task-step audit linkage'
);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='create_workflow_run'
      and p.prosecdef=true),
  'Workflow Run creation is protected by SECURITY DEFINER boundary'
);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='prepare_workflow_run'
      and p.prosecdef=true),
  'Workflow preparation is protected by SECURITY DEFINER boundary'
);

select is(
  (select count(*)::integer from public.workflow_runs),
  0,
  'No synthetic Workflow Run data is seeded by the invariant test'
);

select is(
  (select count(*)::integer from public.agent_tool_runs),
  0,
  'No synthetic Agent Tool Run data is seeded by the invariant test'
);

select * from finish();
rollback;