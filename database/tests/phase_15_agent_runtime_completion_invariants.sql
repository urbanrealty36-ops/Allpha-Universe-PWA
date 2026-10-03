begin;
select plan(18);

select ok(to_regclass('public.agent_commands') is not null,'agent command table exists');
select ok(to_regclass('public.agent_tasks') is not null,'agent tasks table exists');
select ok(to_regclass('public.agent_task_steps') is not null,'agent task steps table exists');
select ok(to_regclass('public.agent_execution_contexts') is not null,'execution context table exists');
select ok(to_regclass('public.agent_runtime_events') is not null,'runtime events table exists');
select ok(to_regclass('public.agent_tool_definitions') is not null,'tool registry exists');

select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='agent_commands'),'agent commands RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='agent_tasks'),'agent tasks RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='agent_task_steps'),'agent steps RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='agent_execution_contexts'),'execution context RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='agent_runtime_events'),'runtime events RLS enabled');

select ok(has_function_privilege('anon','public.get_agent_runtime_context(uuid)','execute')=false,'anon cannot read runtime context');
select ok(has_function_privilege('authenticated','public.get_agent_runtime_context(uuid)','execute')=true,'authenticated can read runtime context');

select ok(position('15 minutes' in pg_get_functiondef(p.oid))>0,
  'approval requests have a future 15 minute expiry'
) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='begin_agent_execution';

select ok(position('previous_status' in pg_get_functiondef(p.oid))>0,
  'command transition preserves previous state for telemetry'
) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='transition_agent_command';

select ok(position('agent_runtime_state' in pg_get_functiondef(p.oid))>0,
  'runtime transition updates Agent runtime state'
) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='transition_agent_command';

select ok(position('requester_user_id' in pg_get_functiondef(p.oid))>0,
  'runtime context scopes requester access'
) from pg_proc p join pg_namespace n on n.nspname='public' and p.proname='get_agent_runtime_context';

select ok(position('private_policy_rules_excluded' in pg_get_functiondef(p.oid))>0,
  'runtime context has cross-owner privacy boundary'
) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='get_agent_runtime_context';

select results_eq($$select count(*)::bigint from public.agent_commands$$,$$values(0::bigint)$$,'no synthetic commands');
select results_eq($$select count(*)::bigint from public.agent_tasks$$,$$values(0::bigint)$$,'no synthetic tasks');
select results_eq($$select count(*)::bigint from public.agent_task_steps$$,$$values(0::bigint)$$,'no synthetic task steps');
select results_eq($$select count(*)::bigint from public.agent_runtime_events$$,$$values(0::bigint)$$,'no synthetic runtime events');
select results_eq($$select count(*)::bigint from public.agent_tool_runs$$,$$values(0::bigint)$$,'no synthetic tool runs');
select results_eq($$select count(*)::bigint from public.risk_assessments where action like 'agent.execute%'$$,$$values(0::bigint)$$,'no synthetic runtime risk assessments');
select results_eq($$select count(*)::bigint from public.approval_requests where action='agent.execute'$$,$$values(0::bigint)$$,'no synthetic runtime approvals');

select * from finish();
rollback;