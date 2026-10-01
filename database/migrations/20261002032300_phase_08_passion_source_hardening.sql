-- Phase 08 — bind derived passion clusters to ontology parent identity.
alter table public.passion_clusters
  add column if not exists source_interest_id uuid references public.interest_nodes(id) on delete set null;

drop index if exists public.passion_cluster_user_name_uq;
drop index if exists public.passion_cluster_agent_name_uq;

create unique index if not exists passion_cluster_user_source_uq
  on public.passion_clusters(user_id, source_interest_id)
  where user_id is not null and source_interest_id is not null;

create unique index if not exists passion_cluster_agent_source_uq
  on public.passion_clusters(agent_id, source_interest_id)
  where agent_id is not null and source_interest_id is not null;

create index if not exists passion_cluster_source_idx
  on public.passion_clusters(source_interest_id);

-- The refresh_subject_personalization function is the canonical derived-intelligence
-- implementation recorded in the live Supabase migration. Do not create a shadow
-- implementation here; use the live migration history as the source when replaying
-- this function definition.
