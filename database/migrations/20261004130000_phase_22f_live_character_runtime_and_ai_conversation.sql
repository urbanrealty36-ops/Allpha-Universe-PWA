-- Phase 22F — Live Integration: Character Binding + Canonical Live Agent Turn
-- Applied to AllphaDb-Universe. No synthetic business data.

create table if not exists public.live_session_character_bindings (
  id uuid primary key default gen_random_uuid(),
  live_session_id uuid not null references public.live_sessions(id) on delete cascade,
  live_agent_collaboration_id uuid references public.live_agent_collaborations(id) on delete set null,
  asset_id uuid not null references public.live_character_assets(id) on delete restrict,
  selected_by_user_id uuid not null references public.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active','removed')),
  selected_at timestamptz not null default timezone('utc', now()),
  removed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists live_session_character_one_active on public.live_session_character_bindings(live_session_id) where status='active';
create index if not exists live_session_character_asset_idx on public.live_session_character_bindings(asset_id);
create index if not exists live_session_character_collab_idx on public.live_session_character_bindings(live_agent_collaboration_id);

alter table public.live_session_character_bindings enable row level security;
alter table public.live_session_character_bindings force row level security;
revoke all on public.live_session_character_bindings from anon, authenticated;
grant select on public.live_session_character_bindings to authenticated;

drop policy if exists live_character_binding_read on public.live_session_character_bindings;
create policy live_character_binding_read on public.live_session_character_bindings
for select to authenticated using (
  exists (
    select 1 from public.live_sessions s
    where s.id=live_session_id
      and (s.host_user_id=(select auth.uid()) or (s.status='live' and s.visibility='public'))
  )
);

create or replace function private.select_live_character(p_live_session_id uuid,p_asset_id uuid,p_collaboration_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns public.live_session_character_bindings language plpgsql security definer set search_path=''
as $$
declare s public.live_sessions; a public.live_character_assets; c public.live_agent_collaborations; b public.live_session_character_bindings;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.live_sessions where id=p_live_session_id and host_user_id=(select auth.uid()) for update;
  if s.id is null then raise exception 'LIVE_SESSION_NOT_FOUND_OR_NOT_OWNED'; end if;
  if s.status not in ('draft','scheduled','live') then raise exception 'LIVE_SESSION_NOT_CHARACTER_BINDABLE'; end if;

  select * into a from public.live_character_assets
  where id=p_asset_id and status='active' and moderation_status='approved'
    and (owner_user_id=(select auth.uid()) or exists (
      select 1 from public.agents ag where ag.id=live_character_assets.agent_id and ag.owner_user_id=(select auth.uid())
    ));
  if a.id is null then raise exception 'LIVE_CHARACTER_ASSET_NOT_AVAILABLE'; end if;

  if p_collaboration_id is not null then
    select * into c from public.live_agent_collaborations
    where id=p_collaboration_id and live_session_id=p_live_session_id and owner_user_id=(select auth.uid())
      and status='active' and consent_status='approved' and risk_decision='allow';
    if c.id is null then raise exception 'LIVE_COLLAB_NOT_ACTIVE'; end if;
    if a.agent_id is not null and a.agent_id <> c.agent_id then raise exception 'LIVE_CHARACTER_AGENT_MISMATCH'; end if;
  end if;

  update public.live_session_character_bindings
  set status='removed',removed_at=timezone('utc',now()),updated_at=timezone('utc',now())
  where live_session_id=p_live_session_id and status='active';

  insert into public.live_session_character_bindings(live_session_id,live_agent_collaboration_id,asset_id,selected_by_user_id,status,metadata)
  values(p_live_session_id,p_collaboration_id,p_asset_id,(select auth.uid()),'active',coalesce(p_metadata,'{}'::jsonb))
  returning * into b;
  return b;
end; $$;

create or replace function private.remove_live_character(p_live_session_id uuid)
returns public.live_session_character_bindings language plpgsql security definer set search_path=''
as $$
declare b public.live_session_character_bindings;
begin
  update public.live_session_character_bindings b0
  set status='removed',removed_at=timezone('utc',now()),updated_at=timezone('utc',now())
  where b0.live_session_id=p_live_session_id and b0.status='active'
    and exists (select 1 from public.live_sessions s where s.id=b0.live_session_id and s.host_user_id=(select auth.uid()))
  returning b0.* into b;
  if b.id is null then raise exception 'LIVE_CHARACTER_NOT_ACTIVE'; end if;
  return b;
end; $$;

create or replace function public.select_live_character(p_live_session_id uuid,p_asset_id uuid,p_collaboration_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns public.live_session_character_bindings language sql security definer set search_path=''
as $$ select private.select_live_character(p_live_session_id,p_asset_id,p_collaboration_id,p_metadata); $$;
create or replace function public.remove_live_character(p_live_session_id uuid)
returns public.live_session_character_bindings language sql security definer set search_path=''
as $$ select private.remove_live_character(p_live_session_id); $$;

revoke all on function public.select_live_character(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.remove_live_character(uuid) from public,anon,authenticated;
grant execute on function public.select_live_character(uuid,uuid,uuid,jsonb) to authenticated;
grant execute on function public.remove_live_character(uuid) to authenticated;

create or replace function public.create_live_session_message(p_live_session_id uuid,p_sender_type text,p_content text,p_live_collaboration_id uuid default null,p_viewer_id uuid default null)
returns public.live_session_messages language plpgsql security definer set search_path=''
as $$
declare s public.live_sessions; c public.live_agent_collaborations; v public.live_session_viewers; a public.agents; cap public.agent_capabilities; pol public.agent_policies; ks public.agent_kill_switches; m public.live_session_messages;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(trim(p_content),'') is null then raise exception 'LIVE_MESSAGE_CONTENT_REQUIRED'; end if;
  select * into s from public.live_sessions where id=p_live_session_id and status='live';
  if s.id is null then raise exception 'LIVE_SESSION_NOT_LIVE'; end if;

  if p_sender_type='owner' then
    if s.host_user_id <> (select auth.uid()) then raise exception 'LIVE_OWNER_REQUIRED'; end if;
  elsif p_sender_type='audience' then
    select * into v from public.live_session_viewers where id=p_viewer_id and live_session_id=p_live_session_id and user_id=(select auth.uid()) and left_at is null;
    if v.id is null then raise exception 'LIVE_VIEWER_REQUIRED'; end if;
  elsif p_sender_type='agent' then
    select * into c from public.live_agent_collaborations where id=p_live_collaboration_id and live_session_id=p_live_session_id and owner_user_id=(select auth.uid()) and status='active' and consent_status='approved' and risk_decision='allow' for update;
    if c.id is null then raise exception 'LIVE_COLLAB_NOT_ACTIVE'; end if;
    select * into a from public.agents where id=c.agent_id and owner_user_id=(select auth.uid()) and status='active';
    if a.id is null then raise exception 'AGENT_NOT_ACTIVE_OR_NOT_OWNED'; end if;
    select * into cap from public.agent_capabilities where agent_id=a.id and enabled=true and capability in (c.required_capability,'live','live.'||c.mode) limit 1;
    if cap.id is null then raise exception 'AGENT_CAPABILITY_NOT_GRANTED'; end if;
    select * into pol from public.agent_policies where agent_id=a.id and enabled=true order by policy_version desc limit 1;
    if pol.id is null then raise exception 'AGENT_POLICY_NOT_CONFIGURED'; end if;
    select * into ks from public.agent_kill_switches where agent_id=a.id;
    if coalesce(ks.enabled,false) then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
    if coalesce(pol.rules->'live'->>'enabled','true')='false' then raise exception 'LIVE_COLLAB_POLICY_DENIED'; end if;
  else
    raise exception 'LIVE_MESSAGE_SENDER_INVALID';
  end if;

  insert into public.live_session_messages(live_session_id,live_collaboration_id,viewer_id,sender_type,sender_user_id,sender_agent_id,role,message_type,content)
  values(p_live_session_id,case when p_live_collaboration_id is null then null else p_live_collaboration_id end,case when p_sender_type='audience' then p_viewer_id else null end,p_sender_type,case when p_sender_type in ('owner','audience') then (select auth.uid()) else null end,case when p_sender_type='agent' then c.agent_id else null end,case when p_sender_type='agent' then 'assistant' else 'user' end,'text',trim(p_content))
  returning * into m;
  return m;
end; $$;

revoke all on function public.create_live_session_message(uuid,text,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_live_session_message(uuid,text,text,uuid,uuid) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_session_character_bindings') then
    alter publication supabase_realtime add table public.live_session_character_bindings;
  end if;
end $$;
