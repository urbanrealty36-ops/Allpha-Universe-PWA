drop policy if exists live_channel_read on realtime.messages;
create policy live_channel_read on realtime.messages
for select to authenticated
using (
  realtime.messages.extension in ('broadcast','presence')
  and realtime.topic() ~ '^live:[0-9a-fA-F-]{36}$'
  and exists (
    select 1 from public.live_sessions s
    where s.id=split_part(realtime.topic(),':',2)::uuid
      and (s.host_user_id=(select auth.uid()) or (s.status='live' and s.visibility='public'))
  )
);

drop policy if exists live_channel_presence_write on realtime.messages;
create policy live_channel_presence_write on realtime.messages
for insert to authenticated
with check (
  realtime.messages.extension='presence'
  and realtime.topic() ~ '^live:[0-9a-fA-F-]{36}$'
  and exists (
    select 1 from public.live_sessions s
    where s.id=split_part(realtime.topic(),':',2)::uuid
      and s.status='live'
      and s.visibility='public'
  )
);