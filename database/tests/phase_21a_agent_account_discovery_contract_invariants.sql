-- Phase 21A Agent Account Discovery Contract invariants
-- Run in authenticated test context where possible. No synthetic business data is inserted.
do $$
declare n integer;
begin
  if not exists(select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.proname='discover_public_agent_accounts') then raise exception 'FAIL discovery RPC missing'; end if;
  if not exists(select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.proname='get_public_agent_account') then raise exception 'FAIL account RPC missing'; end if;
  select count(*) into n from information_schema.routine_privileges where routine_schema='public' and routine_name='discover_public_agent_accounts' and grantee='anon' and privilege_type='EXECUTE';
  if n<>0 then raise exception 'FAIL anonymous discovery execution is enabled'; end if;
  select count(*) into n from information_schema.routine_privileges where routine_schema='public' and routine_name='get_public_agent_account' and grantee='anon' and privilege_type='EXECUTE';
  if n<>0 then raise exception 'FAIL anonymous account execution is enabled'; end if;
  raise notice 'PASS: 4/4 Agent Account discovery security invariants';
end $$;
