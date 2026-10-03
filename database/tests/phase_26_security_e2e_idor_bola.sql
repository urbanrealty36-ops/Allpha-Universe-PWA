-- Phase 26 Security E2E / IDOR-BOLA regression gate.
-- Run as database owner in a disposable/integration transaction.
begin;

do $$
declare
  v_owner uuid;
  v_fixture uuid := '00000000-0000-0000-0000-00000000a026';
  v_other uuid := '00000000-0000-0000-0000-00000000b026';
  v_count integer;
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
      and (has_function_privilege('anon',p.oid,'EXECUTE')
        or has_function_privilege('authenticated',p.oid,'EXECUTE'))
  ) then
    raise exception 'PHASE26_SECURITY_DEFINER_EXECUTE_GATE_FAILED';
  end if;

  if exists (
    select 1
    from pg_proc f join pg_namespace n on n.oid=f.pronamespace
    where n.nspname='private'
      and has_function_privilege('anon',f.oid,'EXECUTE')
      and f.proname not in (
        'discover_public_agent_accounts__allpha_sd',
        'discover_social_subjects__allpha_sd',
        'get_public_agent_account__allpha_sd',
        'get_public_live_human_presentation__allpha_sd'
      )
  ) then
    raise exception 'PHASE26_PRIVATE_ANON_EXECUTE_GATE_FAILED';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename in ('approval_requests','audit_logs','payout_accounts','payout_events','payout_requests','risk_assessments')
      and 'public'=any(roles)
  ) then
    raise exception 'PHASE26_SENSITIVE_PUBLIC_POLICY_GATE_FAILED';
  end if;

  if (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relrowsecurity
      and not exists(select 1 from pg_policies p where p.schemaname='public' and p.tablename=c.relname)) > 0 then
    raise exception 'PHASE26_RLS_POLICY_COVERAGE_FAILED';
  end if;

  select id into v_owner from auth.users order by created_at limit 1;
  if v_owner is null then raise exception 'PHASE26_SECURITY_E2E_REQUIRES_AUTH_FIXTURE'; end if;

  insert into public.agents(id,owner_user_id,name)
  values(v_fixture,v_owner,'PHASE26-IDOR-E2E-FIXTURE');

  -- Anonymous/cross-principal access must fail closed.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub',v_other::text,true);

  if exists(select 1 from public.agents where id=v_fixture) then
    raise exception 'PHASE26_IDOR_READ_FAILED';
  end if;

  update public.agents set name='ATTACK' where id=v_fixture;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'PHASE26_IDOR_UPDATE_FAILED'; end if;

  delete from public.agents where id=v_fixture;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'PHASE26_IDOR_DELETE_FAILED'; end if;

  -- Owner access must remain available.
  perform set_config('request.jwt.claim.sub',v_owner::text,true);
  if not exists(select 1 from public.agents where id=v_fixture) then
    raise exception 'PHASE26_OWNER_ACCESS_REGRESSION';
  end if;
end $$;

rollback;
