-- Phase 21 — platform moderation read boundary

create policy themes_admin_select on public.themes
for select to authenticated
using (private.has_platform_permission('admin.manage'));

create policy theme_versions_admin_select on public.theme_versions
for select to authenticated
using (private.has_platform_permission('admin.manage'));

create policy theme_assets_admin_select on public.theme_assets
for select to authenticated
using (private.has_platform_permission('admin.manage'));

create policy world_templates_admin_select on public.world_templates
for select to authenticated
using (private.has_platform_permission('admin.manage'));

create policy world_template_versions_admin_select on public.world_template_versions
for select to authenticated
using (private.has_platform_permission('admin.manage'));
