-- CW-02: fix agent verification trigger dispatch.
-- The previous implementation used short-circuit boolean expressions against NEW.status
-- inside a shared trigger function. PostgreSQL evaluated the invalid field reference
-- for agent_identities/agent_passports, blocking Agent Factory creation.
-- Branch by trigger table before touching table-specific NEW fields.

create or replace function private.guard_agent_identity_verification()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not (select private.has_platform_permission('admin.manage')) then
    if TG_TABLE_NAME = 'agent_identities' then
      if NEW.verification_status in ('verified','revoked') then
        raise exception using errcode='42501',message='Verification status is server-authoritative';
      end if;
    elsif TG_TABLE_NAME = 'agent_passports' then
      if NEW.verification_status in ('verified','revoked') then
        raise exception using errcode='42501',message='Passport verification status is server-authoritative';
      end if;
    elsif TG_TABLE_NAME = 'agent_credentials' then
      if NEW.status in ('active','expired','revoked') then
        raise exception using errcode='42501',message='Credential verification status is server-authoritative';
      end if;
    end if;
  end if;
  return NEW;
end;
$function$;
