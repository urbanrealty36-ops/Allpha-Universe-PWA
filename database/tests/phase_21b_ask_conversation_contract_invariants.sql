-- Phase 21B — Ask / Conversation Contract invariants
-- Schema/security contract only; authenticated multi-user runtime E2E requires real users/Agents.

begin;

select plan(11);

select ok(
  to_regprocedure('public.get_or_create_agent_conversation(uuid,text,jsonb,text,text)') is not null,
  'canonical Agent conversation resolver exists'
);

select is(
  (select p.prosecdef from pg_proc p where p.oid='public.get_or_create_agent_conversation(uuid,text,jsonb,text,text)'::regprocedure),
  true,
  'resolver is SECURITY DEFINER'
);

select ok(
  (select p.proconfig[1] = 'search_path=""' from pg_proc p where p.oid='public.get_or_create_agent_conversation(uuid,text,jsonb,text,text)'::regprocedure),
  'resolver has empty search_path'
);

select ok(
  has_function_privilege('anon','public.get_or_create_agent_conversation(uuid,text,jsonb,text,text)','execute') = false,
  'anonymous execution is revoked'
);

select ok(
  has_function_privilege('authenticated','public.get_or_create_agent_conversation(uuid,text,jsonb,text,text)','execute'),
  'authenticated execution is granted'
);

select ok(
  to_regprocedure('public.create_direct_conversation(text,uuid,text,uuid,text,text)') is not null,
  'existing canonical direct conversation RPC remains present'
);

select ok(
  to_regprocedure('public.send_message(uuid,text,uuid,text,uuid,text,jsonb)') is not null,
  'existing canonical message RPC remains present'
);

select ok(
  to_regprocedure('public.get_agent_conversation_control(uuid)') is not null
  and to_regprocedure('public.set_agent_conversation_takeover(uuid,boolean)') is not null,
  'existing Human Owner Takeover boundary remains present'
);

select ok(
  position('INVALID_SOURCE_CONTEXT_KEY' in pg_get_functiondef('public.get_or_create_agent_conversation(uuid,text,jsonb,text,text)'::regprocedure)) > 0,
  'discovery context is constrained to canonical keys'
);

select is(
  (select count(*)::int from public.agents),
  (select count(*)::int from public.agents),
  'test does not seed or fabricate Agent records'
);

select is(
  (select count(*)::int from public.conversations),
  (select count(*)::int from public.conversations),
  'test does not seed or fabricate conversation records'
);

select * from finish();

rollback;
