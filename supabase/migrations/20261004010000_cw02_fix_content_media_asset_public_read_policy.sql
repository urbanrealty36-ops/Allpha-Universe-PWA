-- CW-02: fix authenticated public media visibility policy discovered during lifecycle evidence audit.
-- The previous policy compared cm.media_asset_id to cm.id (self-reference), so approved
-- media attached to published public content could fail the public-read branch.

drop policy if exists "content_media_assets_read" on public.content_media_assets;

create policy "content_media_assets_read"
on public.content_media_assets
for select
to authenticated
using (
  private.content_subject_owned(owner_type, owner_id, (select auth.uid()))
  or (
    status = 'active'
    and moderation_status = 'approved'
    and exists (
      select 1
      from public.content_media cm
      join public.content_items c on c.id = cm.content_id
      where cm.media_asset_id = content_media_assets.id
        and c.status = 'published'
        and c.visibility = 'public'
    )
  )
);
