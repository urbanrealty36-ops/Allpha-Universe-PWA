do $$
declare n integer;
begin
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='agent_memory';
  if n<>1 then raise exception 'AGENT_MEMORY_TABLE_MISSING'; end if;
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='agent_memory_embeddings';
  if n<>1 then raise exception 'AGENT_MEMORY_EMBEDDINGS_TABLE_MISSING'; end if;
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='knowledge_items';
  if n<>1 then raise exception 'KNOWLEDGE_ITEMS_TABLE_MISSING'; end if;
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='knowledge_chunks';
  if n<>1 then raise exception 'KNOWLEDGE_CHUNKS_TABLE_MISSING'; end if;
  select count(*) into n from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname='retrieve_agent_memory';
  if n<>1 then raise exception 'MEMORY_RETRIEVAL_RPC_MISSING'; end if;
  select count(*) into n from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname='retrieve_agent_knowledge';
  if n<>1 then raise exception 'KNOWLEDGE_RETRIEVAL_RPC_MISSING'; end if;
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='ai_gateway_requests';
  if n<>1 then raise exception 'AI_GATEWAY_TABLE_MISSING'; end if;
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='agent_execution_contexts';
  if n<>1 then raise exception 'AGENT_EXECUTION_CONTEXTS_MISSING'; end if;
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='workflow_runs';
  if n<>1 then raise exception 'WORKFLOW_RUNS_MISSING'; end if;
  select count(*) into n from information_schema.tables where table_schema='public' and table_name='mission_runs';
  if n<>1 then raise exception 'MISSION_RUNS_MISSING'; end if;
end $$;
select
 (select count(*) from public.agent_memory) as agent_memory_rows,
 (select count(*) from public.agent_memory_embeddings) as memory_embedding_rows,
 (select count(*) from public.knowledge_items) as knowledge_rows,
 (select count(*) from public.knowledge_chunks) as knowledge_chunk_rows,
 (select count(*) from public.ai_gateway_requests) as gateway_requests,
 (select count(*) from public.agent_execution_contexts) as execution_contexts,
 (select count(*) from public.agent_spatial_states) as spatial_states;