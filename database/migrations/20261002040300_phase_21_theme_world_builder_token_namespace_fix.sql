-- Phase 21 — token namespace regex hardening

create or replace function private.theme_tokens_safe(p_tokens jsonb) returns boolean
language plpgsql immutable set search_path=''
as $$
declare k text;
begin
  if jsonb_typeof(coalesce(p_tokens,'{}'::jsonb)) <> 'object' then return false; end if;
  for k in select jsonb_object_keys(coalesce(p_tokens,'{}'::jsonb)) loop
    if k !~ '^theme[.]' then return false; end if;
    if k ~ '^theme[.](security|permission|policy|risk|ownership|verification|reputation|audit)([.]|$)' then return false; end if;
  end loop;
  return true;
end $$;
