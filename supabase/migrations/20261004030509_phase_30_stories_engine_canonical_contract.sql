create table public.stories (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null unique references public.content_items(id) on delete cascade,
  owner_type text not null check (owner_type in ('user','agent')),
  owner_id uuid not null,
  status text not null default 'draft' check (status in ('draft','published','expired','archived')),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index stories_owner_idx on public.stories(owner_type, owner_id);
create index stories_active_idx on public.stories(status, expires_at);

alter table public.stories enable row level security;

create policy stories_select_authenticated on public.stories
for select to authenticated
using (
  private.content_subject_owned(owner_type, owner_id, (select auth.uid()))
  or exists (
    select 1 from public.content_items c
    where c.id = content_id
      and c.status = 'published'
      and c.visibility = 'public'
      and private.content_subject_public(c.owner_type, c.owner_id)
  )
);

create or replace function private.create_story__allpha_sd(
  p_owner_type text,
  p_owner_id uuid,
  p_title text default null,
  p_body text default null,
  p_excerpt text default null,
  p_visibility text default 'public',
  p_language_code text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_expires_at timestamptz default null
) returns public.stories
language plpgsql security definer set search_path = ''
as $$
declare
  v_content public.content_items;
  v_story public.stories;
begin
  if p_expires_at is null or p_expires_at <= timezone('utc', now()) then
    raise exception 'STORY_EXPIRY_REQUIRED' using errcode='22023';
  end if;
  v_content := private.create_content__allpha_sd(
    p_owner_type, p_owner_id, 'story',
    p_title, p_body, p_excerpt, p_visibility, p_language_code, coalesce(p_metadata,'{}'::jsonb)
  );
  insert into public.stories(content_id, owner_type, owner_id, expires_at)
  values(v_content.id, p_owner_type, p_owner_id, p_expires_at)
  returning * into v_story;
  return v_story;
end;
$$;

create or replace function private.publish_story__allpha_sd(p_story_id uuid)
returns public.stories
language plpgsql security definer set search_path = ''
as $$
declare
  v_story public.stories;
  v_content public.content_items;
begin
  select * into v_story from public.stories where id = p_story_id;
  if not found then raise exception 'STORY_NOT_FOUND' using errcode='P0002'; end if;
  if not private.content_subject_owned(v_story.owner_type, v_story.owner_id, auth.uid()) then
    raise exception 'STORY_PUBLISH_DENIED' using errcode='42501';
  end if;
  if v_story.expires_at <= timezone('utc', now()) then
    raise exception 'STORY_ALREADY_EXPIRED' using errcode='42501';
  end if;
  v_content := private.publish_content__allpha_sd(v_story.content_id);
  update public.stories
  set status='published', updated_at=timezone('utc', now())
  where id=p_story_id
  returning * into v_story;
  return v_story;
end;
$$;

create or replace function private.expire_stories__allpha_sd()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
  update public.stories
  set status='expired', updated_at=timezone('utc', now())
  where status='published' and expires_at <= timezone('utc', now());
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function private.create_story__allpha_sd(text,uuid,text,text,text,text,text,jsonb,timestamptz) from public, anon, authenticated;
revoke all on function private.publish_story__allpha_sd(uuid) from public, anon, authenticated;
revoke all on function private.expire_stories__allpha_sd() from public, anon, authenticated;
grant select on public.stories to authenticated;
