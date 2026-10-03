create table if not exists public.user_characters (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  character_key text not null, display_name text, appearance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb, status text not null default 'active' check (status in ('active','archived')),
  equipped boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, character_key)
);
create unique index if not exists user_characters_one_equipped_idx on public.user_characters(user_id) where equipped = true;
create index if not exists user_characters_user_id_idx on public.user_characters(user_id);

create table if not exists public.uniform_catalog (
  id uuid primary key default gen_random_uuid(), uniform_key text not null unique, name text not null, description text,
  asset_type text not null default '3d_scene' check (asset_type in ('3d_scene','model','texture','image')),
  storage_bucket text, storage_path text, mime_type text, checksum_sha256 text,
  theme_compatibility jsonb not null default '{}'::jsonb, metadata jsonb not null default '{}'::jsonb,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists uniform_catalog_status_idx on public.uniform_catalog(status, moderation_status);

create table if not exists public.user_uniforms (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  uniform_id uuid not null references public.uniform_catalog(id) on delete restrict, acquired_via text not null default 'platform',
  entitlement_ref text, metadata jsonb not null default '{}'::jsonb,
  status text not null default 'owned' check (status in ('owned','revoked')), equipped boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, uniform_id)
);
create unique index if not exists user_uniforms_one_equipped_idx on public.user_uniforms(user_id) where equipped = true;
create index if not exists user_uniforms_user_id_idx on public.user_uniforms(user_id);

create table if not exists public.sticker_catalog (
  id uuid primary key default gen_random_uuid(), sticker_key text not null unique, name text not null, description text,
  asset_type text not null default 'image' check (asset_type in ('image','3d_scene','model','texture')),
  storage_bucket text, storage_path text, mime_type text, checksum_sha256 text,
  theme_compatibility jsonb not null default '{}'::jsonb, metadata jsonb not null default '{}'::jsonb,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists sticker_catalog_status_idx on public.sticker_catalog(status, moderation_status);

create table if not exists public.user_stickers (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  sticker_id uuid not null references public.sticker_catalog(id) on delete restrict, acquired_via text not null default 'platform',
  entitlement_ref text, metadata jsonb not null default '{}'::jsonb,
  status text not null default 'owned' check (status in ('owned','revoked')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, sticker_id)
);
create index if not exists user_stickers_user_id_idx on public.user_stickers(user_id);

create table if not exists public.cosmetic_catalog (
  id uuid primary key default gen_random_uuid(), cosmetic_key text not null unique, name text not null, category text not null,
  description text, asset_type text not null default '3d_scene' check (asset_type in ('3d_scene','model','texture','image')),
  storage_bucket text, storage_path text, mime_type text, checksum_sha256 text,
  theme_compatibility jsonb not null default '{}'::jsonb, metadata jsonb not null default '{}'::jsonb,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists cosmetic_catalog_status_idx on public.cosmetic_catalog(status, moderation_status);
create index if not exists cosmetic_catalog_category_idx on public.cosmetic_catalog(category);

create table if not exists public.user_cosmetics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  cosmetic_id uuid not null references public.cosmetic_catalog(id) on delete restrict, acquired_via text not null default 'platform',
  entitlement_ref text, slot_key text not null, metadata jsonb not null default '{}'::jsonb,
  status text not null default 'owned' check (status in ('owned','revoked')), equipped boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, cosmetic_id)
);
create unique index if not exists user_cosmetics_one_equipped_slot_idx on public.user_cosmetics(user_id, slot_key) where equipped = true;
create index if not exists user_cosmetics_user_id_idx on public.user_cosmetics(user_id);

alter table public.user_characters enable row level security;
alter table public.uniform_catalog enable row level security;
alter table public.user_uniforms enable row level security;
alter table public.sticker_catalog enable row level security;
alter table public.user_stickers enable row level security;
alter table public.cosmetic_catalog enable row level security;
alter table public.user_cosmetics enable row level security;

create policy "user_characters_owner_select" on public.user_characters for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_characters_owner_insert" on public.user_characters for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_characters_owner_update" on public.user_characters for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_characters_owner_delete" on public.user_characters for delete to authenticated using ((select auth.uid()) = user_id);
create policy "uniform_catalog_published_select" on public.uniform_catalog for select to authenticated using (status = 'published' and moderation_status = 'approved');
create policy "user_uniforms_owner_select" on public.user_uniforms for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_uniforms_owner_insert" on public.user_uniforms for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_uniforms_owner_update" on public.user_uniforms for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_uniforms_owner_delete" on public.user_uniforms for delete to authenticated using ((select auth.uid()) = user_id);
create policy "sticker_catalog_published_select" on public.sticker_catalog for select to authenticated using (status = 'published' and moderation_status = 'approved');
create policy "user_stickers_owner_select" on public.user_stickers for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_stickers_owner_insert" on public.user_stickers for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_stickers_owner_update" on public.user_stickers for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_stickers_owner_delete" on public.user_stickers for delete to authenticated using ((select auth.uid()) = user_id);
create policy "cosmetic_catalog_published_select" on public.cosmetic_catalog for select to authenticated using (status = 'published' and moderation_status = 'approved');
create policy "user_cosmetics_owner_select" on public.user_cosmetics for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_cosmetics_owner_insert" on public.user_cosmetics for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_cosmetics_owner_update" on public.user_cosmetics for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_cosmetics_owner_delete" on public.user_cosmetics for delete to authenticated using ((select auth.uid()) = user_id);