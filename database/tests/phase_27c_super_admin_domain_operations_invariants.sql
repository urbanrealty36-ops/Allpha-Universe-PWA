-- Phase 27C invariants: no business fixtures are created.
select plan(9);
select ok(not has_function_privilege('anon','public.get_admin_transaction_explorer(text,text,text,text,text,timestamptz,timestamptz,integer,integer)','execute'),'anon cannot execute transaction explorer');
select ok(has_function_privilege('authenticated','public.get_admin_transaction_explorer(text,text,text,text,text,timestamptz,timestamptz,integer,integer)','execute'),'authenticated can reach transaction explorer boundary');
select ok(not has_function_privilege('anon','public.get_admin_transaction_detail(uuid)','execute'),'anon cannot execute transaction detail');
select ok(has_function_privilege('authenticated','public.get_admin_transaction_detail(uuid)','execute'),'authenticated can reach transaction detail boundary');
select ok(not has_function_privilege('anon','public.get_admin_domain_records(text,text,text,integer,integer)','execute'),'anon cannot execute domain explorer');
select ok(has_function_privilege('authenticated','public.get_admin_domain_records(text,text,text,integer,integer)','execute'),'authenticated can reach domain explorer boundary');
select ok(not has_function_privilege('anon','public.mutate_admin_master_data(text,uuid,text,jsonb,text)','execute'),'anon cannot execute master-data mutation');
select ok(has_function_privilege('authenticated','public.mutate_admin_master_data(text,uuid,text,jsonb,text)','execute'),'authenticated can reach master-data mutation boundary');
select ok((select prosecdef from pg_proc where oid='private.get_admin_transaction_explorer__allpha_sd(text,text,text,text,text,timestamptz,timestamptz,integer,integer)'::regprocedure),'transaction explorer private function is SECURITY DEFINER');
select * from finish();