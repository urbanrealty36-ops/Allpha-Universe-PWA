-- Phase 22A hardening: enforce schedule-time authority in the database trigger.
create or replace function private.validate_live_session_template()
returns trigger language plpgsql set search_path=''
as $$
begin
  if new.experience_template_id is null or new.experience_template_version_id is null then raise exception using errcode='23514', message='LIVE_TEMPLATE_REQUIRED'; end if;
  if not exists (select 1 from public.live_experience_templates t join public.live_experience_template_versions v on v.template_id=t.id where t.id=new.experience_template_id and v.id=new.experience_template_version_id and t.source='platform' and t.status='published' and t.moderation_status='approved' and v.status='published' and v.validation_status='passed' and v.performance_status='passed' and v.moderation_status='approved') then raise exception using errcode='23514', message='LIVE_TEMPLATE_VERSION_NOT_PUBLISHED'; end if;
  if tg_op='UPDATE' then
    if new.host_user_id <> old.host_user_id or new.experience_template_id <> old.experience_template_id or new.experience_template_version_id <> old.experience_template_version_id then raise exception using errcode='42501', message='LIVE_CORE_FIELDS_IMMUTABLE'; end if;
    if old.status='draft' and new.status not in ('draft','scheduled','cancelled') then raise exception using errcode='23514', message='LIVE_INVALID_STATUS_TRANSITION';
    elsif old.status='scheduled' and new.status not in ('scheduled','live','cancelled') then raise exception using errcode='23514', message='LIVE_INVALID_STATUS_TRANSITION';
    elsif old.status='live' and new.status not in ('live','ended') then raise exception using errcode='23514', message='LIVE_INVALID_STATUS_TRANSITION';
    elsif old.status in ('ended','cancelled') and new.status <> old.status then raise exception using errcode='23514', message='LIVE_TERMINAL_STATUS'; end if;
    if new.status='scheduled' then
      if new.scheduled_at is null then raise exception using errcode='23514', message='LIVE_SCHEDULE_TIME_REQUIRED'; end if;
      if new.scheduled_at <= timezone('utc', now()) then raise exception using errcode='23514', message='LIVE_SCHEDULE_TIME_MUST_BE_FUTURE'; end if;
    end if;
    if new.status='live' then
      if new.scheduled_at is not null and new.scheduled_at > timezone('utc', now()) then raise exception using errcode='23514', message='LIVE_SCHEDULED_TIME_NOT_REACHED'; end if;
      if new.started_at is null then new.started_at := timezone('utc', now()); end if;
    end if;
    if new.status='ended' and new.ended_at is null then new.ended_at := timezone('utc', now()); end if;
    if new.status='cancelled' then new.started_at := null; new.ended_at := null; end if;
  end if;
  return new;
end $$;
