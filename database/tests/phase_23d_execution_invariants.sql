-- Phase 23D invariants
select count(*)=1 as binding_column from information_schema.columns where table_schema='public' and table_name='agent_commands' and column_name='collaboration_agreement_id';
select has_function_privilege('anon','public.create_collaboration_execution_command(uuid,text,text[],text)','EXECUTE')=false as anon_denied;
select has_function_privilege('authenticated','public.create_collaboration_execution_command(uuid,text,text[],text)','EXECUTE')=true as authenticated_allowed;
select count(*)=0 as no_seed_collaboration_commands from public.agent_commands where collaboration_agreement_id is not null;