-- Phase 11A.8 Optional Agent Companion invariants.
-- Read-only contract; no business data is inserted.

do $$
begin
  if to_regclass('public.agents') is null then raise exception 'agents table missing'; end if;
  if to_regclass('public.content_items') is null then raise exception 'content_items table missing'; end if;
  if to_regprocedure('public.record_feed_interaction(uuid, text, text, integer, bigint, jsonb)') is null then raise exception 'record_feed_interaction RPC missing'; end if;
end $$;

select
  (select count(*) from public.agents) as agents,
  (select count(*) from public.content_items) as content_items,
  (select count(*) from public.feed_interaction_events) as feed_interaction_events;
