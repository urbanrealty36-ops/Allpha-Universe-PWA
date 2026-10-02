select 1 as assertion where exists(select 1 from information_schema.columns where table_schema='public' and table_name='live_agent_collaborations' and column_name='required_capability');
select 1 as assertion where exists(select 1 from pg_indexes where schemaname='public' and indexname='live_collab_agent_idx');
select 1 as assertion where exists(select 1 from pg_policy where polrelid='public.live_agent_collaborations'::regclass and polname='live_collab_owner_read');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='request_live_agent_collaboration');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='activate_live_agent_collaboration');
select 1 as assertion where not exists(select 1 from public.live_agent_collaborations);
select 1 as assertion where not exists(select 1 from public.agents);
select 1 as assertion where not exists(select 1 from public.risk_assessments);