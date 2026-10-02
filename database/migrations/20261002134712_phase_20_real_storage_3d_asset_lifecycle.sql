-- Phase 20: real Supabase Storage 3D asset lifecycle for Booth/Tenant.
-- No seed/fake records. Runtime assets must be uploaded by an authorized Booth owner.
-- Storage operations remain through Supabase Storage API; database stores metadata only.

alter table public.booth_display_assets
  add column if not exists storage_bucket text not null default 'allpha-world-assets',
  add column if not exists content_size_bytes bigint,
  add column if not exists checksum_sha256 text,
  add column if not exists uploaded_at timestamptz;

alter table public.booth_display_assets drop constraint if exists booth_display_assets_storage_bucket_check;
alter table public.booth_display_assets add constraint booth_display_assets_storage_bucket_check check (storage_bucket = 'allpha-world-assets');
alter table public.booth_display_assets drop constraint if exists booth_display_assets_3d_size_check;
alter table public.booth_display_assets add constraint booth_display_assets_3d_size_check check (content_size_bytes is null or content_size_bytes > 0);

create index if not exists booth_display_assets_3d_active_idx
  on public.booth_display_assets(booth_id, sort_order)
  where asset_type='3d_scene' and status='active';

create or replace function public.prepare_booth_3d_asset(
  p_booth_id uuid, p_mime_type text default 'model/gltf-binary', p_metadata jsonb default '{}'::jsonb
) returns public.booth_display_assets language plpgsql security definer set search_path='' as $$
declare a public.booth_display_assets; b public.booths; prefix text; asset_id uuid := gen_random_uuid(); path text;
begin
  if not private.booth_owner(p_booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
  select * into b from public.booths where id=p_booth_id for update;
  if b.id is null then raise exception 'BOOTH_NOT_FOUND'; end if;
  if b.status='archived' then raise exception 'BOOTH_ARCHIVED'; end if;
  if lower(coalesce(p_mime_type,'')) not in ('model/gltf-binary','model/gltf+json','application/octet-stream') then raise exception 'BOOTH_3D_MIME_UNSUPPORTED'; end if;
  prefix:=case when b.owner_user_id is not null then b.owner_user_id::text when b.owner_organization_id is not null then b.owner_organization_id::text else (select owner_user_id::text from public.agents where id=b.agent_id) end;
  if prefix is null then raise exception 'BOOTH_OWNER_PREFIX_MISSING'; end if;
  path:=prefix||'/booths/'||p_booth_id::text||'/'||asset_id::text||'.glb';
  insert into public.booth_display_assets(id,booth_id,asset_type,storage_bucket,storage_path,mime_type,metadata,sort_order,status)
  values(asset_id,p_booth_id,'3d_scene','allpha-world-assets',path,lower(coalesce(p_mime_type,'model/gltf-binary')),coalesce(p_metadata,'{}'::jsonb),0,'pending')
  returning * into a;
  insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload)
  values(b.id,'booth_3d_asset_upload_prepared','user',auth.uid(),jsonb_build_object('asset_id',a.id,'storage_bucket',a.storage_bucket,'storage_path',a.storage_path));
  return a;
end $$;

create or replace function public.finalize_booth_3d_asset(p_asset_id uuid,p_checksum_sha256 text default null)
returns public.booth_display_assets language plpgsql security definer set search_path='' as $$
declare a public.booth_display_assets; o record;
begin
  select * into a from public.booth_display_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'BOOTH_ASSET_NOT_FOUND'; end if;
  if not private.booth_owner(a.booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
  if a.asset_type <> '3d_scene' then raise exception 'BOOTH_ASSET_NOT_3D'; end if;
  if a.status <> 'pending' then raise exception 'BOOTH_ASSET_NOT_PENDING'; end if;
  select name,owner_id,metadata into o from storage.objects where bucket_id=a.storage_bucket and name=a.storage_path and coalesce(is_delete_marker,false)=false limit 1;
  if o.name is null then raise exception 'BOOTH_ASSET_STORAGE_OBJECT_MISSING'; end if;
  if o.owner_id <> auth.uid()::text then raise exception 'BOOTH_ASSET_STORAGE_OWNER_DENIED'; end if;
  if coalesce((o.metadata->>'size')::bigint,0) <= 0 then raise exception 'BOOTH_ASSET_EMPTY'; end if;
  update public.booth_display_assets
  set status='active',content_size_bytes=(o.metadata->>'size')::bigint,
      checksum_sha256=case when p_checksum_sha256 ~ '^[0-9a-fA-F]{64}$' then lower(p_checksum_sha256) else null end,
      uploaded_at=timezone('utc',now()),updated_at=timezone('utc',now()),
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('storage_verified',true,'storage_verified_at',timezone('utc',now()),'storage_metadata',coalesce(o.metadata,'{}'::jsonb))
  where id=a.id returning * into a;
  insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload)
  values(a.booth_id,'booth_3d_asset_activated','user',auth.uid(),jsonb_build_object('asset_id',a.id,'size_bytes',a.content_size_bytes));
  return a;
end $$;

create or replace function public.archive_booth_display_asset(p_asset_id uuid)
returns public.booth_display_assets language plpgsql security definer set search_path='' as $$
declare a public.booth_display_assets;
begin
  select * into a from public.booth_display_assets where id=p_asset_id for update;
  if a.id is null then raise exception 'BOOTH_ASSET_NOT_FOUND'; end if;
  if not private.booth_owner(a.booth_id) then raise exception 'BOOTH_OWNER_DENIED'; end if;
  update public.booth_display_assets set status='archived',updated_at=timezone('utc',now()) where id=a.id returning * into a;
  update public.booth_display_slots set asset_id=null,updated_at=timezone('utc',now()) where asset_id=a.id;
  insert into public.booth_activity_events(booth_id,event_type,actor_type,actor_id,payload)
  values(a.booth_id,'booth_3d_asset_archived','user',auth.uid(),jsonb_build_object('asset_id',a.id));
  return a;
end $$;

revoke execute on function public.prepare_booth_3d_asset(uuid,text,jsonb) from public,anon;
grant execute on function public.prepare_booth_3d_asset(uuid,text,jsonb) to authenticated;
revoke execute on function public.finalize_booth_3d_asset(uuid,text) from public,anon;
grant execute on function public.finalize_booth_3d_asset(uuid,text) to authenticated;
revoke execute on function public.archive_booth_display_asset(uuid) from public,anon;
grant execute on function public.archive_booth_display_asset(uuid) to authenticated;

drop policy if exists allpha_world_assets_booth_visible_read on storage.objects;
create policy allpha_world_assets_booth_visible_read on storage.objects for select to authenticated using (
  bucket_id='allpha-world-assets' and exists (
    select 1 from public.booth_display_assets a join public.booths b on b.id=a.booth_id
    where a.storage_bucket=storage.objects.bucket_id and a.storage_path=storage.objects.name
      and a.asset_type='3d_scene' and a.status='active'
      and (b.status='active' or b.owner_user_id=(select auth.uid()))
  )
);
