DO $$
DECLARE
  fn_count integer;
  factory_fn_count integer;
  agents_with_factory integer;
BEGIN
  select count(*) into fn_count
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='create_agent_identity';

  select count(*) into factory_fn_count
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='create_agent_identity'
    and pg_get_function_identity_arguments(p.oid) like '%p_factory_config jsonb';

  if fn_count <> 1 then raise exception 'Expected exactly one create_agent_identity function, found %', fn_count; end if;
  if factory_fn_count <> 1 then raise exception 'Expected canonical factory-aware create_agent_identity signature'; end if;

  select count(*) into agents_with_factory
  from public.agent_identities
  where metadata ? 'factory_config';

  if agents_with_factory < 0 then raise exception 'Invalid factory metadata count'; end if;

  raise notice 'PASS: Agent Factory RPC is canonical and factory metadata is identity-scoped.';
END $$;