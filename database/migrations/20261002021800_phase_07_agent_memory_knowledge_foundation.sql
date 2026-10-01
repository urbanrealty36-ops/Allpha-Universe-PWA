-- Phase 07 — Agent Memory & Knowledge
-- Canonical migration for the memory/knowledge foundation.
-- Embedding dimensions remain provider/model controlled; no model-specific
-- dimension is hardcoded in the database.
create table if not exists public.agent_memory_embeddings (
  memory_id uuid primary key references public.agent_memory(id) on delete cascade,
  embedding extensions.vector,
  model text,
  dimensions integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (dimensions is null or dimensions > 0)
);

create table if not exists public.agent_memory_access_events (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.agent_memory(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  owner_user_id uuid not null references public.users(id) on delete cascade,
  access_type text not null check (access_type in ('retrieve','review','export')),
  purpose text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knowledge_access_events (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete cascade,
  owner_user_id uuid not null references public.users(id) on delete cascade,
  access_type text not null check (access_type in ('retrieve','review','export')),
  purpose text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.agent_memory add column if not exists retention_policy jsonb not null default '{}'::jsonb;
alter table public.agent_memory add column if not exists consent_basis text;
alter table public.agent_memory add column if not exists last_accessed_at timestamptz;
alter table public.agent_memory add column if not exists reviewed_at timestamptz;
alter table public.knowledge_items add column if not exists retention_policy jsonb not null default '{}'::jsonb;
alter table public.knowledge_items add column if not exists status text not null default 'active';
alter table public.knowledge_items drop constraint if exists knowledge_items_status_check;
alter table public.knowledge_items add constraint knowledge_items_status_check check (status in ('active','archived','deleted'));
alter table public.knowledge_items add column if not exists deleted_at timestamptz;
alter table public.knowledge_chunks add column if not exists source_locator jsonb not null default '{}'::jsonb;

create index if not exists agent_memory_embeddings_memory_id_idx on public.agent_memory_embeddings(memory_id);
create index if not exists agent_memory_access_events_memory_idx on public.agent_memory_access_events(memory_id,created_at desc);
create index if not exists agent_memory_access_events_agent_idx on public.agent_memory_access_events(agent_id,created_at desc);
create index if not exists agent_memory_access_events_owner_idx on public.agent_memory_access_events(owner_user_id,created_at desc);
create index if not exists knowledge_access_events_item_idx on public.knowledge_access_events(knowledge_item_id,created_at desc);
create index if not exists knowledge_access_events_agent_idx on public.knowledge_access_events(agent_id,created_at desc);
create index if not exists knowledge_access_events_owner_idx on public.knowledge_access_events(owner_user_id,created_at desc);
create index if not exists knowledge_items_agent_status_idx on public.knowledge_items(agent_id,status,updated_at desc);
create index if not exists knowledge_chunks_item_idx on public.knowledge_chunks(knowledge_item_id,chunk_index);

alter table public.agent_memory enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.agent_memory_embeddings enable row level security;
alter table public.agent_memory_access_events enable row level security;
alter table public.knowledge_access_events enable row level security;

revoke all on table public.agent_memory_embeddings,public.agent_memory_access_events,public.knowledge_access_events from anon,authenticated;
grant select,insert,update,delete on public.agent_memory_embeddings to authenticated;
grant select on public.agent_memory_access_events,public.knowledge_access_events to authenticated;

drop policy if exists agent_memory_owner_all on public.agent_memory;
create policy agent_memory_owner_all on public.agent_memory for all to authenticated
using(owner_user_id=(select auth.uid()))
with check(owner_user_id=(select auth.uid()) and exists(select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid())));

drop policy if exists knowledge_items_owner_all on public.knowledge_items;
create policy knowledge_items_owner_all on public.knowledge_items for all to authenticated
using(owner_user_id=(select auth.uid()))
with check(owner_user_id=(select auth.uid()) and (agent_id is null or exists(select 1 from public.agents a where a.id=agent_id and a.owner_user_id=(select auth.uid()))));

drop policy if exists knowledge_chunks_owner_all on public.knowledge_chunks;
create policy knowledge_chunks_owner_all on public.knowledge_chunks for all to authenticated
using(exists(select 1 from public.knowledge_items k where k.id=knowledge_item_id and k.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.knowledge_items k where k.id=knowledge_item_id and k.owner_user_id=(select auth.uid())));

drop policy if exists memory_embeddings_owner_all on public.agent_memory_embeddings;
create policy memory_embeddings_owner_all on public.agent_memory_embeddings for all to authenticated
using(exists(select 1 from public.agent_memory m where m.id=memory_id and m.owner_user_id=(select auth.uid())))
with check(exists(select 1 from public.agent_memory m where m.id=memory_id and m.owner_user_id=(select auth.uid())));

drop policy if exists memory_access_owner_select on public.agent_memory_access_events;
create policy memory_access_owner_select on public.agent_memory_access_events for select to authenticated
using(owner_user_id=(select auth.uid()));

drop policy if exists knowledge_access_owner_select on public.knowledge_access_events;
create policy knowledge_access_owner_select on public.knowledge_access_events for select to authenticated
using(owner_user_id=(select auth.uid()));

-- The remaining functions are deliberately database-authoritative:
-- create_agent_memory, create_knowledge_item, retrieve_agent_memory,
-- retrieve_agent_knowledge, review_agent_memory, delete_agent_memory,
-- delete_knowledge_item, expire_agent_memory and expire_agent_knowledge.
-- Their canonical definitions are maintained in this migration chain.
