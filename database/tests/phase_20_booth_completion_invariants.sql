-- Phase 20 completion invariants.
-- Read-only. No business or Storage seed data.
begin;
select plan(14);
select ok(to_regclass('public.booths') is not null,'booths table exists');
select ok(to_regclass('public.booth_leases') is not null,'lease table exists');
select ok((select relrowsecurity from pg_class where oid='public.booths'::regclass),'booth RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.booth_leases'::regclass),'lease RLS enabled');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='booths' and column_name='branding_config'),'branding config exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='booths' and column_name='portal_config'),'portal config exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='booths' and column_name='host_agent_id'),'AI host binding exists');
select ok(exists(select 1 from information_schema.columns where table_schema='public' and table_name='booth_leases' and column_name='traffic_score'),'traffic score exists');
select ok(to_regprocedure('public.create_booth(uuid,uuid,text,uuid,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,jsonb)') is not null,'canonical create RPC exists');
select ok(to_regprocedure('public.update_booth(uuid,text,text,text,jsonb,jsonb,jsonb,jsonb)') is not null,'canonical update RPC exists');
select ok(to_regprocedure('public.request_booth_lease(uuid,text,text,text,numeric,text,text,timestamptz,timestamptz,jsonb)') is not null,'canonical lease RPC exists');
select ok(not has_function_privilege('anon','public.create_booth(uuid,uuid,text,uuid,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,jsonb)','execute'),'create RPC denied to anon');
select ok(not has_function_privilege('anon','public.request_booth_lease(uuid,text,text,text,numeric,text,text,timestamptz,timestamptz,jsonb)','execute'),'lease RPC denied to anon');
select is((select count(*)::int from public.booths),0,'no booth seed data');
select * from finish();
rollback;