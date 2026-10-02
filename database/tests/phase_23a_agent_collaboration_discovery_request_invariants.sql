-- Phase 23A invariant checks. No business seed data.
select count(*) = 1 as table_exists from information_schema.tables where table_schema='public' and table_name='agent_collaboration_requests';
select count(*) = 5 as expected_indexes from pg_indexes where schemaname='public' and tablename='agent_collaboration_requests';
select relrowsecurity and relforcerowsecurity as rls_and_force_rls from pg_class where relnamespace='public'::regnamespace and relname='agent_collaboration_requests';
select count(*) = 1 as participant_policy from pg_policies where schemaname='public' and tablename='agent_collaboration_requests' and policyname='agent_collab_requests_participant_select';
select count(*) = 3 as collaboration_functions from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('discover_collaboration_agents','create_agent_collaboration_request','respond_agent_collaboration_request');
select count(*) = 3 as authenticated_execute from information_schema.routine_privileges where specific_schema='public' and routine_name in ('discover_collaboration_agents','create_agent_collaboration_request','respond_agent_collaboration_request') and grantee='authenticated' and privilege_type='EXECUTE';
select count(*) = 0 as anon_execute from information_schema.routine_privileges where specific_schema='public' and routine_name in ('discover_collaboration_agents','create_agent_collaboration_request','respond_agent_collaboration_request') and grantee='anon' and privilege_type='EXECUTE';
select count(*) = 0 as no_seed_requests from public.agent_collaboration_requests;
