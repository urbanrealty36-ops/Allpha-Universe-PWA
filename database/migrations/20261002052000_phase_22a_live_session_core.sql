-- Phase 22A — Live Session Core
-- Versioned Live Experience template binding, owner-scoped session lifecycle and RLS.
-- No seed session/user/Agent data.

alter table public.live_sessions
  add column if not exists experience_template_id uuid references public.live_experience_templates(id) on delete restrict,
  add column if not exists experience_template_version_id uuid references public.live_experience_template_versions(id) on delete restrict,
  add column if not exists scheduled_at timestamptz;

create index if not exists live_sessions_host_user_idx on public.live_sessions(host_user_id);
create index if not exists live_sessions_template_idx on public.live_sessions(experience_template_id, experience_template_version_id);
create index if not exists live_sessions_status_idx on public.live_sessions(status, scheduled_at);

alter table public.live_sessions enable row level security;
alter table public.live_sessions force row level security;

revoke all on public.live_sessions from anon, authenticated;
grant select, insert, update on public.live_sessions to authenticated;

drop policy if exists live_sessions_select_owner on public.live_sessions;
drop policy if exists live_sessions_update_owner on public.live_sessions;
drop policy if exists live_sessions_insert_owner on public.live_sessions;
drop policy if exists live_sessions_delete_owner on public.live_sessions;

drop policy if exists live_sessions_read on public.live_sessions;
create policy live_sessions_read on public.live_sessions
for select to authenticated
using (
  (host_user_id = (select auth.uid()))
  or (status = 'live' and visibility = 'public')
);

create policy live_sessions_insert_owner on public.live_sessions
for insert to authenticated
with check (
  (select auth.uid()) = host_user_id
  and exists (
    select 1
    from public.live_experience_templates t
    join public.live_experience_template_versions v on v.template_id=t.id
    where t.id=experience_template_id
      and v.id=experience_template_version_id
      and t.source='platform'
      and t.status='published'
      and t.moderation_status='approved'
      and v.status='published'
      and v.validation_status='passed'
      and v.performance_status='passed'
      and v.moderation_status='approved'
  )
);

create policy live_sessions_update_owner on public.live_sessions
for update to authenticated
using ((select auth.uid()) = host_user_id)
with check ((select auth.uid()) = host_user_id);

create or replace function private.validate_live_session_template()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.experience_template_id is null or new.experience_template_version_id is null then
    raise exception using errcode='23514', message='LIVE_TEMPLATE_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.live_experience_templates t
    join public.live_experience_template_versions v on v.template_id=t.id
    where t.id=new.experience_template_id
      and v.id=new.experience_template_version_id
      and t.source='platform'
      and t.status='published'
      and t.moderation_status='approved'
      and v.status='published'
      and v.validation_status='passed'
      and v.performance_status='passed'
      and v.moderation_status='approved'
  ) then
    raise exception using errcode='23514', message='LIVE_TEMPLATE_VERSION_NOT_PUBLISHED';
  end if;

  if tg_op='UPDATE' then
    if new.host_user_id <> old.host_user_id
       or new.experience_template_id <> old.experience_template_id
       or new.experience_template_version_id <> old.experience_template_version_id then
      raise exception using errcode='42501', message='LIVE_CORE_FIELDS_IMMUTABLE';
    end if;

    if old.status='draft' and new.status not in ('draft','scheduled','cancelled') then
      raise exception using errcode='23514', message='LIVE_INVALID_STATUS_TRANSITION';
    elsif old.status='scheduled' and new.status not in ('scheduled','live','cancelled') then
      raise exception using errcode='23514', message='LIVE_INVALID_STATUS_TRANSITION';
    elsif old.status='live' and new.status not in ('live','ended') then
      raise exception using errcode='23514', message='LIVE_INVALID_STATUS_TRANSITION';
    elsif old.status in ('ended','cancelled') and new.status <> old.status then
      raise exception using errcode='23514', message='LIVE_TERMINAL_STATUS';
    end if;

    if new.status='scheduled' and new.scheduled_at is null then
      raise exception using errcode='23514', message='LIVE_SCHEDULE_TIME_REQUIRED';
    end if;
    if new.status='live' and new.started_at is null then
      new.started_at := timezone('utc', now());
    end if;
    if new.status='ended' and new.ended_at is null then
      new.ended_at := timezone('utc', now());
    end if;
    if new.status='cancelled' then
      new.started_at := null;
      new.ended_at := null;
    end if;
  end if;

  return new;
end $$;

drop trigger if exists live_sessions_validate_core on public.live_sessions;
create trigger live_sessions_validate_core
before insert or update on public.live_sessions
for each row execute function private.validate_live_session_template();

create or replace function private.live_session_updated_at()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end $$;

drop trigger if exists live_sessions_updated_at on public.live_sessions;
create trigger live_sessions_updated_at
before update on public.live_sessions
for each row execute function private.live_session_updated_at();