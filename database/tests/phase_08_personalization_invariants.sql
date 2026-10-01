begin;

select plan(37);

select has_table('public', 'interest_nodes', 'interest ontology table exists');
select has_table('public', 'interest_edges', 'interest edge graph exists');
select has_table('public', 'personalization_signals', 'personalization signal table exists');
select has_table('public', 'subject_interest_affinities', 'interest affinity table exists');
select has_table('public', 'passion_clusters', 'passion cluster table exists');
select has_table('public', 'passion_cluster_interests', 'passion membership table exists');
select has_table('public', 'habit_patterns', 'habit pattern table exists');
select has_table('public', 'personalization_goals', 'goal graph table exists');
select has_table('public', 'goal_interest_links', 'goal-interest link table exists');

select col_is_pk('public', 'interest_nodes', 'id', 'interest node has primary key');
select col_is_fk('public', 'passion_clusters', 'source_interest_id', 'passion source is foreign keyed to ontology');
select col_is_unique('public', 'interest_nodes', 'canonical_key', 'interest canonical key is unique');
select col_is_fk('public', 'interest_edges', 'source_interest_id', 'interest edge source is foreign keyed');
select col_is_fk('public', 'interest_edges', 'target_interest_id', 'interest edge target is foreign keyed');
select col_is_fk('public', 'personalization_signals', 'interest_id', 'signal interest is foreign keyed');
select col_is_fk('public', 'subject_interest_affinities', 'interest_id', 'affinity interest is foreign keyed');
select col_is_fk('public', 'passion_cluster_interests', 'passion_id', 'passion membership references passion');
select col_is_fk('public', 'passion_cluster_interests', 'interest_id', 'passion membership references interest');
select col_is_fk('public', 'goal_interest_links', 'goal_id', 'goal link references goal');
select col_is_fk('public', 'goal_interest_links', 'interest_id', 'goal link references interest');

select is((select relrowsecurity from pg_class where oid='public.interest_nodes'::regclass), true, 'interest ontology RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.personalization_signals'::regclass), true, 'personalization signal RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.subject_interest_affinities'::regclass), true, 'interest affinity RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.passion_clusters'::regclass), true, 'passion cluster RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.habit_patterns'::regclass), true, 'habit pattern RLS enabled');
select is((select relrowsecurity from pg_class where oid='public.personalization_goals'::regclass), true, 'goal graph RLS enabled');

select has_function('public', 'set_subject_interest', array['text','uuid','uuid','numeric','numeric'], 'set interest RPC exists');
select has_function('public', 'remove_subject_interest', array['text','uuid','uuid'], 'remove interest RPC exists');
select has_function('public', 'record_personalization_signal', array['text','uuid','text','uuid','text','uuid','numeric','timestamp with time zone','jsonb','jsonb'], 'signal ingestion RPC exists');
select has_function('public', 'refresh_subject_personalization', array['text','uuid'], 'derived personalization refresh RPC exists');
select has_function('public', 'create_personalization_goal', array['text','uuid','text','text','text','integer','timestamp with time zone','jsonb','jsonb'], 'goal creation RPC exists');

select is((select count(*) from public.interest_nodes), 0::bigint, 'no interest taxonomy seed data');
select is((select count(*) from public.personalization_signals), 0::bigint, 'no personalization signal seed data');
select is((select count(*) from public.subject_interest_affinities), 0::bigint, 'no affinity seed data');
select is((select count(*) from public.passion_clusters), 0::bigint, 'no passion seed data');
select is((select count(*) from public.habit_patterns), 0::bigint, 'no habit seed data');
select is((select count(*) from public.personalization_goals), 0::bigint, 'no goal seed data');

select * from finish();
rollback;
