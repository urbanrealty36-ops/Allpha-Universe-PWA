-- Phase 22D hardening: remove duplicate viewer unique constraint and keep
-- Realtime trigger helpers out of the exposed public RPC surface.

alter table public.live_session_viewers drop constraint if exists live_session_viewers_session_user_unique;

create schema if not exists private;

create or replace function private.broadcast_live_session_message()
returns trigger security definer set search_path to '' language plpgsql
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'id',new.id,'live_session_id',new.live_session_id,'live_collaboration_id',new.live_collaboration_id,
      'viewer_id',new.viewer_id,'sender_type',new.sender_type,'sender_user_id',new.sender_user_id,
      'sender_agent_id',new.sender_agent_id,'role',new.role,'message_type',new.message_type,
      'content',new.content,'created_at',new.created_at
    ),
    'live_message_created','live:'||new.live_session_id::text,true
  );
  return new;
end; $$;

create or replace function private.broadcast_live_audience_interaction()
returns trigger security definer set search_path to '' language plpgsql
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'id',new.id,'live_session_id',new.live_session_id,'viewer_id',new.viewer_id,
      'interaction_type',new.interaction_type,'payload',new.payload,'status',new.status,'created_at',new.created_at
    ),
    'live_audience_interaction','live:'||new.live_session_id::text,true
  );
  return new;
end; $$;

drop trigger if exists live_session_message_broadcast on public.live_session_messages;
create trigger live_session_message_broadcast after insert on public.live_session_messages
for each row execute function private.broadcast_live_session_message();

drop trigger if exists live_audience_interaction_broadcast on public.live_audience_interactions;
create trigger live_audience_interaction_broadcast after insert on public.live_audience_interactions
for each row execute function private.broadcast_live_audience_interaction();

drop function if exists public.broadcast_live_session_message();
drop function if exists public.broadcast_live_audience_interaction();