begin;

select plan(10);

select has_column('public','agent_service_requests','generated_content_id',
  'Agent Service stores the canonical generated Content link');

select has_index('public','agent_service_requests_generated_content_uidx',
  'Generated Content link is idempotent per service request');

select has_fk('public','agent_service_requests','agent_service_requests_generated_content_id_fkey',
  'Generated Content link references Content Platform');

select function_returns('public.complete_agent_service_request(uuid,uuid,uuid,jsonb)','jsonb',
  'Agent Service settlement remains the canonical completion RPC');

select function_is_security_definer('public.complete_agent_service_request(uuid,uuid,uuid,jsonb)',
  'Settlement RPC remains a privileged server-side boundary');

select ok(
  exists(
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname='complete_agent_service_request'
      and pg_get_functiondef(p.oid) like '%generated_content%'
  ),
  'Settlement RPC contains the generated Content cross-domain contract'
);

select ok(
  exists(
    select 1 from pg_constraint c
    where c.conrelid='public.content_items'::regclass
      and c.contype='p'
  ),
  'Content Platform keeps its canonical primary key'
);

select ok(
  not exists(
    select 1 from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname in ('agent_content_engine','generated_content_engine')
  ),
  'No duplicate Content/Agent Service engine was introduced'
);

select ok(
  exists(
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='submit_content_moderation'
  )
  and exists(
    select 1 from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='publish_content'
  ),
  'Generated Content must reuse canonical moderation and publish RPCs'
);

select is(
  (select count(*)::integer from public.agent_service_requests),
  0,
  'No synthetic Agent Service business data is seeded'
);

select * from finish();
rollback;