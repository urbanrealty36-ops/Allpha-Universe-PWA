-- Add least-privilege read policies for platform configuration control-plane tables.
-- Writes remain backend/service-role controlled.

create policy platform_config_versions_admin_select
on public.platform_config_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    join public.platform_roles pr on pr.id = ur.role_id
    where ur.user_id = (select auth.uid())
      and pr.key in ('platform_admin','super_admin')
  )
);

create policy platform_feature_flags_admin_select
on public.platform_feature_flags
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    join public.platform_roles pr on pr.id = ur.role_id
    where ur.user_id = (select auth.uid())
      and pr.key in ('platform_admin','super_admin')
  )
);
