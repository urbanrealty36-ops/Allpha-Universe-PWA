-- Phase 18 Spatial Runtime Adapter invariants. Read-only.
do $$
declare n integer;
begin
  select count(*) into n from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='agent_spatial_states';
  if n <> 1 then raise exception 'AGENT_SPATIAL_STATES_REALTIME_PUBLICATION_MISSING'; end if;

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
  where ns.nspname='public' and p.proname='update_agent_spatial_state'
    and p.prosecdef=true;
  if n <> 1 then raise exception 'SPATIAL_UPDATE_RPC_MISSING'; end if;
end $$;

select
  (select count(*) from public.agent_spatial_states) as spatial_states,
  (select count(*) from public.spatial_runtime_events) as spatial_events,
  (select count(*) from public.universe_agent_presences) as universe_presences,
  (select count(*) from public.agent_memory) as agent_memory,
  (select count(*) from public.knowledge_items) as knowledge_items;
