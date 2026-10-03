begin;
select plan(28);

select ok(to_regclass('public.workflows') is not null,'workflow table exists');
select ok(to_regclass('public.workflow_versions') is not null,'workflow version table exists');
select ok(to_regclass('public.workflow_steps') is not null,'workflow step table exists');
select ok(to_regclass('public.workflow_runs') is not null,'workflow run table exists');
select ok(to_regclass('public.workflow_run_steps') is not null,'workflow run step table exists');
select ok(to_regclass('public.workflow_events') is not null,'workflow event table exists');
select ok(to_regclass('public.missions') is not null,'mission table exists');
select ok(to_regclass('public.mission_participants') is not null,'mission participant table exists');
select ok(to_regclass('public.mission_runs') is not null,'mission run table exists');

select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='workflows'),'workflows RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='workflow_versions'),'workflow versions RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='workflow_steps'),'workflow steps RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='workflow_runs'),'workflow runs RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='workflow_run_steps'),'workflow run steps RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='workflow_events'),'workflow events RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='missions'),'missions RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='mission_participants'),'mission participants RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='mission_runs'),'mission runs RLS enabled');

select ok(has_function_privilege('anon','public.trigger_workflow(uuid,text,uuid,jsonb,text)','execute')=false,'anon cannot trigger workflows');
select ok(has_function_privilege('authenticated','public.trigger_workflow(uuid,text,uuid,jsonb,text)','execute')=true,'authenticated can trigger owned workflows');
select ok(has_function_privilege('anon','public.prepare_workflow_run(uuid)','execute')=false,'anon cannot prepare workflows');
select ok(has_function_privilege('authenticated','public.prepare_workflow_run(uuid)','execute')=true,'authenticated can prepare workflows');
select ok(has_function_privilege('anon','public.sync_workflow_run(uuid)','execute')=false,'anon cannot sync workflows');
select ok(has_function_privilege('authenticated','public.sync_workflow_run(uuid)','execute')=true,'authenticated can sync workflows');

select ok(position('_workflow_control' in pg_get_functiondef(p.oid))>0,'workflow preparation carries condition and retry metadata into canonical runtime')
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='prepare_workflow_run';

select ok(position('agent_task_id=ats.task_id' in pg_get_functiondef(p.oid))>0,'workflow run steps reconcile to Agent Runtime task steps')
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='sync_workflow_run';

select ok(position('p_idempotency_key' in pg_get_functiondef(p.oid))>0,'workflow trigger supports idempotency')
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='trigger_workflow';

select ok(position('private.workflow_subject_owned' in pg_get_functiondef(p.oid))>0,'workflow trigger enforces ownership')
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='trigger_workflow';

select ok(position('skipped' in pg_get_functiondef(p.oid))>0,'Agent Runtime tool result supports condition-skipped steps')
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='record_agent_tool_result';

select ok(position('skipped' in pg_get_constraintdef(c.oid))>0,'tool run status accepts skipped workflow steps')
from pg_constraint c join pg_class t on t.oid=c.conrelid
where t.oid='public.agent_tool_runs'::regclass and c.conname='agent_tool_runs_status_check';

select ok(position('mp.mission_id = missions.id' in pg_policies.qual)>0,'mission visibility policy uses correct mission membership join')
from pg_policies where schemaname='public' and tablename='missions' and policyname='missions_select';

select results_eq($$select count(*)::bigint from public.workflows$$,$$values(0::bigint)$$,'no synthetic workflows');
select results_eq($$select count(*)::bigint from public.workflow_versions$$,$$values(0::bigint)$$,'no synthetic workflow versions');
select results_eq($$select count(*)::bigint from public.workflow_steps$$,$$values(0::bigint)$$,'no synthetic workflow steps');
select results_eq($$select count(*)::bigint from public.workflow_runs$$,$$values(0::bigint)$$,'no synthetic workflow runs');
select results_eq($$select count(*)::bigint from public.mission_runs$$,$$values(0::bigint)$$,'no synthetic mission runs');

select * from finish();
rollback;