-- Phase 26 invariants: security/governance + seller payout boundary.
select count(*)=5 as payout_permissions from public.permissions where key in ('payout.account.manage','payout.request','payout.read','payout.review','payout.process');
select count(*)=1 as payout_tables from information_schema.tables where table_schema='public' and table_name='payout_requests';
select relrowsecurity as payout_rls from pg_class where oid='public.payout_requests'::regclass;
select has_function_privilege('anon','public.request_payout(bigint,text)','execute')=false as request_not_anon;
select has_function_privilege('authenticated','public.decide_payout_request(uuid,text,text)','execute') as admin_rpc_auth_entrypoint;
select count(*)=0 as no_seed_payouts from public.payout_requests;
select count(*)=0 as no_seed_payout_accounts from public.payout_accounts;
