-- Phase 27A invariants: no business data is created.
do $$
declare rls_flags boolean; rls_configs boolean; policy_count integer; public_exec_count integer;
begin
 select relrowsecurity into rls_flags from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='platform_feature_flags';
 select relrowsecurity into rls_configs from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='platform_config_versions';
 if not rls_flags or not rls_configs then raise exception '27A_RLS_FAILED'; end if;
 select count(*) into policy_count from pg_policies where schemaname='public' and tablename in ('platform_feature_flags','platform_config_versions');
 if policy_count <> 0 then raise exception '27A_CLIENT_POLICIES_MUST_BE_FAIL_CLOSED'; end if;
 select count(*) into public_exec_count from information_schema.routine_privileges where routine_schema='public' and grantee='PUBLIC' and privilege_type='EXECUTE' and routine_name in ('get_admin_control_plane_overview','get_admin_feature_flags','upsert_admin_feature_flag','get_admin_config_versions','create_admin_config_version','publish_admin_config_version');
 if public_exec_count <> 0 then raise exception '27A_PUBLIC_EXECUTE_MUST_BE_REVOKED'; end if;
 if not exists (select 1 from information_schema.routine_privileges where routine_schema='public' and grantee='authenticated' and routine_name='get_admin_control_plane_overview' and privilege_type='EXECUTE') then raise exception '27A_AUTHENTICATED_EXECUTE_MISSING'; end if;
 if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='get_admin_control_plane_overview__allpha_sd' and p.prosecdef and 'search_path=""' = any(p.proconfig)) then raise exception '27A_PRIVATE_SECURITY_DEFINER_HARDENING_FAILED'; end if;
end $$;
select 'phase_27a_invariants_passed' as result;