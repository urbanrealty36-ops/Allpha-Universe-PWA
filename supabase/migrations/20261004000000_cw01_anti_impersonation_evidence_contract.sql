-- CW-01 Anti-Impersonation Evidence Contract Closure
-- Canonical boundary: existing anti_impersonation_evidence table; no second identity engine.

create or replace function public.get_anti_impersonation_evidence(p_subject_type text, p_subject_id uuid)
returns setof public.anti_impersonation_evidence
language sql
security invoker
set search_path = ''
as $$
  select e.*
  from public.anti_impersonation_evidence e
  where e.subject_type = p_subject_type
    and e.subject_id = p_subject_id
  order by e.created_at desc
$$;

revoke all on function public.get_anti_impersonation_evidence(text, uuid) from public;
grant execute on function public.get_anti_impersonation_evidence(text, uuid) to authenticated;

create or replace function private.record_anti_impersonation_evidence__allpha_sd(
  p_subject_type text,
  p_subject_id uuid,
  p_claim_type text,
  p_evidence jsonb default '{}'::jsonb,
  p_status text default 'active',
  p_verified_at timestamptz default now(),
  p_expires_at timestamptz default null
)
returns public.anti_impersonation_evidence
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.anti_impersonation_evidence;
begin
  if (select auth.uid()) is null then
    raise exception using errcode='42501', message='Authentication required';
  end if;
  if not private.has_platform_permission('admin.write'::text) then
    raise exception using errcode='42501', message='Admin permission required';
  end if;
  if p_subject_type not in ('user','agent') then
    raise exception using errcode='22023', message='Unsupported subject_type';
  end if;
  if p_claim_type is null or btrim(p_claim_type) = '' then
    raise exception using errcode='22023', message='claim_type is required';
  end if;
  if p_status not in ('active','revoked','expired') then
    raise exception using errcode='22023', message='Unsupported evidence status';
  end if;

  if p_subject_type = 'user' then
    if not exists (select 1 from auth.users u where u.id = p_subject_id) then
      raise exception using errcode='22023', message='User subject does not exist';
    end if;
  else
    if not exists (
      select 1 from public.agents a
      where a.id = p_subject_id
        and a.status <> 'archived'::public.agent_status
    ) then
      raise exception using errcode='22023', message='Agent subject does not exist or is archived';
    end if;
  end if;

  insert into public.anti_impersonation_evidence
    (subject_type,subject_id,claim_type,evidence,status,verified_at,expires_at)
  values
    (p_subject_type,p_subject_id,p_claim_type,coalesce(p_evidence,'{}'::jsonb),p_status,p_verified_at,p_expires_at)
  returning * into v_row;

  return v_row;
end
$$;

create or replace function public.record_anti_impersonation_evidence(
  p_subject_type text,
  p_subject_id uuid,
  p_claim_type text,
  p_evidence jsonb default '{}'::jsonb,
  p_status text default 'active',
  p_verified_at timestamptz default now(),
  p_expires_at timestamptz default null
)
returns public.anti_impersonation_evidence
language sql
security invoker
set search_path = ''
as $$
  select private.record_anti_impersonation_evidence__allpha_sd(
    p_subject_type,p_subject_id,p_claim_type,p_evidence,p_status,p_verified_at,p_expires_at
  )
$$;

revoke execute on function public.record_anti_impersonation_evidence(text,uuid,text,jsonb,text,timestamptz,timestamptz) from anon;
revoke execute on function public.record_anti_impersonation_evidence(text,uuid,text,jsonb,text,timestamptz,timestamptz) from public;
grant execute on function public.record_anti_impersonation_evidence(text,uuid,text,jsonb,text,timestamptz,timestamptz) to authenticated;

create or replace function public.evaluate_anti_impersonation_claim(
  p_subject_type text,
  p_subject_id uuid,
  p_claim_type text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  with evidence as (
    select e.*
    from public.anti_impersonation_evidence e
    where e.subject_type = p_subject_type
      and e.subject_id = p_subject_id
      and e.claim_type = p_claim_type
      and e.status = 'active'
      and e.verified_at is not null
      and (e.expires_at is null or e.expires_at > timezone('utc', now()))
    order by e.verified_at desc, e.created_at desc
    limit 1
  )
  select jsonb_build_object(
    'subject_type', p_subject_type,
    'subject_id', p_subject_id,
    'claim_type', p_claim_type,
    'verified', exists(select 1 from evidence),
    'evidence_id', (select id from evidence),
    'verified_at', (select verified_at from evidence),
    'expires_at', (select expires_at from evidence)
  )
$$;

revoke execute on function public.evaluate_anti_impersonation_claim(text,uuid,text) from anon;
revoke execute on function public.evaluate_anti_impersonation_claim(text,uuid,text) from public;
grant execute on function public.evaluate_anti_impersonation_claim(text,uuid,text) to authenticated;
