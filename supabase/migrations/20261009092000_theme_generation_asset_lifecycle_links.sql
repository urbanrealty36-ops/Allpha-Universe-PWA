alter table public.theme_generation_packages add column if not exists theme_id uuid references public.themes(id) on delete set null, add column if not exists theme_version_id uuid references public.theme_versions(id) on delete set null;
alter table public.theme_generation_items add column if not exists storage_path text, add column if not exists theme_asset_id uuid references public.theme_assets(id) on delete set null;
alter table public.workflow_runs alter column agent_id drop not null;
