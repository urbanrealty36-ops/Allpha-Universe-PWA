-- Phase 27B — Analytics + Master Data invariants
do $$
declare v_public integer; v_auth integer;
begin
 if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='get_admin_analytics__allpha_sd' and p.prosecdef and 'search_path=""'=any(p.proconfig)) then raise exception '27B_ANALYTICS_SECURITY_DEF_HARDENING_FAILED'; end if;
 if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='get_admin_master_data__allpha_sd' and p.prosecdef and 'search_path=""'=any(p.proconfig)) then raise exception '27B_MASTER_DATA_SECURITY_DEF_HARDENING_FAILED'; end if;
 select count(*) into v_public from information_schema.routine_privileges where routine_schema='public' and grantee='PUBLIC' and privilege_type='EXECUTE' and routine_name in ('get_admin_analytics','get_admin_master_data');
 if v_public <> 0 then raise exception '27B_PUBLIC_EXECUTE_MUST_BE_REVOKED'; end if;
 select count(*) into v_auth from information_schema.routine_privileges where routine_schema='public' and grantee='authenticated' and privilege_type='EXECUTE' and routine_name in ('get_admin_analytics','get_admin_master_data');
 if v_auth <> 2 then raise exception '27B_AUTHENTICATED_EXECUTE_MISSING'; end if;
end $$;
select 'phase_27b_invariants_passed' as result;