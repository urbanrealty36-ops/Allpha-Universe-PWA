-- Phase 06 invariants. No business/user seed data.
select plan(18);

select has_table('public','agent_identities','AI identity table exists');
select has_table('public','agent_credentials','Agent credentials table exists');
select has_table('public','agent_budgets','Agent budgets table exists');
select has_table('public','agent_reputation_events','Agent reputation event table exists');

select has_column('public','agent_identities','agent_id','AI identity links to Agent');
select has_column('public','agent_credentials','agent_id','Credentials link to Agent');
select has_column('public','agent_budgets','agent_id','Budget links to Agent');
select has_column('public','agent_reputation_events','agent_id','Reputation events link to Agent');

select has_index('public','agent_credentials_agent_idx','Credentials are indexed by Agent');
select has_index('public','agent_reputation_events_agent_occurred_idx','Reputation history is indexed by Agent/time');
select has_index('public','agent_budgets_enabled_idx','Budget state is indexed');

select policies_are('public','agent_identities',ARRAY['agent_identities_owner_all'],'AI identity has owner policy');
select policies_are('public','agent_credentials',ARRAY['agent_credentials_owner_all'],'Credentials have owner policy');
select policies_are('public','agent_budgets',ARRAY['agent_budgets_owner_all'],'Budgets have owner policy');
select policies_are('public','agent_reputation_events',ARRAY['agent_reputation_events_owner_select'],'Reputation is owner-readable only');
select policies_are('public','agent_passports',ARRAY['agent_passports_owner_all'],'Passport has owner policy');

select has_function('public','create_agent_identity','Agent creation transaction exists');

select * from finish();
