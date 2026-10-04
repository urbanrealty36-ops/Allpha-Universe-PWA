create or replace function private.authorize_live_webrtc_participant__allpha_sd(
  p_live_session_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.live_sessions s
    where s.id = p_live_session_id
      and (
        (
          s.status = 'live'
          and s.host_user_id = (select auth.uid())
          and exists (
            select 1
            from public.live_session_stage_bindings sb
            where sb.live_session_id = s.id
              and sb.status = 'active'
          )
          and exists (
            select 1
            from public.live_session_human_presentations hp
            join public.live_human_presence_verifications pv
              on pv.id = hp.presence_verification_id
            join public.live_session_camera_sources cs
              on cs.id = hp.camera_source_id
            where hp.live_session_id = s.id
              and hp.owner_user_id = (select auth.uid())
              and hp.status = 'active'
              and pv.owner_user_id = (select auth.uid())
              and pv.verification_status = 'verified'
              and pv.expires_at > timezone('utc', now())
              and cs.owner_user_id = (select auth.uid())
              and cs.status = 'active'
              and cs.permission_status = 'granted'
          )
        )
        or (
          s.status = 'live'
          and s.visibility = 'public'
          and exists (
            select 1
            from public.live_session_viewers v
            where v.live_session_id = s.id
              and v.user_id = (select auth.uid())
              and v.left_at is null
          )
        )
      )
  );
$$;

revoke execute on function private.authorize_live_webrtc_participant__allpha_sd(uuid) from public;
revoke execute on function private.authorize_live_webrtc_participant__allpha_sd(uuid) from anon;
grant execute on function private.authorize_live_webrtc_participant__allpha_sd(uuid) to authenticated;
grant execute on function private.authorize_live_webrtc_participant__allpha_sd(uuid) to service_role;

drop policy if exists live_webrtc_receive on realtime.messages;
drop policy if exists live_webrtc_send on realtime.messages;

create policy live_webrtc_receive
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and realtime.topic() ~ '^live-webrtc:[0-9a-fA-F-]{36}$'
  and (
    select private.authorize_live_webrtc_participant__allpha_sd(
      split_part(realtime.topic(), ':', 2)::uuid
    )
  )
);

create policy live_webrtc_send
on realtime.messages
for insert
to authenticated
with check (
  extension = 'broadcast'
  and realtime.topic() ~ '^live-webrtc:[0-9a-fA-F-]{36}$'
  and (
    select private.authorize_live_webrtc_participant__allpha_sd(
      split_part(realtime.topic(), ':', 2)::uuid
    )
  )
);
