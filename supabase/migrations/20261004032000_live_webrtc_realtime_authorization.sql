drop policy if exists live_webrtc_receive on realtime.messages;
drop policy if exists live_webrtc_send on realtime.messages;

create policy live_webrtc_receive
on realtime.messages for select to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() like 'live-webrtc:%'
  and exists (
    select 1 from public.live_sessions s
    where s.id = split_part(realtime.topic(), ':', 2)::uuid
      and (
        s.host_user_id = (select auth.uid())
        or exists (select 1 from public.live_session_viewers v where v.live_session_id=s.id and v.user_id=(select auth.uid()) and v.left_at is null)
        or exists (select 1 from public.agents a where a.id=s.host_agent_id and a.owner_user_id=(select auth.uid()))
      )
  )
);

create policy live_webrtc_send
on realtime.messages for insert to authenticated
with check (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() like 'live-webrtc:%'
  and exists (
    select 1 from public.live_sessions s
    where s.id = split_part(realtime.topic(), ':', 2)::uuid
      and (
        s.host_user_id = (select auth.uid())
        or exists (select 1 from public.live_session_viewers v where v.live_session_id=s.id and v.user_id=(select auth.uid()) and v.left_at is null)
        or exists (select 1 from public.agents a where a.id=s.host_agent_id and a.owner_user_id=(select auth.uid()))
      )
  )
);