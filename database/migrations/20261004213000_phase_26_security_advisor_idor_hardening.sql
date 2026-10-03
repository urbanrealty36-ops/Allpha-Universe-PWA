begin;

create schema if not exists private;

do $$
declare
  r record;
  call_list text;
  return_clause text;
  select_body text;
  volatility_clause text;
  identity_types text;
  private_name text;
begin
  for r in
    select p.oid,p.proname,oidvectortypes(p.proargtypes) identity_types,
           pg_get_function_arguments(p.oid) arguments,pg_get_function_result(p.oid) result_clause,
           p.proretset,p.provolatile,
           has_function_privilege('anon',p.oid,'EXECUTE') anon_exec,
           has_function_privilege('authenticated',p.oid,'EXECUTE') auth_exec,
           has_function_privilege('service_role',p.oid,'EXECUTE') service_exec
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prokind='f' and p.prosecdef=true
      and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))
    order by p.oid
  loop
    private_name := r.proname || '__allpha_sd';
    identity_types := r.identity_types;

    if to_regprocedure(format('private.%I(%s)',private_name,identity_types)) is not null then
      raise exception 'PRIVATE_TARGET_COLLISION: public.%I(%s)',r.proname,identity_types;
    end if;

    execute format('alter function public.%I(%s) rename to %I',r.proname,identity_types,private_name);
    execute format('alter function public.%I(%s) set schema private',private_name,identity_types);

    select string_agg('$'||i::text,', ' order by i)
      into call_list
      from generate_series(1,coalesce(cardinality((select proargtypes from pg_proc where oid=r.oid)),0)) g(i);
    call_list := coalesce(call_list,'');

    return_clause := coalesce('RETURNS '||r.result_clause,'RETURNS void');
    volatility_clause := case r.provolatile when 'i' then 'IMMUTABLE' when 's' then 'STABLE' else 'VOLATILE' end;
    select_body := case when r.proretset
      then format('SELECT * FROM private.%I(%s)',private_name,call_list)
      else format('SELECT private.%I(%s)',private_name,call_list)
    end;

    execute format(
      'create function public.%I(%s) %s language sql %s security invoker set search_path = '''' as $wrapper$ %s $wrapper$',
      r.proname,r.arguments,return_clause,volatility_clause,select_body
    );

    execute format('revoke all on function private.%I(%s) from public',private_name,identity_types);
    execute format('grant execute on function private.%I(%s) to authenticated',private_name,identity_types);
    execute format('grant execute on function private.%I(%s) to anon',private_name,identity_types);
    execute format('grant execute on function private.%I(%s) to service_role',private_name,identity_types);

    execute format('revoke all on function public.%I(%s) from public',r.proname,identity_types);
    if r.anon_exec then execute format('grant execute on function public.%I(%s) to anon',r.proname,identity_types); end if;
    if r.auth_exec then execute format('grant execute on function public.%I(%s) to authenticated',r.proname,identity_types); end if;
    if r.service_exec then execute format('grant execute on function public.%I(%s) to service_role',r.proname,identity_types); end if;
  end loop;
end
$$;

do $$
declare r record;
begin
  for r in
    select p.proname,oidvectortypes(p.proargtypes) identity_types
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prokind='f' and not p.prosecdef
      and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))
  loop
    execute format('alter function public.%I(%s) set search_path = ''''',r.proname,r.identity_types);
  end loop;
end
$$;

do $$
declare t text;
begin
  foreach t in array array['idempotency_keys','policy_rules','security_events']
  loop
    execute format('drop policy if exists "deny_client_access_%s" on public.%I',t,t);
    execute format('create policy "deny_client_access_%s" on public.%I for all to anon, authenticated using (false) with check (false)',t,t);
  end loop;
end
$$;

create or replace function private.security_idor_audit()
returns table(schema_name text,table_name text,rls_enabled boolean,policy_count bigint,has_user_id_column boolean,has_owner_id_column boolean,has_subject_id_column boolean,authz_policy_signal boolean,risk text)
language sql security definer set search_path='' stable
as $$
  select n.nspname,c.relname,c.relrowsecurity,count(pol.oid)::bigint,
    exists(select 1 from pg_attribute a where a.attrelid=c.oid and a.attname in ('user_id','created_by_user_id')),
    exists(select 1 from pg_attribute a where a.attrelid=c.oid and a.attname in ('owner_id','seller_owner_user_id')),
    exists(select 1 from pg_attribute a where a.attrelid=c.oid and a.attname in ('subject_id','subject_user_id')),
    exists(select 1 from pg_policy p2 where p2.polrelid=c.oid and (
      pg_get_expr(p2.polqual,p2.polrelid) ilike '%auth.uid%' or pg_get_expr(p2.polwithcheck,p2.polrelid) ilike '%auth.uid%'
      or pg_get_expr(p2.polqual,p2.polrelid) ilike '%private.%' or pg_get_expr(p2.polwithcheck,p2.polrelid) ilike '%private.%')),
    case
      when not c.relrowsecurity then 'CRITICAL'
      when count(pol.oid)=0 then 'HIGH'
      when exists(select 1 from pg_policy pw where pw.polrelid=c.oid and pw.polcmd in ('a','w','d'))
       and exists(select 1 from pg_attribute a where a.attrelid=c.oid and a.attname in ('user_id','created_by_user_id','owner_id','seller_owner_user_id','subject_id','subject_user_id'))
       and not exists(select 1 from pg_policy p3 where p3.polrelid=c.oid and p3.polcmd in ('a','w','d') and (
         pg_get_expr(p3.polqual,p3.polrelid) ilike '%auth.uid%' or pg_get_expr(p3.polwithcheck,p3.polrelid) ilike '%auth.uid%'
         or pg_get_expr(p3.polqual,p3.polrelid) ilike '%private.%' or pg_get_expr(p3.polwithcheck,p3.polrelid) ilike '%private.%')) then 'HIGH'
      else 'CONTROLLED'
    end
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  left join pg_policy pol on pol.polrelid=c.oid
  where n.nspname='public' and c.relkind='r'
  group by n.nspname,c.relname,c.relrowsecurity,c.oid
  order by 9 desc,3,2;
$$;

revoke all on function private.security_idor_audit() from public,anon,authenticated;
grant execute on function private.security_idor_audit() to service_role;
grant usage on schema private to anon,authenticated,service_role;

notify pgrst,'reload schema';
commit;
