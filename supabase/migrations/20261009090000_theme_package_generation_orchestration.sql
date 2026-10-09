create table if not exists public.theme_generation_packages (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  theme_name text not null check (length(theme_name) between 1 and 160),
  theme_direction text not null check (length(theme_direction) between 1 and 2000),
  status text not null default 'queued' check (status in ('queued','running','partial','succeeded','failed','cancelled')),
  idempotency_key text not null check (length(idempotency_key) between 8 and 255),
  provider text not null default 'tripo',
  workflow_run_id uuid null references public.workflow_runs(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  unique(owner_user_id, idempotency_key)
);
create index if not exists theme_generation_packages_owner_created_idx on public.theme_generation_packages(owner_user_id, created_at desc);
create index if not exists theme_generation_packages_status_idx on public.theme_generation_packages(status, updated_at);
create table if not exists public.theme_generation_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.theme_generation_packages(id) on delete cascade,
  owner_user_id uuid not null references public.users(id) on delete cascade,
  asset_key text not null check (length(asset_key) between 1 and 80),
  asset_label text not null check (length(asset_label) between 1 and 160),
  prompt text not null check (length(prompt) between 8 and 1024),
  provider_task_id text null,
  status text not null default 'queued' check (status in ('queued','submitting','running','success','failed','cancelled')),
  progress integer null check (progress between 0 and 100),
  model_url text null,
  preview_url text null,
  error_code text null,
  error_message text null,
  retry_count integer not null default 0 check (retry_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(package_id, asset_key),
  unique(provider_task_id)
);
create index if not exists theme_generation_items_package_idx on public.theme_generation_items(package_id, created_at);
create index if not exists theme_generation_items_owner_idx on public.theme_generation_items(owner_user_id, created_at desc);
alter table public.theme_generation_packages enable row level security;
alter table public.theme_generation_items enable row level security;
drop policy if exists theme_generation_packages_owner_read on public.theme_generation_packages;
create policy theme_generation_packages_owner_read on public.theme_generation_packages for select to authenticated using (owner_user_id = auth.uid());
drop policy if exists theme_generation_items_owner_read on public.theme_generation_items;
create policy theme_generation_items_owner_read on public.theme_generation_items for select to authenticated using (owner_user_id = auth.uid());
revoke all on public.theme_generation_packages from anon, authenticated;
revoke all on public.theme_generation_items from anon, authenticated;
grant select on public.theme_generation_packages to authenticated;
grant select on public.theme_generation_items to authenticated;
