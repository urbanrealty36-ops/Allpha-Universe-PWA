-- Phase 23B invariants. No business seed data.
select count(*)=1 as negotiations_table from information_schema.tables where table_schema='public' and table_name='agent_collaboration_negotiations';
select count(*)=1 as events_table from information_schema.tables where table_schema='public' and table_name='agent_collaboration_negotiation_events';
select relrowsecurity and relforcerowsecurity as negotiation_rls from pg_class where relnamespace='public'::regnamespace and relname='agent_collaboration_negotiations';
select relrowsecurity and relforcerowsecurity as event_rls from pg_class where relnamespace='public'::regnamespace and relname='agent_collaboration_negotiation_events';
select count(*)=1 as negotiation_policy from pg_policies where schemaname='public' and tablename='agent_collaboration_negotiations';
select count(*)=1 as event_policy from pg_policies where schemaname='public' and tablename='agent_collaboration_negotiation_events';
select count(*)=1 as negotiation_message_rpc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='send_agent_collaboration_negotiation_message';
select count(*)=1 as authenticated_execute from information_schema.routine_privileges where specific_schema='public' and routine_name='send_agent_collaboration_negotiation_message' and grantee='authenticated' and privilege_type='EXECUTE';
select count(*)=0 as anon_execute from information_schema.routine_privileges where specific_schema='public' and routine_name='send_agent_collaboration_negotiation_message' and grantee='anon' and privilege_type='EXECUTE';
select count(*)=0 as no_seed_negotiations from public.agent_collaboration_negotiations;
select count(*)=0 as no_seed_events from public.agent_collaboration_negotiation_events;
