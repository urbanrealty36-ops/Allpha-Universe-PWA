begin;

select plan(12);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='retrieve_agent_memory'),
  'Canonical Agent Memory retrieval RPC exists'
);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='retrieve_agent_knowledge'),
  'Canonical Agent Knowledge retrieval RPC exists'
);

select ok(
  exists(select 1 from public.agent_tool_definitions where tool_key='ai.generate' and enabled=true and system_owned=true),
  'Canonical ai.generate tool definition exists'
);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.oid='public.begin_agent_execution(uuid)'::regprocedure),
  'Canonical Agent Runtime execution boundary exists'
);

select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.oid='public.transition_agent_command(uuid,text,text,text,text)'::regprocedure),
  'Canonical command state transition boundary exists'
);

select ok(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='agent_task_steps' and column_name='tool_key'),
  'Agent Runtime task steps retain canonical tool binding'
);

select ok(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='agent_tool_runs' and column_name='input_fingerprint'),
  'Agent Tool Run telemetry retains input fingerprint'
);

select ok(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='agent_tool_runs' and column_name='output_fingerprint'),
  'Agent Tool Run telemetry retains output fingerprint'
);

select ok(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='agent_memory' and column_name='consent_basis'),
  'Agent Memory retains consent basis'
);

select ok(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='agent_memory' and column_name='deleted_at'),
  'Agent Memory retains deletion boundary'
);

select ok(
  exists(select 1 from information_schema.columns
    where table_schema='public' and table_name='knowledge_items' and column_name='provenance'),
  'Knowledge retains provenance'
);

select is(
  (select count(*)::integer from public.agents),
  0,
  'No synthetic Agent data is seeded by the invariant test'
);

select * from finish();
rollback;