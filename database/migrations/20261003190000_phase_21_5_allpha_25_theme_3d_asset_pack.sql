-- Phase 21.5: Allpha 25 Theme 3D Asset Pack lifecycle.
-- Platform Theme assets are immutable platform configuration, stored in the private
-- allpha-world-assets bucket and verified before activation. No seed business data.

alter table public.theme_assets
  alter column created_by_user_id drop not null,
  add column if not exists storage_bucket text not null default 'allpha-world-assets',
  add column if not exists content_size_bytes bigint,
  add column if not exists checksum_sha256 text,
  add column if not exists uploaded_at timestamptz;

alter table public.theme_assets
  drop constraint if exists theme_assets_storage_bucket_check;
alter table public.theme_assets
  add constraint theme_assets_storage_bucket_check
  check (storage_bucket = 'allpha-world-assets');

alter table public.theme_assets
  drop constraint if exists theme_assets_3d_size_check;
alter table public.theme_assets
  add constraint theme_assets_3d_size_check
  check (content_size_bytes is null or content_size_bytes > 0);

create index if not exists theme_assets_platform_active_idx
  on public.theme_assets(theme_id, theme_version_id, sort_order)
  where status='active' and moderation_status='approved' and safety_status='passed' and performance_status='passed';

create or replace function public.prepare_platform_theme_3d_asset(
  p_theme_version_id uuid,
  p_asset_type text default '3d_scene',
  p_mime_type text default 'model/gltf-binary',
  p_metadata jsonb default '{}'::jsonb,
  p_sort_order integer default 0
) returns public.theme_assets
language plpgsql security definer set search_path='' as $$
declare
  a public.theme_assets;
  t public.themes;
  v public.theme_versions;
  asset_id uuid := gen_random_uuid();
  path text;
begin
  if not private.has_platform_permission('admin.manage') then
    raise exception 'PLATFORM_THEME_ASSET_ADMIN_DENIED';
  end if;
  select * into v from public.theme_versions where id=p_theme_version_id for update;
  if v.id is null then raise exception 'THEME_VERSION_NOT_FOUND'; end if;
  select * into t from public.themes where id=v.theme_id for update;
  if t.id is null then raise exception 'THEME_NOT_FOUND'; end if;
  if t.source <> 'platform' then raise exception 'THEME_NOT_PLATFORM'; end if;
  if v.status <> 'published' or t.status <> 'published' or t.moderation_status <> 'approved' or v.moderation_status <> 'approved' then
    raise exception 'THEME_VERSION_NOT_PUBLISHED';
  end if;
  if lower(coalesce(p_mime_type,'')) not in ('model/gltf-binary','model/gltf+json','application/octet-stream') then
    raise exception 'THEME_3D_MIME_UNSUPPORTED';
  end if;
  if p_asset_type not in ('3d_scene','model','texture','preview') then
    raise exception 'THEME_3D_ASSET_TYPE_UNSUPPORTED';
  end if;
  if p_sort_order < 0 then raise exception 'THEME_ASSET_SORT_ORDER_INVALID'; end if;
  path := 'platform/themes/' || coalesce(t.catalog_key,t.slug) || '/v' || v.version::text || '/' || asset_id::text ||
          case when lower(coalesce(p_mime_type,''))='model/gltf+json' then '.gltf' else '.glb' end;
  insert into public.theme_assets(
    id,theme_id,theme_version_id,asset_type,storage_bucket,storage_path,mime_type,metadata,sort_order,
    status,moderation_status,safety_status,performance_status,created_by_user_id
  )
  values(
    asset_id,t.id,v.id,p_asset_type,'allpha-world-assets',path,lower(coalesce(p_mime_type,'model/gltf-binary')),
    coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('lifecycle','pending_upload','platform_asset',true),
    p_sort_order,'pending','approved','pending','pending',auth.uid()
  )
  returning * into a;
  return a;
end $$;

create or replace function public.finalize_platform_theme_3d_asset(
  p_asset_id uuid,
  p_checksum_sha256 text default null
) returns public.theme_assets
language plpgsql security definer set search_path='' as $$
declare
  a public.theme_assets;
  t public.themes;
  o record;
begin
  if not private.has_platform_permission('admin.manage') then
    raise exception 'PLATFORM_THEME_ASSET_ADMIN_DENIED';
  end if;
  select * into a from public.theme_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'THEME_ASSET_NOT_FOUND'; end if;
  select * into t from public.themes where id=a.theme_id;
  if t.id is null or t.source <> 'platform' then raise exception 'THEME_NOT_PLATFORM'; end if;
  if a.status <> 'pending' then raise exception 'THEME_ASSET_NOT_PENDING'; end if;
  if a.asset_type not in ('3d_scene','model','texture','preview') then raise exception 'THEME_ASSET_NOT_3D'; end if;
  select name,owner_id,metadata into o
  from storage.objects
  where bucket_id=a.storage_bucket and name=a.storage_path
    and coalesce(is_delete_marker,false)=false
  limit 1;
  if o.name is null then raise exception 'THEME_ASSET_STORAGE_OBJECT_MISSING'; end if;
  if o.owner_id <> auth.uid()::text then raise exception 'THEME_ASSET_STORAGE_OWNER_DENIED'; end if;
  if coalesce((o.metadata->>'size')::bigint,0) <= 0 then raise exception 'THEME_ASSET_EMPTY'; end if;
  update public.theme_assets
  set status='active',
      content_size_bytes=(o.metadata->>'size')::bigint,
      checksum_sha256=case when p_checksum_sha256 ~ '^[0-9a-fA-F]{64}$' then lower(p_checksum_sha256) else null end,
      uploaded_at=timezone('utc',now()),
      created_by_user_id=coalesce(created_by_user_id,auth.uid()),
      metadata=coalesce(metadata,'{}'::jsonb)
        || jsonb_build_object(
          'storage_verified',true,
          'storage_verified_at',timezone('utc',now()),
          'storage_metadata',coalesce(o.metadata,'{}'::jsonb),
          'lifecycle','active'
        )
  where id=a.id
  returning * into a;
  return a;
end $$;

create or replace function public.archive_platform_theme_3d_asset(
  p_asset_id uuid
) returns public.theme_assets
language plpgsql security definer set search_path='' as $$
declare a public.theme_assets;
begin
  if not private.has_platform_permission('admin.manage') then
    raise exception 'PLATFORM_THEME_ASSET_ADMIN_DENIED';
  end if;
  select * into a from public.theme_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'THEME_ASSET_NOT_FOUND'; end if;
  if not exists(select 1 from public.themes where id=a.theme_id and source='platform') then
    raise exception 'THEME_NOT_PLATFORM';
  end if;
  update public.theme_assets
    set status='archived',
        metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('lifecycle','archived')
  where id=a.id
  returning * into a;
  return a;
end $$;

revoke execute on function public.prepare_platform_theme_3d_asset(uuid,text,text,jsonb,integer) from public,anon;
grant execute on function public.prepare_platform_theme_3d_asset(uuid,text,text,jsonb,integer) to authenticated;
revoke execute on function public.finalize_platform_theme_3d_asset(uuid,text) from public,anon;
grant execute on function public.finalize_platform_theme_3d_asset(uuid,text) to authenticated;
revoke execute on function public.archive_platform_theme_3d_asset(uuid) from public,anon;
grant execute on function public.archive_platform_theme_3d_asset(uuid) to authenticated;

drop policy if exists allpha_world_assets_platform_theme_visible_read on storage.objects;
create policy allpha_world_assets_platform_theme_visible_read
on storage.objects for select to authenticated
using (
  bucket_id='allpha-world-assets'
  and exists (
    select 1
    from public.theme_assets a
    join public.themes t on t.id=a.theme_id
    where a.storage_bucket=storage.objects.bucket_id
      and a.storage_path=storage.objects.name
      and a.status='active'
      and a.moderation_status='approved'
      and a.safety_status='passed'
      and a.performance_status='passed'
      and t.source='platform'
      and t.status='published'
      and t.moderation_status='approved'
  )
);