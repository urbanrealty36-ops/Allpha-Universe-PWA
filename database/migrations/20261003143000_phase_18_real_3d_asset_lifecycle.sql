-- Phase 18: Real 3D Asset Lifecycle for Booth + Live Stage + AI Character
-- This migration is idempotent and contains no business-data seeds.

create table if not exists public.live_experience_stage_assets (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.live_experience_template_versions(id) on delete cascade,
  asset_type text not null default '3d_stage' check (asset_type = '3d_stage'),
  storage_bucket text not null default 'allpha-world-assets',
  storage_path text not null unique,
  mime_type text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','active','archived')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected','restricted')),
  content_size_bytes bigint,
  checksum_sha256 text,
  uploaded_at timestamptz,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists live_stage_assets_template_version_idx
  on public.live_experience_stage_assets(template_version_id, status, moderation_status);

create index if not exists live_stage_assets_creator_idx
  on public.live_experience_stage_assets(created_by_user_id);

alter table public.live_experience_stage_assets enable row level security;
revoke all on table public.live_experience_stage_assets from anon;
grant select on table public.live_experience_stage_assets to authenticated;

drop policy if exists live_stage_assets_select on public.live_experience_stage_assets;
create policy live_stage_assets_select
on public.live_experience_stage_assets
for select to authenticated
using (
  (select private.has_platform_permission('admin.manage'))
  or created_by_user_id = (select auth.uid())
  or exists (
    select 1
    from public.live_experience_template_versions v
    join public.live_experience_templates t on t.id = v.template_id
    where v.id = live_experience_stage_assets.template_version_id
      and v.status = 'published'
      and v.moderation_status = 'approved'
      and t.status = 'published'
  )
);

create or replace function public.prepare_live_stage_3d_asset(
  p_template_version_id uuid,
  p_mime_type text default 'model/gltf-binary',
  p_metadata jsonb default '{}'::jsonb
)
returns public.live_experience_stage_assets
language plpgsql
security definer
set search_path = ''
as $function$
declare
  a public.live_experience_stage_assets;
  v public.live_experience_template_versions;
  asset_id uuid := gen_random_uuid();
  path text;
begin
  select * into v from public.live_experience_template_versions
  where id = p_template_version_id for update;
  if v.id is null then raise exception 'LIVE_TEMPLATE_VERSION_NOT_FOUND'; end if;
  if not (
    (select private.has_platform_permission('admin.manage'))
    or v.created_by_user_id = (select auth.uid())
  ) then raise exception 'LIVE_STAGE_ASSET_OWNER_DENIED'; end if;
  if v.status = 'archived' then raise exception 'LIVE_TEMPLATE_VERSION_ARCHIVED'; end if;
  if lower(coalesce(p_mime_type,'')) not in ('model/gltf-binary','model/gltf+json','application/octet-stream') then
    raise exception 'LIVE_STAGE_3D_MIME_UNSUPPORTED';
  end if;

  path := (select auth.uid())::text || '/live-stages/' ||
    p_template_version_id::text || '/' || asset_id::text || '.glb';

  insert into public.live_experience_stage_assets(
    id, template_version_id, asset_type, storage_bucket, storage_path,
    mime_type, metadata, status, moderation_status, created_by_user_id
  ) values (
    asset_id, p_template_version_id, '3d_stage', 'allpha-world-assets', path,
    lower(coalesce(p_mime_type,'model/gltf-binary')),
    coalesce(p_metadata,'{}'::jsonb), 'pending', 'pending', (select auth.uid())
  )
  returning * into a;
  return a;
end
$function$;

create or replace function public.finalize_live_stage_3d_asset(
  p_asset_id uuid,
  p_checksum_sha256 text default null
)
returns public.live_experience_stage_assets
language plpgsql
security definer
set search_path = ''
as $function$
declare
  a public.live_experience_stage_assets;
  o record;
begin
  select * into a from public.live_experience_stage_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'LIVE_STAGE_ASSET_NOT_FOUND'; end if;
  if not (
    (select private.has_platform_permission('admin.manage'))
    or a.created_by_user_id = (select auth.uid())
  ) then raise exception 'LIVE_STAGE_ASSET_OWNER_DENIED'; end if;
  if a.status <> 'pending' then raise exception 'LIVE_STAGE_ASSET_NOT_PENDING'; end if;

  select name, owner_id, metadata into o from storage.objects
  where bucket_id=a.storage_bucket and name=a.storage_path
    and coalesce(is_delete_marker,false)=false limit 1;
  if o.name is null then raise exception 'LIVE_STAGE_ASSET_STORAGE_OBJECT_MISSING'; end if;
  if o.owner_id <> (select auth.uid())::text then raise exception 'LIVE_STAGE_ASSET_STORAGE_OWNER_DENIED'; end if;
  if coalesce((o.metadata->>'size')::bigint,0) <= 0 then raise exception 'LIVE_STAGE_ASSET_EMPTY'; end if;

  update public.live_experience_stage_assets
  set status='active',
      content_size_bytes=(o.metadata->>'size')::bigint,
      checksum_sha256=case when p_checksum_sha256 ~ '^[0-9a-fA-F]{64}$' then lower(p_checksum_sha256) else null end,
      uploaded_at=timezone('utc',now()), updated_at=timezone('utc',now()),
      metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
        'storage_verified',true,
        'storage_verified_at',timezone('utc',now()),
        'storage_metadata',coalesce(o.metadata,'{}'::jsonb)
      )
  where id=a.id returning * into a;
  return a;
end
$function$;

create or replace function public.archive_live_stage_3d_asset(p_asset_id uuid)
returns public.live_experience_stage_assets
language plpgsql security definer set search_path=''
as $function$
declare a public.live_experience_stage_assets;
begin
  select * into a from public.live_experience_stage_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'LIVE_STAGE_ASSET_NOT_FOUND'; end if;
  if not ((select private.has_platform_permission('admin.manage')) or a.created_by_user_id=(select auth.uid()))
    then raise exception 'LIVE_STAGE_ASSET_OWNER_DENIED'; end if;
  update public.live_experience_stage_assets set status='archived',updated_at=timezone('utc',now())
  where id=a.id returning * into a;
  return a;
end
$function$;

create or replace function public.moderate_live_stage_3d_asset(p_asset_id uuid,p_decision text)
returns public.live_experience_stage_assets
language plpgsql security definer set search_path=''
as $function$
declare a public.live_experience_stage_assets;
begin
  if not (select private.has_platform_permission('admin.manage')) then raise exception 'PLATFORM_PERMISSION_DENIED'; end if;
  if p_decision not in ('approved','restricted','rejected') then raise exception 'LIVE_STAGE_MODERATION_DECISION_INVALID'; end if;
  select * into a from public.live_experience_stage_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'LIVE_STAGE_ASSET_NOT_FOUND'; end if;
  if a.status <> 'active' then raise exception 'LIVE_STAGE_ASSET_NOT_ACTIVE'; end if;
  update public.live_experience_stage_assets set moderation_status=p_decision,updated_at=timezone('utc',now())
  where id=a.id returning * into a;
  return a;
end
$function$;

revoke execute on function public.prepare_live_stage_3d_asset(uuid,text,jsonb) from public,anon;
revoke execute on function public.finalize_live_stage_3d_asset(uuid,text) from public,anon;
revoke execute on function public.archive_live_stage_3d_asset(uuid) from public,anon;
revoke execute on function public.moderate_live_stage_3d_asset(uuid,text) from public,anon;
grant execute on function public.prepare_live_stage_3d_asset(uuid,text,jsonb) to authenticated;
grant execute on function public.finalize_live_stage_3d_asset(uuid,text) to authenticated;
grant execute on function public.archive_live_stage_3d_asset(uuid) to authenticated;
grant execute on function public.moderate_live_stage_3d_asset(uuid,text) to authenticated;

alter table public.live_character_assets
  add column if not exists storage_bucket text not null default 'allpha-agent-assets',
  add column if not exists content_size_bytes bigint,
  add column if not exists checksum_sha256 text,
  add column if not exists uploaded_at timestamptz;

create index if not exists live_character_assets_agent_3d_idx
  on public.live_character_assets(agent_id,asset_type,status,moderation_status);

drop policy if exists live_assets_read on public.live_character_assets;
create policy live_assets_read on public.live_character_assets
for select to authenticated
using (
  (select private.has_platform_permission('admin.manage'))
  or owner_user_id=(select auth.uid())
  or agent_id in (select a.id from public.agents a where a.owner_user_id=(select auth.uid()))
  or (moderation_status='approved' and status='active')
);

create or replace function public.prepare_agent_character_3d_asset(
  p_agent_id uuid,p_name text,p_metadata jsonb default '{}'::jsonb
)
returns public.live_character_assets
language plpgsql security definer set search_path=''
as $function$
declare a public.live_character_assets; ag public.agents; asset_id uuid:=gen_random_uuid(); path text;
begin
  select * into ag from public.agents where id=p_agent_id for update;
  if ag.id is null then raise exception 'AGENT_NOT_FOUND'; end if;
  if ag.owner_user_id<>(select auth.uid()) then raise exception 'AGENT_OWNER_DENIED'; end if;
  if ag.status<>'active' then raise exception 'AGENT_NOT_ACTIVE'; end if;
  path:=(select auth.uid())::text||'/agents/'||p_agent_id::text||'/characters/'||asset_id::text||'.glb';
  insert into public.live_character_assets(
    id,owner_user_id,agent_id,asset_type,name,storage_bucket,storage_path,mime_type,metadata,moderation_status,status
  ) values (
    asset_id,(select auth.uid()),p_agent_id,'character',left(trim(p_name),160),'allpha-agent-assets',path,
    'model/gltf-binary',coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('format','glb','lifecycle','pending_upload'),
    'pending','draft'
  ) returning * into a;
  return a;
end
$function$;

create or replace function public.finalize_agent_character_3d_asset(p_asset_id uuid,p_checksum_sha256 text default null)
returns public.live_character_assets
language plpgsql security definer set search_path=''
as $function$
declare a public.live_character_assets; o record;
begin
  select * into a from public.live_character_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'AGENT_CHARACTER_ASSET_NOT_FOUND'; end if;
  if a.owner_user_id<>(select auth.uid()) then raise exception 'AGENT_CHARACTER_ASSET_OWNER_DENIED'; end if;
  if a.asset_type<>'character' then raise exception 'AGENT_CHARACTER_ASSET_NOT_CHARACTER'; end if;
  if a.status<>'draft' then raise exception 'AGENT_CHARACTER_ASSET_NOT_DRAFT'; end if;
  select name,owner_id,metadata into o from storage.objects
  where bucket_id=a.storage_bucket and name=a.storage_path and coalesce(is_delete_marker,false)=false limit 1;
  if o.name is null then raise exception 'AGENT_CHARACTER_ASSET_STORAGE_OBJECT_MISSING'; end if;
  if o.owner_id<>(select auth.uid())::text then raise exception 'AGENT_CHARACTER_ASSET_STORAGE_OWNER_DENIED'; end if;
  if coalesce((o.metadata->>'size')::bigint,0)<=0 then raise exception 'AGENT_CHARACTER_ASSET_EMPTY'; end if;
  update public.live_character_assets
  set status='active',
      content_size_bytes=(o.metadata->>'size')::bigint,
      checksum_sha256=case when p_checksum_sha256 ~ '^[0-9a-fA-F]{64}$' then lower(p_checksum_sha256) else null end,
      uploaded_at=timezone('utc',now()),updated_at=timezone('utc',now()),
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('storage_verified',true,'storage_verified_at',timezone('utc',now()),'storage_metadata',coalesce(o.metadata,'{}'::jsonb))
  where id=a.id returning * into a;
  return a;
end
$function$;

create or replace function public.archive_agent_character_3d_asset(p_asset_id uuid)
returns public.live_character_assets
language plpgsql security definer set search_path=''
as $function$
declare a public.live_character_assets;
begin
  select * into a from public.live_character_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'AGENT_CHARACTER_ASSET_NOT_FOUND'; end if;
  if a.owner_user_id<>(select auth.uid()) then raise exception 'AGENT_CHARACTER_ASSET_OWNER_DENIED'; end if;
  update public.live_character_assets set status='archived',updated_at=timezone('utc',now())
  where id=a.id returning * into a;
  return a;
end
$function$;

create or replace function public.moderate_agent_character_3d_asset(p_asset_id uuid,p_decision text)
returns public.live_character_assets
language plpgsql security definer set search_path=''
as $function$
declare a public.live_character_assets;
begin
  if not (select private.has_platform_permission('admin.manage')) then raise exception 'PLATFORM_PERMISSION_DENIED'; end if;
  if p_decision not in ('approved','restricted','rejected') then raise exception 'AGENT_CHARACTER_MODERATION_DECISION_INVALID'; end if;
  select * into a from public.live_character_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'AGENT_CHARACTER_ASSET_NOT_FOUND'; end if;
  if a.status<>'active' then raise exception 'AGENT_CHARACTER_ASSET_NOT_ACTIVE'; end if;
  update public.live_character_assets set moderation_status=p_decision,updated_at=timezone('utc',now())
  where id=a.id returning * into a;
  return a;
end
$function$;

revoke execute on function public.prepare_agent_character_3d_asset(uuid,text,jsonb) from public,anon;
revoke execute on function public.finalize_agent_character_3d_asset(uuid,text) from public,anon;
revoke execute on function public.archive_agent_character_3d_asset(uuid) from public,anon;
revoke execute on function public.moderate_agent_character_3d_asset(uuid,text) from public,anon;
grant execute on function public.prepare_agent_character_3d_asset(uuid,text,jsonb) to authenticated;
grant execute on function public.finalize_agent_character_3d_asset(uuid,text) to authenticated;
grant execute on function public.archive_agent_character_3d_asset(uuid) to authenticated;
grant execute on function public.moderate_agent_character_3d_asset(uuid,text) to authenticated;

drop policy if exists allpha_world_assets_live_stage_visible_read on storage.objects;
create policy allpha_world_assets_live_stage_visible_read on storage.objects
for select to authenticated using (
  bucket_id='allpha-world-assets' and exists (
    select 1 from public.live_experience_stage_assets a
    join public.live_experience_template_versions v on v.id=a.template_version_id
    join public.live_experience_templates t on t.id=v.template_id
    where a.storage_bucket=objects.bucket_id and a.storage_path=objects.name
      and a.asset_type='3d_stage' and a.status='active' and a.moderation_status='approved'
      and v.status='published' and v.moderation_status='approved' and t.status='published'
  )
);

drop policy if exists allpha_agent_assets_character_visible_read on storage.objects;
create policy allpha_agent_assets_character_visible_read on storage.objects
for select to authenticated using (
  bucket_id='allpha-agent-assets' and exists (
    select 1 from public.live_character_assets a
    join public.agents ag on ag.id=a.agent_id
    where a.storage_bucket=objects.bucket_id and a.storage_path=objects.name
      and a.asset_type='character' and a.status='active' and a.moderation_status='approved'
      and ag.status='active'
  )
);

grant select on public.live_experience_stage_assets to authenticated;
grant select on public.live_character_assets to authenticated;
