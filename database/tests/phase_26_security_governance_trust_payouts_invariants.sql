-- Phase 26 invariants: security/governance + seller payout boundary.
select count(*)=5 as payout_permissions from public.permissions where key in ('payout.account.manage','payout.request','payout.read','payout.review','payout.process');
select count(*)=2 as admin_role_bindings from public.platform_role_permissions rp join public.platform_roles r on r.id=rp.role_id join public.permissions p on p.id=rp.permission_id where r.key in ('super_admin','platform_admin') and p.key='payout.process';
select (select relrowsecurity from pg_class where oid='public.payout_accounts'::regclass) as payout_account_rls;
select (select relrowsecurity from pg_class where oid='public.payout_requests'::regclass) as payout_request_rls;
select (select relrowsecurity from pg_class where oid='public.payout_events'::regclass) as payout_event_rls;
select has_function_privilege('anon','public.request_payout(bigint,text)','execute')=false as request_not_anon;
select has_function_privilege('anon','public.decide_payout_request(uuid,text,text)','execute')=false as decision_not_anon;
select has_function_privilege('anon','public.process_payout_request(uuid,text,text,text)','execute')=false as process_not_anon;
select pg_get_functiondef('public.request_payout(bigint,text)'::regprocedure) like '%payout_pending_exists%' as parallel_payout_guard;
select count(*)=0 as no_seed_payouts from public.payout_requests;
select count(*)=0 as no_seed_accounts from public.payout_accounts;
select count(*)=0 as no_seed_events from public.payout_events;
