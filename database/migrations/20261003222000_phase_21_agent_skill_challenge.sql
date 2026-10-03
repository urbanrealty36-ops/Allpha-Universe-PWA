-- Phase 21: Human-owned Agent Skill Challenge and verified AI Credit rewards.
alter table public.agent_skills add column if not exists category text not null default 'general';
alter table public.agent_skills add column if not exists skill_level integer not null default 1;
alter table public.agent_skills add column if not exists quality_score numeric(5,2) not null default 0;
alter table public.agent_skills add column if not exists usage_count integer not null default 0;
alter table public.agent_skills add column if not exists successful_usage_count integer not null default 0;
alter table public.agent_skills add column if not exists reward_credits_earned integer not null default 0;
alter table public.agent_skills add column if not exists challenge_status text not null default 'draft';
alter table public.agent_skills add column if not exists challenge_metadata jsonb not null default '{}'::jsonb;
alter table public.agent_skills add constraint agent_skills_skill_level_check check(skill_level between 1 and 100);
alter table public.agent_skills add constraint agent_skills_quality_score_check check(quality_score between 0 and 100);
alter table public.agent_skills add constraint agent_skills_usage_count_check check(usage_count>=0);
alter table public.agent_skills add constraint agent_skills_successful_usage_count_check check(successful_usage_count>=0);
alter table public.agent_skills add constraint agent_skills_reward_credits_check check(reward_credits_earned>=0);

create table if not exists public.agent_skill_challenge_events(
 id uuid primary key default gen_random_uuid(),skill_id uuid not null references public.agent_skills(id) on delete cascade,
 agent_id uuid not null references public.agents(id) on delete cascade,owner_user_id uuid not null references public.users(id) on delete cascade,
 requester_user_id uuid references public.users(id) on delete set null,service_request_id uuid references public.agent_service_requests(id) on delete set null,
 event_type text not null check(event_type in('usage','quality_evaluation','reward')),
 quality_score numeric(5,2) check(quality_score between 0 and 100),dimensions jsonb not null default '{}',evidence jsonb not null default '{}',
 reward_credits integer not null default 0 check(reward_credits>=0),created_at timestamptz not null default timezone('utc',now()),
 unique(service_request_id,event_type));
create index if not exists agent_skill_challenge_skill_idx on public.agent_skill_challenge_events(skill_id,created_at desc);
create index if not exists agent_skill_challenge_owner_idx on public.agent_skill_challenge_events(owner_user_id,created_at desc);
alter table public.agent_skill_challenge_events enable row level security;
create policy agent_skill_challenge_owner_read on public.agent_skill_challenge_events for select to authenticated using(owner_user_id=(select auth.uid()) or requester_user_id=(select auth.uid()));
create table if not exists public.agent_skill_challenge_leaderboard(
 agent_id uuid primary key references public.agents(id) on delete cascade,owner_user_id uuid not null references public.users(id) on delete cascade,
 total_quality_score numeric(12,2) not null default 0,quality_score numeric(5,2) not null default 0 check(quality_score between 0 and 100),
 skill_count integer not null default 0,verified_usage_count integer not null default 0,successful_usage_count integer not null default 0,
 reward_credits_earned integer not null default 0,challenge_level integer not null default 1 check(challenge_level between 1 and 100),
 updated_at timestamptz not null default timezone('utc',now()));
alter table public.agent_skill_challenge_leaderboard enable row level security;
create policy agent_skill_leaderboard_public_read on public.agent_skill_challenge_leaderboard for select to authenticated using(true);

create or replace function public.upsert_agent_skill(p_agent_id uuid,p_skill_id uuid,p_name text,p_description text,p_version text,p_category text,p_configuration jsonb,p_enabled boolean)
returns public.agent_skills language plpgsql security definer set search_path='' as $$
declare s public.agent_skills;
begin
 if not exists(select 1 from public.agents where id=p_agent_id and owner_user_id=auth.uid()) then raise exception 'AGENT_SKILL_OWNER_DENIED'; end if;
 if p_skill_id is null then
  insert into public.agent_skills(agent_id,name,description,version,enabled,configuration,category,challenge_status) values(p_agent_id,p_name,p_description,coalesce(p_version,'1.0.0'),coalesce(p_enabled,true),coalesce(p_configuration,'{}'),coalesce(p_category,'general'),'draft') returning * into s;
 else
  update public.agent_skills set name=p_name,description=p_description,version=coalesce(p_version,version),enabled=coalesce(p_enabled,enabled),configuration=coalesce(p_configuration,configuration),category=coalesce(p_category,category),updated_at=timezone('utc',now()) where id=p_skill_id and agent_id=p_agent_id returning * into s;
  if not found then raise exception 'AGENT_SKILL_NOT_FOUND'; end if;
 end if; return s;
end $$;
create or replace function public.publish_agent_skill(p_skill_id uuid) returns public.agent_skills language plpgsql security definer set search_path='' as $$
declare s public.agent_skills;
begin update public.agent_skills s0 set enabled=true,challenge_status='published',updated_at=timezone('utc',now()) from public.agents a where s0.id=p_skill_id and s0.agent_id=a.id and a.owner_user_id=auth.uid() returning s0.* into s;
 if not found then raise exception 'AGENT_SKILL_OWNER_DENIED'; end if; return s; end $$;
revoke all on function public.upsert_agent_skill(uuid,uuid,text,text,text,text,jsonb,boolean) from public,anon; grant execute on function public.upsert_agent_skill(uuid,uuid,text,text,text,text,jsonb,boolean) to authenticated;
revoke all on function public.publish_agent_skill(uuid) from public,anon; grant execute on function public.publish_agent_skill(uuid) to authenticated;
