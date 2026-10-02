-- Phase 22C invariants: Live → existing Agent Runtime → AI Gateway binding.
select 1 as assertion where exists(select 1 from information_schema.columns where table_schema='public' and table_name='agent_commands' and column_name='live_session_id');
select 1 as assertion where exists(select 1 from information_schema.columns where table_schema='public' and table_name='agent_commands' and column_name='live_collaboration_id');
select 1 as assertion where exists(select 1 from information_schema.columns where table_schema='public' and table_name='agent_commands' and column_name='command_source');
select 1 as assertion where exists(select 1 from pg_indexes where schemaname='public' and indexname='agent_commands_live_collaboration_idx');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='create_live_agent_command');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='begin_agent_execution');
select 1 as assertion where not exists(select 1 from public.agent_commands where command_source='live');
select 1 as assertion where not exists(select 1 from public.ai_gateway_requests);
