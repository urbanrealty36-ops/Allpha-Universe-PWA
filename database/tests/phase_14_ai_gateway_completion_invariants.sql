begin;
select plan(20);

select ok(exists(select 1 from public.ai_providers where provider_key='openai' and enabled=true),'enabled provider exists');
select ok(exists(select 1 from public.ai_models m join public.ai_providers p on p.id=m.provider_id where m.enabled=true and p.enabled=true),'enabled model has enabled provider');
select ok(exists(select 1 from public.ai_routing_policies where enabled=true),'enabled routing policy exists');

select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='ai_gateway_requests'),'gateway requests use RLS');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='ai_gateway_attempts'),'gateway attempts use RLS');
select ok((select rowsecurity from pg_tables where schemaname='public' and tablename='ai_usage_events'),'gateway usage uses RLS');

select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='ai_gateway_requests' and cmd='SELECT'),'gateway requests have owner read policy');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='ai_gateway_attempts' and cmd='SELECT'),'gateway attempts have owner read policy');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='ai_usage_events' and cmd='SELECT'),'usage has owner read policy');

select ok((select has_function_privilege('anon','public.create_ai_gateway_request(uuid,text,text[],text,jsonb)','execute'))=false,'anon cannot create gateway request');
select ok((select has_function_privilege('anon','public.record_ai_gateway_attempt(uuid,integer,uuid,uuid,text,integer,integer,integer,integer,numeric,integer,text,text)','execute'))=false,'anon cannot record attempts');
select ok((select has_function_privilege('anon','public.record_ai_gateway_outcome(uuid,text,text,uuid,uuid,integer,integer,integer,numeric,integer,text,text,text,jsonb)','execute'))=false,'anon cannot record outcomes');
select ok((select has_function_privilege('anon','public.record_ai_usage_event(uuid,text,uuid,uuid,uuid,integer,integer,integer,numeric,integer,jsonb)','execute'))=false,'anon cannot record usage');

select ok((select pg_get_functiondef(p.oid) like '%agent_service_requests%' from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_ai_usage_event'),'usage RPC contains cross-owner service guard');
select ok((select pg_get_functiondef(p.oid) like '%requester_user_id%' from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_ai_usage_event'),'usage RPC validates service requester ownership');
select ok((select pg_get_functiondef(p.oid) like '%SET search_path TO ''''%' from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_ai_usage_event'),'usage RPC pins search_path');

select results_eq($$select count(*)::bigint from public.ai_gateway_requests$$,$$values(0::bigint)$$,'no synthetic gateway requests');
select results_eq($$select count(*)::bigint from public.ai_gateway_attempts$$,$$values(0::bigint)$$,'no synthetic gateway attempts');
select results_eq($$select count(*)::bigint from public.ai_usage_events$$,$$values(0::bigint)$$,'no synthetic usage events');
select results_eq($$select count(*)::bigint from public.ai_providers where credential_env_var like '%KEY%' and metadata ? 'api_key'$$,$$values(0::bigint)$$,'no provider API key stored in metadata');

select * from finish();
rollback;
