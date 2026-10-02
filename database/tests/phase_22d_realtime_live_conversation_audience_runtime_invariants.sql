-- Phase 22D invariants: realtime conversation and audience runtime foundation.
select 1 as assertion where to_regclass('public.live_session_messages') is not null;
select 1 as assertion where to_regclass('public.live_audience_interactions') is not null;
select 1 as assertion where exists(select 1 from pg_indexes where schemaname='public' and indexname='live_messages_session_created_idx');
select 1 as assertion where exists(select 1 from pg_indexes where schemaname='public' and indexname='live_audience_interactions_session_created_idx');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='join_live_session');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='leave_live_session');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='create_live_session_message');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='create_live_audience_interaction');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='broadcast_live_session_message');
select 1 as assertion where exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname='broadcast_live_audience_interaction');
select 1 as assertion where exists(select 1 from pg_policies where schemaname='realtime' and tablename='messages' and policyname='live_channel_read');
select 1 as assertion where exists(select 1 from pg_policies where schemaname='realtime' and tablename='messages' and policyname='live_channel_presence_write');
select 1 as assertion where not exists(select 1 from public.live_session_messages);
select 1 as assertion where not exists(select 1 from public.live_audience_interactions);