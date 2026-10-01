alter table public.agent_credentials alter column status set default 'pending';

create or replace function private.guard_agent_identity_verification()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if not (select private.has_platform_permission('admin.manage')) then
    if TG_TABLE_NAME='agent_identities' and NEW.verification_status in ('verified','revoked') then raise exception using errcode='42501',message='Verification status is server-authoritative'; end if;
    if TG_TABLE_NAME='agent_passports' and NEW.verification_status in ('verified','revoked') then raise exception using errcode='42501',message='Passport verification status is server-authoritative'; end if;
    if TG_TABLE_NAME='agent_credentials' and NEW.status in ('active','expired','revoked') then raise exception using errcode='42501',message='Credential verification status is server-authoritative'; end if;
  end if;
  return NEW;
end;
$$;

revoke execute on function private.guard_agent_identity_verification() from public,anon,authenticated;

drop trigger if exists guard_agent_identity_verification on public.agent_identities;
create trigger guard_agent_identity_verification before insert or update on public.agent_identities for each row execute function private.guard_agent_identity_verification();
drop trigger if exists guard_agent_passport_verification on public.agent_passports;
create trigger guard_agent_passport_verification before insert or update on public.agent_passports for each row execute function private.guard_agent_identity_verification();
drop trigger if exists guard_agent_credential_verification on public.agent_credentials;
create trigger guard_agent_credential_verification before insert or update on public.agent_credentials for each row execute function private.guard_agent_identity_verification();