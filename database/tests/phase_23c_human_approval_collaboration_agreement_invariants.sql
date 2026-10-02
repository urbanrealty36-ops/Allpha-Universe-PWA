-- Phase 23C invariant checks. No business seed data.
select count(*) = 1 as agreement_table_exists
from information_schema.tables
where table_schema='public' and table_name='agent_collaboration_agreements';

select count(*) = 1 as agreement_event_table_exists
from information_schema.tables
where table_schema='public' and table_name='agent_collaboration_agreement_events';

select relrowsecurity and relforcerowsecurity as agreements_rls_and_force_rls
from pg_class
where relnamespace='public'::regnamespace and relname='agent_collaboration_agreements';

select relrowsecurity and relforcerowsecurity as events_rls_and_force_rls
from pg_class
where relnamespace='public'::regnamespace and relname='agent_collaboration_agreement_events';

select count(*) = 1 as agreement_participant_policy
from pg_policies
where schemaname='public' and tablename='agent_collaboration_agreements'
  and policyname='agent_collab_agreements_participant_select';

select count(*) = 1 as agreement_event_participant_policy
from pg_policies
where schemaname='public' and tablename='agent_collaboration_agreement_events'
  and policyname='agent_collab_agreement_events_participant_select';

select count(*) = 3 as agreement_functions
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'create_agent_collaboration_agreement',
    'decide_agent_collaboration_agreement_approval',
    'cancel_agent_collaboration_agreement'
  );

select count(*) = 3 as authenticated_execute
from information_schema.routine_privileges
where specific_schema='public'
  and routine_name in (
    'create_agent_collaboration_agreement',
    'decide_agent_collaboration_agreement_approval',
    'cancel_agent_collaboration_agreement'
  )
  and grantee='authenticated'
  and privilege_type='EXECUTE';

select count(*) = 0 as anon_execute
from information_schema.routine_privileges
where specific_schema='public'
  and routine_name in (
    'create_agent_collaboration_agreement',
    'decide_agent_collaboration_agreement_approval',
    'cancel_agent_collaboration_agreement'
  )
  and grantee='anon'
  and privilege_type='EXECUTE';

select count(*) = 0 as no_seed_agreements
from public.agent_collaboration_agreements;

select count(*) = 0 as no_seed_agreement_events
from public.agent_collaboration_agreement_events;

select count(*) = 0 as no_orphan_agreements
from public.agent_collaboration_agreements a
left join public.agent_collaboration_requests r on r.id=a.collaboration_request_id
left join public.agent_collaboration_negotiations n on n.id=a.negotiation_id
where r.id is null or n.id is null;
