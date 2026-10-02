-- Phase 21 — Theme & World Builder
-- Depends on Phase 17 Universe, Phase 19 Districts and Phase 20 Booth/Tenant.
-- Presentation configuration never grants authority.

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid references public.users(id) on delete restrict,
  creator_organization_id uuid references public.organizations(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  category text not null,
  preview_storage_path text,
  compatibility jsonb not null default '{}'::jsonb,
  allowed_components jsonb not null default '[]'::jsonb,
  performance_budget jsonb not null default '{}'::jsonb,
  accessibility_constraints jsonb not null default '{}'::jsonb,
  marketplace_price numeric(18,2),
  revenue_share numeric(7,4),
  status text not null default 'draft' check (status in ('draft','review','published','archived','suspended')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed','appealed')),
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  check ((creator_user_id is not null)::int + (creator_organization_id is not null)::int <= 1),
  check (marketplace_price is null or marketplace_price >= 0),
  check (revenue_share is null or (revenue_share >= 0 and revenue_share <= 1))
);

create table if not exists public.theme_versions (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  tokens jsonb not null default '{}'::jsonb,
  component_config jsonb not null default '{}'::jsonb,
  world_schema jsonb not null default '{}'::jsonb,
  compatibility jsonb not null default '{}'::jsonb,
  performance_budget jsonb not null default '{}'::jsonb,
  accessibility_constraints jsonb not null default '{}'::jsonb,
  validation_status text not null default 'pending' check (validation_status in ('pending','passed','failed')),
  performance_status text not null default 'pending' check (performance_status in ('pending','passed','failed')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed','appealed')),
  checksum text,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  approved_by_user_id uuid references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc',now()),
  published_at timestamptz,
  effective_from timestamptz,
  effective_until timestamptz,
  unique(theme_id,version)
);

create table if not exists public.theme_assets (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes(id) on delete cascade,
  theme_version_id uuid not null references public.theme_versions(id) on delete cascade,
  asset_type text not null check (asset_type in ('image','video','3d_scene','model','texture','font','audio','icon','preview')),
  storage_path text not null,
  mime_type text,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  status text not null default 'pending' check (status in ('pending','active','rejected','archived')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed','appealed')),
  safety_status text not null default 'pending' check (safety_status in ('pending','passed','failed')),
  performance_status text not null default 'pending' check (performance_status in ('pending','passed','failed')),
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.world_templates (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid references public.users(id) on delete restrict,
  creator_organization_id uuid references public.organizations(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  category text not null,
  compatibility jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','review','published','archived','suspended')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed','appealed')),
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  check ((creator_user_id is not null)::int + (creator_organization_id is not null)::int <= 1)
);

create table if not exists public.world_template_versions (
  id uuid primary key default gen_random_uuid(),
  world_template_id uuid not null references public.world_templates(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  theme_id uuid references public.themes(id) on delete set null,
  theme_version_id uuid references public.theme_versions(id) on delete set null,
  world_schema jsonb not null default '{}'::jsonb,
  builder_schema jsonb not null default '{}'::jsonb,
  validation_status text not null default 'pending' check (validation_status in ('pending','passed','failed')),
  performance_status text not null default 'pending' check (performance_status in ('pending','passed','failed')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','restricted','removed','appealed')),
  checksum text,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  approved_by_user_id uuid references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc',now()),
  published_at timestamptz,
  unique(world_template_id,version)
);

create table if not exists public.world_builder_states (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  world_id uuid references public.universe_worlds(id) on delete cascade,
  theme_id uuid references public.themes(id) on delete set null,
  theme_version_id uuid references public.theme_versions(id) on delete set null,
  world_template_id uuid references public.world_templates(id) on delete set null,
  world_template_version_id uuid references public.world_template_versions(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','validated','submitted','published','archived')),
  scene_schema jsonb not null default '{}'::jsonb,
  validation_report jsonb not null default '{}'::jsonb,
  performance_report jsonb not null default '{}'::jsonb,
  accessibility_report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create unique index if not exists world_builder_states_owner_world_uq
  on public.world_builder_states(owner_user_id,world_id)
  where world_id is not null;
create index if not exists themes_status_category_idx on public.themes(status,category,updated_at desc);
create index if not exists theme_versions_theme_status_idx on public.theme_versions(theme_id,status,version desc);
create index if not exists theme_assets_version_status_idx on public.theme_assets(theme_version_id,status,sort_order);
create index if not exists world_templates_status_category_idx on public.world_templates(status,category,updated_at desc);
create index if not exists world_template_versions_template_status_idx on public.world_template_versions(world_template_id,status,version desc);
create index if not exists world_builder_states_owner_idx on public.world_builder_states(owner_user_id,updated_at desc);

alter table public.themes enable row level security;
alter table public.theme_versions enable row level security;
alter table public.theme_assets enable row level security;
alter table public.world_templates enable row level security;
alter table public.world_template_versions enable row level security;
alter table public.world_builder_states enable row level security;

create or replace function private.theme_owner(p_theme_id uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.themes t where t.id=p_theme_id and (t.creator_user_id=auth.uid() or (t.creator_organization_id is not null and exists(select 1 from public.organization_members m where m.organization_id=t.creator_organization_id and m.user_id=auth.uid())))) $$;
revoke all on function private.theme_owner(uuid) from public,anon,authenticated;

create or replace function private.world_template_owner(p_template_id uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.world_templates t where t.id=p_template_id and (t.creator_user_id=auth.uid() or (t.creator_organization_id is not null and exists(select 1 from public.organization_members m where m.organization_id=t.creator_organization_id and m.user_id=auth.uid())))) $$;
revoke all on function private.world_template_owner(uuid) from public,anon,authenticated;

create or replace function private.theme_tokens_safe(p_tokens jsonb) returns boolean
language sql immutable
as $$ select jsonb_typeof(coalesce(p_tokens,'{}'::jsonb))='object' and not exists(select 1 from jsonb_object_keys(coalesce(p_tokens,'{}'::jsonb)) k where k not like 'theme.%') $$;
revoke all on function private.theme_tokens_safe(jsonb) from public,anon,authenticated;

create policy themes_select on public.themes for select to authenticated using (
  private.theme_owner(id) or (status='published' and moderation_status='approved')
);
create policy theme_versions_select on public.theme_versions for select to authenticated using (
  private.theme_owner(theme_id) or exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.moderation_status='approved')
);
create policy theme_assets_select on public.theme_assets for select to authenticated using (
  private.theme_owner(theme_id) or exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.moderation_status='approved')
);
create policy world_templates_select on public.world_templates for select to authenticated using (
  private.world_template_owner(id) or (status='published' and moderation_status='approved')
);
create policy world_template_versions_select on public.world_template_versions for select to authenticated using (
  private.world_template_owner(world_template_id) or exists(select 1 from public.world_templates t where t.id=world_template_id and t.status='published' and t.moderation_status='approved')
);
create policy world_builder_states_owner_select on public.world_builder_states for select to authenticated using (owner_user_id=auth.uid());

revoke all on public.themes,public.theme_versions,public.theme_assets,public.world_templates,public.world_template_versions,public.world_builder_states from anon,authenticated;
grant select on public.themes,public.theme_versions,public.theme_assets,public.world_templates,public.world_template_versions,public.world_builder_states to authenticated;

create or replace function public.create_theme(p_name text,p_slug text,p_description text,p_category text,p_compatibility jsonb,p_allowed_components jsonb,p_performance_budget jsonb,p_accessibility_constraints jsonb)
returns public.themes language plpgsql security definer set search_path=''
as $$
declare t public.themes;
begin
 insert into public.themes(creator_user_id,name,slug,description,category,compatibility,allowed_components,performance_budget,accessibility_constraints,created_by_user_id)
 values(auth.uid(),p_name,p_slug,p_description,p_category,coalesce(p_compatibility,'{}'::jsonb),coalesce(p_allowed_components,'[]'::jsonb),coalesce(p_performance_budget,'{}'::jsonb),coalesce(p_accessibility_constraints,'{}'::jsonb),auth.uid())
 returning * into t;
 return t;
end $$;

create or replace function public.create_theme_version(p_theme_id uuid,p_tokens jsonb,p_component_config jsonb,p_world_schema jsonb,p_compatibility jsonb,p_performance_budget jsonb,p_accessibility_constraints jsonb)
returns public.theme_versions language plpgsql security definer set search_path=''
as $$
declare v public.theme_versions; next_version integer;
begin
 if not private.theme_owner(p_theme_id) then raise exception 'THEME_OWNER_DENIED'; end if;
 if not private.theme_tokens_safe(p_tokens) then raise exception 'THEME_TOKEN_NAMESPACE_DENIED'; end if;
 select coalesce(max(version),0)+1 into next_version from public.theme_versions where theme_id=p_theme_id;
 insert into public.theme_versions(theme_id,version,tokens,component_config,world_schema,compatibility,performance_budget,accessibility_constraints,created_by_user_id)
 values(p_theme_id,next_version,coalesce(p_tokens,'{}'::jsonb),coalesce(p_component_config,'{}'::jsonb),coalesce(p_world_schema,'{}'::jsonb),coalesce(p_compatibility,'{}'::jsonb),coalesce(p_performance_budget,'{}'::jsonb),coalesce(p_accessibility_constraints,'{}'::jsonb),auth.uid())
 returning * into v;
 return v;
end $$;

create or replace function public.add_theme_asset(p_theme_version_id uuid,p_asset_type text,p_storage_path text,p_mime_type text,p_metadata jsonb,p_sort_order integer)
returns public.theme_assets language plpgsql security definer set search_path=''
as $$
declare a public.theme_assets; theme_uuid uuid; creator_uuid uuid;
begin
 select v.theme_id into theme_uuid from public.theme_versions v where v.id=p_theme_version_id;
 if theme_uuid is null or not private.theme_owner(theme_uuid) then raise exception 'THEME_OWNER_DENIED'; end if;
 select creator_user_id into creator_uuid from public.themes where id=theme_uuid;
 if creator_uuid is not null and position(creator_uuid::text||'/' in p_storage_path)<>1 then raise exception 'THEME_ASSET_PATH_DENIED'; end if;
 insert into public.theme_assets(theme_id,theme_version_id,asset_type,storage_path,mime_type,metadata,sort_order,created_by_user_id)
 values(theme_uuid,p_theme_version_id,p_asset_type,p_storage_path,p_mime_type,coalesce(p_metadata,'{}'::jsonb),p_sort_order,auth.uid())
 returning * into a;
 return a;
end $$;

create or replace function public.validate_theme_version(p_theme_version_id uuid)
returns public.theme_versions language plpgsql security definer set search_path=''
as $$
declare v public.theme_versions; safe boolean;
begin
 select * into v from public.theme_versions where id=p_theme_version_id;
 if not found or not private.theme_owner(v.theme_id) then raise exception 'THEME_OWNER_DENIED'; end if;
 safe:=private.theme_tokens_safe(v.tokens)
   and jsonb_typeof(v.world_schema)='object'
   and jsonb_typeof(v.component_config)='object';
 update public.theme_versions
 set validation_status=case when safe then 'passed' else 'failed' end,
     performance_status=case when jsonb_typeof(performance_budget)='object' then 'pending' else 'failed' end,
     checksum=md5(v.tokens::text||v.component_config::text||v.world_schema::text),
     status=case when safe then 'review' else 'draft' end
 where id=v.id returning * into v;
 return v;
end $$;

create or replace function public.submit_theme(p_theme_id uuid)
returns public.themes language plpgsql security definer set search_path=''
as $$
declare t public.themes;
begin
 if not private.theme_owner(p_theme_id) then raise exception 'THEME_OWNER_DENIED'; end if;
 if not exists(select 1 from public.theme_versions v where v.theme_id=p_theme_id and v.status='review' and v.validation_status='passed') then raise exception 'THEME_VALID_VERSION_REQUIRED'; end if;
 update public.themes set status='review',moderation_status='pending',updated_at=timezone('utc',now()) where id=p_theme_id returning * into t;
 return t;
end $$;

create or replace function public.publish_theme(p_theme_id uuid)
returns public.themes language plpgsql security definer set search_path=''
as $$
declare t public.themes; v public.theme_versions;
begin
 if not private.theme_owner(p_theme_id) then raise exception 'THEME_OWNER_DENIED'; end if;
 select * into t from public.themes where id=p_theme_id;
 select * into v from public.theme_versions where theme_id=p_theme_id and status='review' and validation_status='passed' and performance_status='passed' and moderation_status='approved' order by version desc limit 1;
 if not found or t.moderation_status<>'approved' then raise exception 'THEME_PUBLISH_GATES_NOT_MET'; end if;
 update public.themes set status='published',updated_at=timezone('utc',now()) where id=t.id returning * into t;
 update public.theme_versions set status='published',published_at=timezone('utc',now()) where id=v.id;
 return t;
end $$;

create or replace function public.create_world_template(p_name text,p_slug text,p_description text,p_category text,p_compatibility jsonb)
returns public.world_templates language plpgsql security definer set search_path=''
as $$
declare t public.world_templates;
begin
 insert into public.world_templates(creator_user_id,name,slug,description,category,compatibility,created_by_user_id)
 values(auth.uid(),p_name,p_slug,p_description,p_category,coalesce(p_compatibility,'{}'::jsonb),auth.uid())
 returning * into t;
 return t;
end $$;

create or replace function public.create_world_template_version(p_world_template_id uuid,p_theme_id uuid,p_theme_version_id uuid,p_world_schema jsonb,p_builder_schema jsonb)
returns public.world_template_versions language plpgsql security definer set search_path=''
as $$
declare v public.world_template_versions; next_version integer;
begin
 if not private.world_template_owner(p_world_template_id) then raise exception 'WORLD_TEMPLATE_OWNER_DENIED'; end if;
 select coalesce(max(version),0)+1 into next_version from public.world_template_versions where world_template_id=p_world_template_id;
 insert into public.world_template_versions(world_template_id,version,theme_id,theme_version_id,world_schema,builder_schema,created_by_user_id)
 values(p_world_template_id,next_version,p_theme_id,p_theme_version_id,coalesce(p_world_schema,'{}'::jsonb),coalesce(p_builder_schema,'{}'::jsonb),auth.uid())
 returning * into v;
 return v;
end $$;

create or replace function public.save_world_builder_state(p_state_id uuid,p_world_id uuid,p_theme_id uuid,p_theme_version_id uuid,p_world_template_id uuid,p_world_template_version_id uuid,p_scene_schema jsonb)
returns public.world_builder_states language plpgsql security definer set search_path=''
as $$
declare s public.world_builder_states; world_owner boolean:=false;
begin
 if p_state_id is not null then
   if not exists(select 1 from public.world_builder_states where id=p_state_id and owner_user_id=auth.uid()) then raise exception 'WORLD_BUILDER_STATE_DENIED'; end if;
 end if;
 if p_world_id is not null then
   select exists(select 1 from public.universe_worlds w where w.id=p_world_id and ((w.owner_type='user' and w.owner_id=auth.uid()) or (w.owner_type='agent' and exists(select 1 from public.agents a where a.id=w.owner_id and a.owner_user_id=auth.uid())))) into world_owner;
   if not world_owner then raise exception 'WORLD_BUILDER_WORLD_OWNER_DENIED'; end if;
 end if;
 if p_theme_version_id is not null and not exists(select 1 from public.theme_versions v where v.id=p_theme_version_id and v.theme_id=p_theme_id) then raise exception 'WORLD_BUILDER_THEME_VERSION_INVALID'; end if;
 if p_world_template_version_id is not null and not exists(select 1 from public.world_template_versions v where v.id=p_world_template_version_id and v.world_template_id=p_world_template_id) then raise exception 'WORLD_BUILDER_TEMPLATE_VERSION_INVALID'; end if;
 if p_state_id is null then
   insert into public.world_builder_states(owner_user_id,world_id,theme_id,theme_version_id,world_template_id,world_template_version_id,scene_schema)
   values(auth.uid(),p_world_id,p_theme_id,p_theme_version_id,p_world_template_id,p_world_template_version_id,coalesce(p_scene_schema,'{}'::jsonb))
   returning * into s;
 else
   update public.world_builder_states set world_id=p_world_id,theme_id=p_theme_id,theme_version_id=p_theme_version_id,world_template_id=p_world_template_id,world_template_version_id=p_world_template_version_id,scene_schema=coalesce(p_scene_schema,scene_schema),updated_at=timezone('utc',now()) where id=p_state_id returning * into s;
 end if;
 return s;
end $$;

create or replace function public.validate_world_builder_state(p_state_id uuid)
returns public.world_builder_states language plpgsql security definer set search_path=''
as $$
declare s public.world_builder_states; valid boolean;
begin
 select * into s from public.world_builder_states where id=p_state_id and owner_user_id=auth.uid();
 if not found then raise exception 'WORLD_BUILDER_STATE_DENIED'; end if;
 valid:=jsonb_typeof(s.scene_schema)='object'
   and (not (s.scene_schema ? 'code'))
   and (not (s.scene_schema ? 'script'));
 update public.world_builder_states
 set status=case when valid then 'validated' else 'draft' end,
     validation_report=jsonb_build_object('status',case when valid then 'passed' else 'failed' end,'validated_at',timezone('utc',now())),
     updated_at=timezone('utc',now())
 where id=s.id returning * into s;
 return s;
end $$;

create or replace function public.submit_world_builder_state(p_state_id uuid)
returns public.world_builder_states language plpgsql security definer set search_path=''
as $$
declare s public.world_builder_states;
begin
 select * into s from public.world_builder_states where id=p_state_id and owner_user_id=auth.uid();
 if not found then raise exception 'WORLD_BUILDER_STATE_DENIED'; end if;
 if s.status<>'validated' then raise exception 'WORLD_BUILDER_VALIDATION_REQUIRED'; end if;
 update public.world_builder_states set status='submitted',updated_at=timezone('utc',now()) where id=s.id returning * into s;
 return s;
end $$;

do $$ declare r record; begin
 for r in select p.oid::regprocedure as fn from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('create_theme','create_theme_version','add_theme_asset','validate_theme_version','submit_theme','publish_theme','create_world_template','create_world_template_version','save_world_builder_state','validate_world_builder_state','submit_world_builder_state') loop
   execute 'revoke all on function '||r.fn||' from public,anon';
   execute 'grant execute on function '||r.fn||' to authenticated';
 end loop;
end $$;

alter table public.themes force row level security;
alter table public.theme_versions force row level security;
alter table public.theme_assets force row level security;
alter table public.world_templates force row level security;
alter table public.world_template_versions force row level security;
alter table public.world_builder_states force row level security;
