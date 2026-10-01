create index if not exists agent_memory_embeddings_memory_id_idx on public.agent_memory_embeddings(memory_id);
create index if not exists agent_memory_access_events_owner_idx on public.agent_memory_access_events(owner_user_id,created_at desc);
create index if not exists knowledge_access_events_agent_idx on public.knowledge_access_events(agent_id,created_at desc);
create index if not exists knowledge_access_events_owner_idx on public.knowledge_access_events(owner_user_id,created_at desc);