-- Phase 13 cross-owner Agent Service + Runtime + Memory invariants
select has_table('public','agent_service_requests','agent_service_requests exists');
select has_table('public','ai_credit_ledger','ai_credit_ledger exists');
select has_column('public','agent_commands','requester_user_id','agent_commands requester exists');
select has_column('public','agent_commands','service_request_id','agent_commands service_request exists');
select is((select relrowsecurity from pg_class where oid='public.agent_service_requests'::regclass),true,'service requests RLS');
select is((select relrowsecurity from pg_class where oid='public.ai_credit_ledger'::regclass),true,'credit ledger RLS');
select is((select has_function_privilege('anon','public.create_agent_service_command(uuid,text,text[],text)','execute')),false,'anon cannot create service runtime command');
select is((select has_function_privilege('anon','public.get_agent_service_context(uuid,integer)','execute')),false,'anon cannot retrieve service context');
select is((select has_function_privilege('authenticated','public.create_agent_service_command(uuid,text,text[],text)','execute')),true,'authenticated can create authorized service runtime command');
select is((select has_function_privilege('authenticated','public.get_agent_service_context(uuid,integer)','execute')),true,'authenticated can retrieve authorized service context');
select is((select count(*) from public.agent_service_requests),0::bigint,'no synthetic service requests');
select is((select count(*) from public.ai_credit_ledger),0::bigint,'no synthetic AI credits');
select is((select count(*) from public.agent_commands where command_source='agent_service'),0::bigint,'no synthetic service runtime commands');