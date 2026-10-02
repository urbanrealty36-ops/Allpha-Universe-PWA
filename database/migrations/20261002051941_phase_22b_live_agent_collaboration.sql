-- Phase 22B
alter table public.live_agent_collaborations add column if not exists required_capability text, add column if not exists capability_verified boolean not null default false, add column if not exists policy_version integer, add column if not exists policy_verified boolean not null default false, add column if not exists risk_decision text not null default 'pending', add column if not exists risk_assessment_id uuid, add column if not exists consent_at timestamptz, add column if not exists verified_at timestamptz;
alter table public.live_agent_collaborations drop constraint if exists live_agent_collaborations_risk_decision_check;
alter table public.live_agent_collaborations add constraint live_agent_collaborations_risk_decision_check check (risk_decision in ('pending','allow','deny'));
create index if not exists live_collab_session_idx on public.live_agent_collaborations(live_session_id);
create index if not exists live_collab_agent_idx on public.live_agent_collaborations(agent_id);
create index if not exists live_collab_owner_idx on public.live_agent_collaborations(owner_user_id);
alter table public.live_agent_collaborations enable row level security;
alter table public.live_agent_collaborations force row level security;
revoke all on public.live_agent_collaborations from anon, authenticated;
grant select on public.live_agent_collaborations to authenticated;
drop policy if exists live_collab_owner_read on public.live_agent_collaborations;
create policy live_collab_owner_read on public.live_agent_collaborations for select to authenticated using (owner_user_id=(select auth.uid()));
create or replace function private.request_live_agent_collaboration(p_live_session_id uuid,p_agent_id uuid,p_mode text,p_required_capability text,p_authority_policy jsonb default '{}'::jsonb,p_interaction_policy jsonb default '{}'::jsonb) returns public.live_agent_collaborations language plpgsql security definer set search_path to '' as $$
declare s public.live_sessions; a public.agents; cap public.agent_capabilities; pass public.agent_passports; pol public.agent_policies; ks public.agent_kill_switches; v public.live_agent_collaborations;
begin
if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;
if p_mode not in ('cohost','interactive','sales','podcast','talkshow','presentation','moderation') then raise exception 'LIVE_COLLAB_MODE_INVALID'; end if;
if nullif(trim(p_required_capability),'') is null then raise exception 'LIVE_COLLAB_CAPABILITY_REQUIRED'; end if;
select * into s from public.live_sessions where id=p_live_session_id and host_user_id=(select auth.uid()) for update;
if s.id is null then raise exception 'LIVE_SESSION_NOT_FOUND_OR_NOT_OWNED'; end if;
if s.status not in ('draft','scheduled','live') then raise exception 'LIVE_SESSION_NOT_COLLABORABLE'; end if;
select * into a from public.agents where id=p_agent_id and owner_user_id=(select auth.uid()) for update;
if a.id is null then raise exception 'AGENT_NOT_FOUND_OR_NOT_OWNED'; end if;
if a.status <> 'active' then raise exception 'AGENT_NOT_ACTIVE'; end if;
select * into pass from public.agent_passports where agent_id=p_agent_id;
if pass.agent_id is null or pass.verification_status <> 'verified' then raise exception 'AGENT_PASSPORT_NOT_VERIFIED'; end if;
select * into cap from public.agent_capabilities where agent_id=p_agent_id and enabled=true and capability in (p_required_capability,'live','live.'||p_mode) order by case when capability=p_required_capability then 0 when capability='live.'||p_mode then 1 else 2 end limit 1;
if cap.id is null then raise exception 'AGENT_CAPABILITY_NOT_GRANTED'; end if;
select * into pol from public.agent_policies where agent_id=p_agent_id and enabled=true order by policy_version desc limit 1;
if pol.id is null then raise exception 'AGENT_POLICY_NOT_CONFIGURED'; end if;
select * into ks from public.agent_kill_switches where agent_id=p_agent_id;
if coalesce(ks.enabled,false) then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
select * into v from public.live_agent_collaborations where live_session_id=p_live_session_id and agent_id=p_agent_id and status not in ('ended','rejected') order by created_at desc limit 1;
if v.id is not null then return v; end if;
insert into public.live_agent_collaborations(live_session_id,agent_id,owner_user_id,mode,authority_policy,interaction_policy,consent_status,status,required_capability,capability_verified,policy_version,policy_verified,risk_decision)
values(s.id,a.id,(select auth.uid()),p_mode,coalesce(p_authority_policy,'{}'::jsonb),coalesce(p_interaction_policy,'{}'::jsonb),'pending','requested',p_required_capability,true,pol.policy_version,true,'pending') returning * into v;
return v;
end; $$;
create or replace function private.set_live_agent_consent(p_collaboration_id uuid,p_approved boolean) returns public.live_agent_collaborations language plpgsql security definer set search_path to '' as $$
declare v public.live_agent_collaborations;
begin
select * into v from public.live_agent_collaborations where id=p_collaboration_id and owner_user_id=(select auth.uid()) for update;
if v.id is null then raise exception 'LIVE_COLLAB_NOT_FOUND_OR_NOT_OWNED'; end if;
if v.status not in ('requested','approved') then raise exception 'LIVE_COLLAB_NOT_CONSENTABLE'; end if;
update public.live_agent_collaborations set consent_status=case when p_approved then 'approved' else 'revoked' end,status=case when p_approved then 'approved' else 'rejected' end,consent_at=case when p_approved then timezone('utc',now()) else null end,updated_at=timezone('utc',now()) where id=v.id returning * into v;
return v;
end; $$;
create or replace function private.activate_live_agent_collaboration(p_collaboration_id uuid) returns public.live_agent_collaborations language plpgsql security definer set search_path to '' as $$
declare v public.live_agent_collaborations; s public.live_sessions; a public.agents; cap public.agent_capabilities; pol public.agent_policies; ks public.agent_kill_switches;
begin
select * into v from public.live_agent_collaborations where id=p_collaboration_id and owner_user_id=(select auth.uid()) for update;
if v.id is null then raise exception 'LIVE_COLLAB_NOT_FOUND_OR_NOT_OWNED'; end if;
if v.consent_status <> 'approved' then raise exception 'LIVE_COLLAB_CONSENT_REQUIRED'; end if;
if v.status <> 'approved' then raise exception 'LIVE_COLLAB_NOT_APPROVED'; end if;
select * into s from public.live_sessions where id=v.live_session_id and host_user_id=(select auth.uid());
if s.id is null or s.status not in ('draft','scheduled','live') then raise exception 'LIVE_SESSION_NOT_ACTIVE'; end if;
select * into a from public.agents where id=v.agent_id and owner_user_id=(select auth.uid());
if a.id is null or a.status <> 'active' then raise exception 'AGENT_NOT_ACTIVE_OR_NOT_OWNED'; end if;
select * into cap from public.agent_capabilities where agent_id=v.agent_id and enabled=true and capability in (v.required_capability,'live','live.'||v.mode) limit 1;
if cap.id is null then raise exception 'AGENT_CAPABILITY_NOT_GRANTED'; end if;
select * into pol from public.agent_policies where agent_id=v.agent_id and enabled=true order by policy_version desc limit 1;
if pol.id is null then raise exception 'AGENT_POLICY_NOT_CONFIGURED'; end if;
select * into ks from public.agent_kill_switches where agent_id=v.agent_id;
if coalesce(ks.enabled,false) then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
if coalesce(pol.rules->'live'->>'enabled','true')='false' then update public.live_agent_collaborations set risk_decision='deny',updated_at=timezone('utc',now()) where id=v.id returning * into v; raise exception 'LIVE_COLLAB_POLICY_DENIED'; end if;
update public.live_agent_collaborations set status='active',risk_decision='allow',capability_verified=true,policy_verified=true,verified_at=timezone('utc',now()),started_at=coalesce(started_at,timezone('utc',now())),updated_at=timezone('utc',now()) where id=v.id returning * into v;
return v;
end; $$;
create or replace function private.transition_live_agent_collaboration(p_collaboration_id uuid,p_target text) returns public.live_agent_collaborations language plpgsql security definer set search_path to '' as $$
declare v public.live_agent_collaborations;
begin
select * into v from public.live_agent_collaborations where id=p_collaboration_id and owner_user_id=(select auth.uid()) for update;
if v.id is null then raise exception 'LIVE_COLLAB_NOT_FOUND_OR_NOT_OWNED'; end if;
if p_target='paused' and v.status<>'active' then raise exception 'LIVE_COLLAB_NOT_ACTIVE'; end if;
if p_target='ended' and v.status not in ('active','paused') then raise exception 'LIVE_COLLAB_NOT_RUNNING'; end if;
if p_target not in ('paused','ended') then raise exception 'LIVE_COLLAB_TARGET_INVALID'; end if;
update public.live_agent_collaborations set status=p_target,ended_at=case when p_target='ended' then timezone('utc',now()) else null end,updated_at=timezone('utc',now()) where id=v.id returning * into v;
return v;
end; $$;