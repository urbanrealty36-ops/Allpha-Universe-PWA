-- Phase 21 — consolidate canonical SELECT policies with platform moderation read

drop policy if exists themes_admin_select on public.themes;
drop policy if exists theme_versions_admin_select on public.theme_versions;
drop policy if exists theme_assets_admin_select on public.theme_assets;
drop policy if exists world_templates_admin_select on public.world_templates;
drop policy if exists world_template_versions_admin_select on public.world_template_versions;
drop policy if exists themes_select on public.themes;
drop policy if exists theme_versions_select on public.theme_versions;
drop policy if exists theme_assets_select on public.theme_assets;
drop policy if exists world_templates_select on public.world_templates;
drop policy if exists world_template_versions_select on public.world_template_versions;

create policy themes_select on public.themes for select to authenticated using (
  private.has_platform_permission('admin.manage') or private.theme_owner(id) or (status='published' and moderation_status='approved')
);

create policy theme_versions_select on public.theme_versions for select to authenticated using (
  private.has_platform_permission('admin.manage') or private.theme_owner(theme_id) or exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.moderation_status='approved')
);

create policy theme_assets_select on public.theme_assets for select to authenticated using (
  private.has_platform_permission('admin.manage') or private.theme_owner(theme_id) or exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.moderation_status='approved')
);

create policy world_templates_select on public.world_templates for select to authenticated using (
  private.has_platform_permission('admin.manage') or private.world_template_owner(id) or (status='published' and moderation_status='approved')
);

create policy world_template_versions_select on public.world_template_versions for select to authenticated using (
  private.has_platform_permission('admin.manage') or private.world_template_owner(world_template_id) or exists(select 1 from public.world_templates t where t.id=world_template_id and t.status='published' and t.moderation_status='approved')
);
