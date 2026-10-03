-- Phase 23E invariant suite. No business seed data.
begin;
select plan(12);
select ok(to_regclass('public.agent_collaboration_results') is not null,'collaboration result history table exists');
select ok(to_regclass('public.agent_collaboration_reviews') is not null,'collaboration review table exists');
select ok(to_regprocedure('public.record_agent_collaboration_result(uuid,text,text,jsonb,jsonb,uuid,uuid)') is not null,'result recording RPC exists');
select ok(to_regprocedure('public.submit_agent_collaboration_review(uuid,smallint,text,text,jsonb)') is not null,'review RPC exists');
select ok(to_regprocedure('public.get_agent_collaboration_history(uuid,integer)') is not null,'history RPC exists');
select ok(exists(select 1 from pg_policies where tablename='agent_collaboration_results' and policyname='agent_collaboration_results_participant_read'),'result participant RLS exists');
select ok(exists(select 1 from pg_policies where tablename='agent_collaboration_reviews' and policyname='agent_collaboration_reviews_participant_read'),'review participant RLS exists');
select ok(exists(select 1 from pg_indexes where tablename='agent_collaboration_results' and indexname='agent_collaboration_results_agreement_uidx'),'one result per agreement is constrained');
select ok(exists(select 1 from pg_indexes where tablename='agent_collaboration_reviews' and indexname='agent_collaboration_reviews_result_idx'),'review history index exists');
select is((select count(*) from public.agent_collaboration_results),0::bigint,'no fabricated collaboration results');
select is((select count(*) from public.agent_collaboration_reviews),0::bigint,'no fabricated collaboration reviews');
select is((select count(*) from public.agent_reputation_events where source_type='agent_collaboration_review'),0::bigint,'no fabricated collaboration reputation events');
select * from finish();
rollback;
