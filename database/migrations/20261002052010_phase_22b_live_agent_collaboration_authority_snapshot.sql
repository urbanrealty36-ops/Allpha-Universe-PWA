-- Phase 22B hardening: Authority policy is server-derived from the enabled Agent Policy.
-- Client input may describe interaction preferences but cannot define authority.
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
values(s.id,a.id,(select auth.uid()),p_mode,coalesce(pol.rules,'{}'::jsonb),jsonb_build_object('mode',p_mode,'requested',coalesce(p_interaction_policy,'{}'::jsonb)),'pending','requested',p_required_capability,true,pol.policy_version,true,'pending') returning * into v;
return v;
end; $$;