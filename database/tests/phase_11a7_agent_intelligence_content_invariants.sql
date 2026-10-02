-- Phase 11A.7 Agent Intelligence invariants.
-- Read-only verification contract; no business data is inserted.

do $$
begin
  if to_regclass('public.agents') is null then raise exception 'agents table missing'; end if;
  if to_regclass('public.agent_passports') is null then raise exception 'agent_passports table missing'; end if;
  if to_regclass('public.agent_capabilities') is null then raise exception 'agent_capabilities table missing'; end if;
  if to_regclass('public.agent_policies') is null then raise exception 'agent_policies table missing'; end if;
  if to_regclass('public.content_items') is null then raise exception 'content_items table missing'; end if;
  if to_regclass('public.ai_capsules') is null then raise exception 'ai_capsules table missing'; end if;
  if to_regclass('public.content_topic_links') is null then raise exception 'content_topic_links table missing'; end if;
  if to_regprocedure('public.retrieve_agent_memory(uuid, vector, integer)') is null then raise exception 'retrieve_agent_memory RPC missing'; end if;
  if to_regprocedure('public.retrieve_agent_knowledge(uuid, vector, integer)') is null then raise exception 'retrieve_agent_knowledge RPC missing'; end if;
  if to_regprocedure('public.record_feed_interaction(uuid, text, text, integer, bigint, jsonb)') is null then raise exception 'record_feed_interaction RPC missing'; end if;
end $$;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'agents',
    'agent_passports',
    'agent_capabilities',
    'agent_policies',
    'content_items',
    'ai_capsules',
    'content_topic_links'
  )
order by c.relname;
