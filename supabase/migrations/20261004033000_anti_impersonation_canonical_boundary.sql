create table if not exists public.anti_impersonation_evidence (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('user','agent')),
  subject_id uuid not null,
  claim_type text not null check (claim_type in ('identity_binding','ownership_binding','passport_binding','presence_binding')),
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);
create index if not exists anti_impersonation_subject_idx on public.anti_impersonation_evidence(subject_type,subject_id,status);
alter table public.anti_impersonation_evidence enable row level security;
drop policy if exists anti_impersonation_select_own on public.anti_impersonation_evidence;
create policy anti_impersonation_select_own on public.anti_impersonation_evidence for select to authenticated
using ((subject_type='user' and subject_id=(select auth.uid())) or (subject_type='agent' and exists(select 1 from public.agents a where a.id=subject_id and a.owner_user_id=(select auth.uid()) and a.status<>'archived')) or private.has_platform_permission('admin.read'));

create or replace function private.get_anti_impersonation_evidence__allpha_sd(p_subject_type text,p_subject_id uuid)
returns setof public.anti_impersonation_evidence language sql security definer set search_path=''
as $$ select e.* from public.anti_impersonation_evidence e where e.subject_type=p_subject_type and e.subject_id=p_subject_id order by e.created_at desc $$;

create or replace function public.get_anti_impersonation_evidence(p_subject_type text,p_subject_id uuid)
returns setof public.anti_impersonation_evidence language sql security invoker set search_path=''
as $$ select * from private.get_anti_impersonation_evidence__allpha_sd(p_subject_type,p_subject_id) $$;

revoke all on function private.get_anti_impersonation_evidence__allpha_sd(text,uuid) from public,anon,authenticated;
revoke execute on function public.get_anti_impersonation_evidence(text,uuid) from anon;
grant execute on function public.get_anti_impersonation_evidence(text,uuid) to authenticated,service_role;
grant select on public.anti_impersonation_evidence to authenticated;

create or replace function private.get_public_agent_account__allpha_sd(p_agent_id uuid)
returns jsonb language sql security definer set search_path=''
as $$
with a as (
 select * from public.agents where id=p_agent_id and status='active' and visibility='public'
 and exists(select 1 from public.agent_identities ai where ai.agent_id=agents.id and ai.verification_status='verified')
 and exists(select 1 from public.agent_passports ap where ap.agent_id=agents.id and ap.verification_status='verified')
), skills as (
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'description',s.description,'category',s.category,'skill_level',s.skill_level,'quality_score',s.quality_score,'usage_count',s.usage_count,'successful_usage_count',s.successful_usage_count,'challenge_status',s.challenge_status) order by s.quality_score desc,s.skill_level desc,s.name asc),'[]'::jsonb) value
 from public.agent_skills s where s.agent_id=p_agent_id and s.enabled=true and s.challenge_status='published'
), lb as (
 select quality_score,verified_usage_count,successful_usage_count,reward_credits_earned,challenge_level from public.agent_skill_challenge_leaderboard where agent_id=p_agent_id limit 1
)
select case when exists(select 1 from a) then jsonb_build_object('agent',jsonb_build_object('id',a.id,'name',a.name,'handle',a.handle,'description',a.description,'avatar_path',a.avatar_path,'status',a.status,'runtime_state',a.runtime_state,'is_owned_by_viewer',a.owner_user_id=(select auth.uid())),'skills',(select value from skills),'reputation',jsonb_build_object('quality_score',coalesce(lb.quality_score,0),'verified_usage_count',coalesce(lb.verified_usage_count,0),'successful_usage_count',coalesce(lb.successful_usage_count,0),'reward_credits_earned',coalesce(lb.reward_credits_earned,0),'challenge_level',coalesce(lb.challenge_level,1)),'actions',jsonb_build_object('message',true,'ask',true,'profile_path','/agents/'||a.id::text)) else null end from a left join lb on true;
$$;

create or replace function private.discover_public_agent_accounts__allpha_sd(p_query text default null,p_limit integer default 24,p_offset integer default 0)
returns table(agent_id uuid,name text,handle text,description text,avatar_path text,status text,runtime_state text,is_owned_by_viewer boolean,skills jsonb,quality_score numeric,verified_usage_count integer,successful_usage_count integer,reward_credits_earned integer,challenge_level integer)
language sql security definer set search_path=''
as $$
with candidates as (
 select a.* from public.agents a where a.status='active' and a.visibility='public'
 and exists(select 1 from public.agent_identities ai where ai.agent_id=a.id and ai.verification_status='verified')
 and exists(select 1 from public.agent_passports ap where ap.agent_id=a.id and ap.verification_status='verified')
 and not exists(select 1 from public.social_blocks b where b.blocker_type='user' and b.blocker_id=(select auth.uid()) and b.blocked_type='user' and b.blocked_id=a.owner_user_id)
 and not exists(select 1 from public.social_blocks b where b.blocker_type='user' and b.blocker_id=a.owner_user_id and b.blocked_type='user' and b.blocked_id=(select auth.uid()))
 and (nullif(trim(coalesce(p_query,'')),'') is null or position(lower(trim(p_query)) in lower(coalesce(a.name,'')))>0 or position(lower(trim(p_query)) in lower(coalesce(a.handle,'')))>0 or position(lower(trim(p_query)) in lower(coalesce(a.description,'')))>0 or exists(select 1 from public.agent_skills s where s.agent_id=a.id and s.enabled=true and s.challenge_status='published' and (position(lower(trim(p_query)) in lower(coalesce(s.name,'')))>0 or position(lower(trim(p_query)) in lower(coalesce(s.category,'')))>0)))
)
select c.id,c.name,c.handle,c.description,c.avatar_path,c.status::text,c.runtime_state::text,c.owner_user_id=(select auth.uid()),coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'description',s.description,'category',s.category,'skill_level',s.skill_level,'quality_score',s.quality_score,'usage_count',s.usage_count,'successful_usage_count',s.successful_usage_count,'challenge_status',s.challenge_status) order by s.quality_score desc,s.skill_level desc,s.name asc) from public.agent_skills s where s.agent_id=c.id and s.enabled=true and s.challenge_status='published'),'[]'::jsonb),coalesce(lb.quality_score,0),coalesce(lb.verified_usage_count,0),coalesce(lb.successful_usage_count,0),coalesce(lb.reward_credits_earned,0),coalesce(lb.challenge_level,1)
from candidates c left join public.agent_skill_challenge_leaderboard lb on lb.agent_id=c.id
order by case when nullif(trim(coalesce(p_query,'')) is not null and (lower(c.name)=lower(trim(p_query)) or lower(coalesce(c.handle,''))=lower(trim(p_query))) then 0 else 1 end,coalesce(lb.quality_score,0) desc,c.name asc
offset greatest(coalesce(p_offset,0),0) limit greatest(1,least(coalesce(p_limit,24),100));
$$;