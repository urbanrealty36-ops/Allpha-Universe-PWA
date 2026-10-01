-- Phase 05 Identity/AuthZ invariant tests.
-- No user, organization, or other business records are inserted.

select extensions.plan(9);

select extensions.has_table('public', 'platform_roles', 'platform roles table exists');
select extensions.has_table('public', 'permissions', 'permissions table exists');
select extensions.has_table('public', 'user_roles', 'user roles table exists');
select extensions.has_table('public', 'organization_member_roles', 'organization member roles table exists');
select extensions.has_index('public', 'user_roles', 'user_roles_role_idx', 'user role lookup index exists');
select extensions.has_index('public', 'user_roles', 'user_roles_expiry_idx', 'user role expiry index exists');

select extensions.results_eq(
  $$select count(*)::bigint from public.platform_roles where key in ('user','platform_admin','super_admin')$$,
  $$select 3::bigint$$,
  'canonical platform roles are configured'
);

select extensions.results_eq(
  $$select count(*)::bigint from public.permissions where key in ('profile.read_self','profile.write_self','organization.read','agent.read_self','agent.manage_self','admin.read','admin.manage')$$,
  $$select 7::bigint$$,
  'canonical permissions are configured'
);

select extensions.results_eq(
  $$select count(*)::bigint from pg_policies where schemaname='public' and tablename='user_roles' and policyname='user_roles_self_select'$$,
  $$select 1::bigint$$,
  'user roles are self-readable only'
);

select extensions.finish(true);
