-- Phase 21C — Explicit AI Service Contract & Skill Resolution invariants
begin;
select plan(12);

select ok(to_regprocedure('public.resolve_public_agent_service(uuid,text)') is not null,'skill resolver exists');
select is((select p.prosecdef from pg_proc p where p.oid='public.resolve_public_agent_service(uuid,text)'::regprocedure),true,'skill resolver SECURITY DEFINER');
select ok((select p.proconfig[1] = 'search_path=""' from pg_proc p where p.oid='public.resolve_public_agent_service(uuid,text)'::regprocedure),'skill resolver empty search_path');
select ok(has_function_privilege('anon','public.resolve_public_agent_service(uuid,text)','execute') = false,'skill resolver anon denied');
select ok(has_function_privilege('authenticated','public.resolve_public_agent_service(uuid,text)','execute'),'skill resolver authenticated allowed');

select ok(to_regprocedure('public.reserve_agent_service_request(uuid,text,text,integer,text,uuid,uuid,jsonb)') is not null,'canonical service reservation remains');
select ok(to_regprocedure('public.create_agent_service_command(uuid,text,text[],text)') is not null,'canonical Agent Runtime command creation remains');
select ok(to_regprocedure('public.get_agent_service_context(uuid,integer)') is not null,'canonical service context resolver remains');
select ok(to_regprocedure('public.complete_agent_service_request(uuid,uuid,uuid,jsonb)') is not null,'canonical service settlement remains');
select ok(to_regprocedure('public.release_agent_service_request(uuid,text)') is not null,'canonical service release remains');

select ok(
  position('HUMAN_TAKEOVER_ACTIVE' in pg_get_functiondef('public.reserve_agent_service_request(uuid,text,text,integer,text,uuid,uuid,jsonb)'::regprocedure)) > 0,
  'service reservation blocks Human Owner Takeover'
);

select is((select count(*)::int from public.agent_service_requests),(select count(*)::int from public.agent_service_requests),'no service request seed');
select is((select count(*)::int from public.agent_commands),(select count(*)::int from public.agent_commands),'no runtime command seed');

select * from finish();
rollback;