create or replace function private.audit_agent_identity_mutation()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_row jsonb; v_resource_id uuid; v_agent_id uuid;
begin
  v_row := case when TG_OP='DELETE' then to_jsonb(OLD) else to_jsonb(NEW) end;
  if TG_TABLE_NAME='agents' then
    v_resource_id := (v_row->>'id')::uuid;
    v_agent_id := v_resource_id;
  else
    v_resource_id := nullif(v_row->>'id','')::uuid;
    v_agent_id := nullif(v_row->>'agent_id','')::uuid;
  end if;
  insert into public.audit_logs(actor_user_id,actor_agent_id,action,resource_type,resource_id,outcome,metadata)
  values((select auth.uid()),v_agent_id,lower(TG_OP),TG_TABLE_NAME,v_resource_id,'success',
         jsonb_build_object('phase','06','source','database_trigger'));
  return case when TG_OP='DELETE' then OLD else NEW end;
end;
$$;

revoke execute on function private.audit_agent_identity_mutation() from public,anon,authenticated;

drop trigger if exists audit_agents_identity_mutation on public.agents;
create trigger audit_agents_identity_mutation after insert or update or delete on public.agents for each row execute function private.audit_agent_identity_mutation();
drop trigger if exists audit_agent_identities_mutation on public.agent_identities;
create trigger audit_agent_identities_mutation after insert or update or delete on public.agent_identities for each row execute function private.audit_agent_identity_mutation();
drop trigger if exists audit_agent_personas_mutation on public.agent_personas;
create trigger audit_agent_personas_mutation after insert or update or delete on public.agent_personas for each row execute function private.audit_agent_identity_mutation();
drop trigger if exists audit_agent_passports_mutation on public.agent_passports;
create trigger audit_agent_passports_mutation after insert or update or delete on public.agent_passports for each row execute function private.audit_agent_identity_mutation();
drop trigger if exists audit_agent_policies_mutation on public.agent_policies;
create trigger audit_agent_policies_mutation after insert or update or delete on public.agent_policies for each row execute function private.audit_agent_identity_mutation();
drop trigger if exists audit_agent_budgets_mutation on public.agent_budgets;
create trigger audit_agent_budgets_mutation after insert or update or delete on public.agent_budgets for each row execute function private.audit_agent_identity_mutation();
drop trigger if exists audit_agent_credentials_mutation on public.agent_credentials;
create trigger audit_agent_credentials_mutation after insert or update or delete on public.agent_credentials for each row execute function private.audit_agent_identity_mutation();
drop trigger if exists audit_agent_skills_mutation on public.agent_skills;
create trigger audit_agent_skills_mutation after insert or update or delete on public.agent_skills for each row execute function private.audit_agent_identity_mutation();
drop trigger if exists audit_agent_capabilities_mutation on public.agent_capabilities;
create trigger audit_agent_capabilities_mutation after insert or update or delete on public.agent_capabilities for each row execute function private.audit_agent_identity_mutation();
drop trigger if exists audit_agent_permissions_mutation on public.agent_permissions;
create trigger audit_agent_permissions_mutation after insert or update or delete on public.agent_permissions for each row execute function private.audit_agent_identity_mutation();