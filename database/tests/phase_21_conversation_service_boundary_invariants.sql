-- Phase 21/13 Conversation vs AI Service boundary invariants.
-- No business/test records are inserted.

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='get_agent_conversation_control' and pg_get_functiondef(p.oid) like '%human_takeover_active%';
  if v_count<>1 then raise exception 'FAIL: conversation control RPC missing'; end if;

  select count(*) into v_count from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='set_agent_conversation_takeover' and pg_get_functiondef(p.oid) like '%AGENT_OWNER_REQUIRED%';
  if v_count<>1 then raise exception 'FAIL: takeover ownership guard missing'; end if;

  select count(*) into v_count from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='send_message' and pg_get_functiondef(p.oid) like '%HUMAN_TAKEOVER_REQUIRED%';
  if v_count<>1 then raise exception 'FAIL: owner takeover guard missing from send_message'; end if;

  select count(*) into v_count from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='reserve_agent_service_request' and pg_get_functiondef(p.oid) like '%HUMAN_TAKEOVER_ACTIVE%';
  if v_count<>1 then raise exception 'FAIL: paid service takeover guard missing'; end if;

  select count(*) into v_count from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='append_agent_service_message' and pg_get_functiondef(p.oid) like '%HUMAN_TAKEOVER_ACTIVE%';
  if v_count<>1 then raise exception 'FAIL: service output takeover guard missing'; end if;

  select count(*) into v_count
  from information_schema.routine_privileges
  where routine_schema='public' and routine_name='get_agent_conversation_control'
    and grantee='authenticated' and privilege_type='EXECUTE';
  if v_count<>1 then raise exception 'FAIL: authenticated control execute missing'; end if;

  select count(*) into v_count
  from information_schema.routine_privileges
  where routine_schema='public' and routine_name='set_agent_conversation_takeover'
    and grantee='anon' and privilege_type='EXECUTE';
  if v_count<>0 then raise exception 'FAIL: anonymous takeover execute remains'; end if;

  raise notice 'PASS: conversation/service boundary invariants 7/7';
end $$;
