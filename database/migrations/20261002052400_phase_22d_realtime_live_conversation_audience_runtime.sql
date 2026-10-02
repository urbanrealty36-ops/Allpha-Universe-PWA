-- Phase 22D — Realtime Live Conversation / Audience Runtime
-- Durable conversation/interactions remain authoritative in PostgreSQL.
-- Supabase Realtime Broadcast/Presence is transport only.

create table if not exists public.live_session_messages (
  id uuid primary key default gen_random_uuid(),
  live_session_id uuid not null references public.live_sessions(id) on delete cascade,
  live_collaboration_id uuid references public.live_agent_collaborations(id) on delete set null,
  viewer_id uuid references public.live_session_viewers(id) on delete set null,
  sender_type text not null check (sender_type in ('owner','agent','audience','system')),
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_agent_id uuid references public.agents(id) on delete set null,
  role text not null check (role in ('user','assistant','system')),
  message_type text not null default 'text' check (message_type in ('text','system')),
  content text not null check (length(trim(content)) between 1 and 20000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint live_session_messages_sender_shape check (
    (sender_type='owner' and sender_user_id is not null and sender_agent_id is null)
    or (sender_type='agent' and sender_agent_id is not null and sender_user_id is null)
    or (sender_type='audience' and sender_user_id is not null)
    or (sender_type='system' and sender_user_id is null and sender_agent_id is null)
  )
);
create index if not exists live_messages_session_created_idx on public.live_session_messages(live_session_id, created_at, id);
create index if not exists live_messages_collaboration_idx on public.live_session_messages(live_collaboration_id, created_at);
create index if not exists live_messages_viewer_idx on public.live_session_messages(viewer_id, created_at);
alter table public.live_session_messages enable row level security;
alter table public.live_session_messages force row level security;
revoke all on public.live_session_messages from anon, authenticated;
grant select on public.live_session_messages to authenticated;
drop policy if exists live_messages_read on public.live_session_messages;
create policy live_messages_read on public.live_session_messages for select to authenticated using (
  exists (select 1 from public.live_sessions s where s.id=live_session_messages.live_session_id and (s.host_user_id=(select auth.uid()) or (s.status='live' and s.visibility='public')))
);

create table if not exists public.live_audience_interactions (
  id uuid primary key default gen_random_uuid(),
  live_session_id uuid not null references public.live_sessions(id) on delete cascade,
  viewer_id uuid not null references public.live_session_viewers(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('reaction','question','raise_hand','poll_response','share','report')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists live_audience_interactions_session_created_idx on public.live_audience_interactions(live_session_id, created_at desc);
create index if not exists live_audience_interactions_viewer_created_idx on public.live_audience_interactions(viewer_id, created_at desc);
alter table public.live_audience_interactions enable row level security;
alter table public.live_audience_interactions force row level security;
revoke all on public.live_audience_interactions from anon, authenticated;
grant select on public.live_audience_interactions to authenticated;
drop policy if exists live_audience_interactions_read on public.live_audience_interactions;
create policy live_audience_interactions_read on public.live_audience_interactions for select to authenticated using (
  exists (select 1 from public.live_session_viewers v where v.id=live_audience_interactions.viewer_id and v.user_id=(select auth.uid()))
  or exists (select 1 from public.live_sessions s where s.id=live_audience_interactions.live_session_id and s.host_user_id=(select auth.uid()))
);

alter table public.live_session_viewers add constraint live_session_viewers_session_user_unique unique(live_session_id,user_id);
grant update on public.live_session_viewers to authenticated;
drop policy if exists live_viewer_owner_update on public.live_session_viewers;
create policy live_viewer_owner_update on public.live_session_viewers for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create or replace function public.join_live_session(p_live_session_id uuid) returns public.live_session_viewers language plpgsql security definer set search_path to '' as $$
declare s public.live_sessions; v public.live_session_viewers;
begin
  select * into s from public.live_sessions where id=p_live_session_id and status='live' and visibility='public';
  if s.id is null then raise exception 'LIVE_SESSION_NOT_PUBLICLY_LIVE'; end if;
  insert into public.live_session_viewers(live_session_id,user_id,joined_at,left_at)
  values(p_live_session_id,(select auth.uid()),timezone('utc',now()),null)
  on conflict(live_session_id,user_id) do update set joined_at=timezone('utc',now()),left_at=null
  returning * into v;
  return v;
end; $$;

create or replace function public.leave_live_session(p_live_session_id uuid) returns public.live_session_viewers language plpgsql security definer set search_path to '' as $$
declare v public.live_session_viewers;
begin
  update public.live_session_viewers set left_at=timezone('utc',now()) where live_session_id=p_live_session_id and user_id=(select auth.uid()) returning * into v;
  if v.id is null then raise exception 'LIVE_VIEWER_NOT_FOUND'; end if;
  return v;
end; $$;

create or replace function public.create_live_session_message(p_live_session_id uuid,p_sender_type text,p_content text,p_live_collaboration_id uuid default null,p_viewer_id uuid default null)
returns public.live_session_messages language plpgsql security definer set search_path to '' as $$
declare s public.live_sessions; c public.live_agent_collaborations; v public.live_session_viewers; m public.live_session_messages;
begin
  select * into s from public.live_sessions where id=p_live_session_id and status='live';
  if s.id is null then raise exception 'LIVE_SESSION_NOT_LIVE'; end if;
  if p_sender_type='owner' then
    if s.host_user_id<>(select auth.uid()) then raise exception 'LIVE_OWNER_REQUIRED'; end if;
  elsif p_sender_type='audience' then
    select * into v from public.live_session_viewers where id=p_viewer_id and live_session_id=p_live_session_id and user_id=(select auth.uid()) and left_at is null;
    if v.id is null then raise exception 'LIVE_VIEWER_REQUIRED'; end if;
  elsif p_sender_type='agent' then
    select * into c from public.live_agent_collaborations where id=p_live_collaboration_id and live_session_id=p_live_session_id and owner_user_id=(select auth.uid());
    if c.id is null or c.status<>'active' or c.consent_status<>'approved' or c.risk_decision<>'allow' then raise exception 'LIVE_COLLAB_NOT_ACTIVE'; end if;
  else raise exception 'LIVE_MESSAGE_SENDER_INVALID'; end if;
  insert into public.live_session_messages(live_session_id,live_collaboration_id,viewer_id,sender_type,sender_user_id,sender_agent_id,role,message_type,content)
  values(p_live_session_id,p_live_collaboration_id,case when p_sender_type='audience' then p_viewer_id else null end,p_sender_type,case when p_sender_type in ('owner','audience') then (select auth.uid()) else null end,case when p_sender_type='agent' then c.agent_id else null end,case when p_sender_type='agent' then 'assistant' when p_sender_type='system' then 'system' else 'user' end,'text',trim(p_content))
  returning * into m;
  return m;
end; $$;

create or replace function public.create_live_audience_interaction(p_live_session_id uuid,p_viewer_id uuid,p_interaction_type text,p_payload jsonb default '{}'::jsonb)
returns public.live_audience_interactions language plpgsql security definer set search_path to '' as $$
declare s public.live_sessions; v public.live_session_viewers; i public.live_audience_interactions;
begin
  select * into s from public.live_sessions where id=p_live_session_id and status='live' and visibility='public';
  if s.id is null then raise exception 'LIVE_SESSION_NOT_PUBLICLY_LIVE'; end if;
  select * into v from public.live_session_viewers where id=p_viewer_id and live_session_id=p_live_session_id and user_id=(select auth.uid()) and left_at is null;
  if v.id is null then raise exception 'LIVE_VIEWER_REQUIRED'; end if;
  insert into public.live_audience_interactions(live_session_id,viewer_id,interaction_type,payload) values(p_live_session_id,p_viewer_id,p_interaction_type,p_payload) returning * into i;
  update public.live_session_viewers set interaction_count=interaction_count+1 where id=v.id;
  return i;
end; $$;

create or replace function public.broadcast_live_session_message() returns trigger security definer set search_path to '' language plpgsql as $$
begin
  perform realtime.send(jsonb_build_object('id',new.id,'live_session_id',new.live_session_id,'live_collaboration_id',new.live_collaboration_id,'viewer_id',new.viewer_id,'sender_type',new.sender_type,'sender_user_id',new.sender_user_id,'sender_agent_id',new.sender_agent_id,'role',new.role,'message_type',new.message_type,'content',new.content,'created_at',new.created_at),'live_message_created','live:'||new.live_session_id::text,true);
  return new;
end; $$;
drop trigger if exists live_session_message_broadcast on public.live_session_messages;
create trigger live_session_message_broadcast after insert on public.live_session_messages for each row execute function public.broadcast_live_session_message();

create or replace function public.broadcast_live_audience_interaction() returns trigger security definer set search_path to '' language plpgsql as $$
begin
  perform realtime.send(jsonb_build_object('id',new.id,'live_session_id',new.live_session_id,'viewer_id',new.viewer_id,'interaction_type',new.interaction_type,'payload',new.payload,'status',new.status,'created_at',new.created_at),'live_audience_interaction','live:'||new.live_session_id::text,true);
  return new;
end; $$;
drop trigger if exists live_audience_interaction_broadcast on public.live_audience_interactions;
create trigger live_audience_interaction_broadcast after insert on public.live_audience_interactions for each row execute function public.broadcast_live_audience_interaction();

drop policy if exists live_channel_read on realtime.messages;
create policy live_channel_read on realtime.messages for select to authenticated using (
  realtime.messages.extension in ('broadcast','presence') and realtime.topic() like 'live:%' and exists (
    select 1 from public.live_sessions s where s.id=split_part(realtime.topic(),':',2)::uuid and (s.host_user_id=(select auth.uid()) or (s.status='live' and s.visibility='public'))
  )
);
drop policy if exists live_channel_presence_write on realtime.messages;
create policy live_channel_presence_write on realtime.messages for insert to authenticated with check (
  realtime.messages.extension='presence' and realtime.topic() like 'live:%' and exists (
    select 1 from public.live_sessions s where s.id=split_part(realtime.topic(),':',2)::uuid and s.status='live' and s.visibility='public'
  )
);

revoke all on function public.join_live_session(uuid) from public,anon,authenticated;
revoke all on function public.leave_live_session(uuid) from public,anon,authenticated;
revoke all on function public.create_live_session_message(uuid,text,text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.create_live_audience_interaction(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.join_live_session(uuid) to authenticated;
grant execute on function public.leave_live_session(uuid) to authenticated;
grant execute on function public.create_live_session_message(uuid,text,text,uuid,uuid) to authenticated;
grant execute on function public.create_live_audience_interaction(uuid,uuid,text,jsonb) to authenticated;