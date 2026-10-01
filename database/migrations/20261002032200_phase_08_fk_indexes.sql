-- Phase 08 — covering indexes for foreign keys identified by Supabase advisor.
create index if not exists goal_interest_links_interest_idx on public.goal_interest_links(interest_id);
create index if not exists passion_cluster_interests_interest_idx on public.passion_cluster_interests(interest_id);
create index if not exists subject_interest_affinities_interest_idx on public.subject_interest_affinities(interest_id);
