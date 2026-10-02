do $$
declare n integer;
begin
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='subject_interest_affinities';
  if n<>1 then raise exception 'SUBJECT_INTEREST_AFFINITIES_MISSING'; end if;
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='passion_clusters';
  if n<>1 then raise exception 'PASSION_CLUSTERS_MISSING'; end if;
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='habit_patterns';
  if n<>1 then raise exception 'HABIT_PATTERNS_MISSING'; end if;
  select count(*) into n from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname='retrieve_agent_memory';
  if n<>1 then raise exception 'MEMORY_RETRIEVAL_RPC_MISSING'; end if;
  select count(*) into n from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname='retrieve_agent_knowledge';
  if n<>1 then raise exception 'KNOWLEDGE_RETRIEVAL_RPC_MISSING'; end if;
end $$;
select
 (select count(*) from public.agent_memory) as agent_memory_rows,
 (select count(*) from public.agent_memory_embeddings) as memory_embedding_rows,
 (select count(*) from public.knowledge_items) as knowledge_rows,
 (select count(*) from public.knowledge_chunks) as knowledge_chunk_rows,
 (select count(*) from public.subject_interest_affinities) as affinity_rows,
 (select count(*) from public.passion_clusters) as passion_rows,
 (select count(*) from public.habit_patterns) as habit_rows;
