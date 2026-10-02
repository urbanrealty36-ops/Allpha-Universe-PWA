-- Phase 22A hardening: covering index for the version foreign key.
create index if not exists live_sessions_template_version_idx on public.live_sessions(experience_template_version_id);
