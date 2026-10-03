-- Phase 21 security hardening: only the requester of a completed cross-owner service may submit its quality outcome.
create or replace function public.record_agent_skill_quality_outcome(p_service_request_id uuid,p_quality_score numeric,p_dimensions jsonb,p_evidence jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.agent_service_requests;s public.agent_skills;reward integer;lvl integer;avg_score numeric;
begin
 select * into r from public.agent_service_requests where id=p_service_request_id and status='completed';
 if not found then raise exception 'SKILL_REWARD_SERVICE_NOT_COMPLETED'; end if;
 if r.requester_user_id<>(select auth.uid()) then raise exception 'SKILL_REWARD_REQUESTER_ONLY'; end if;
 if r.requester_user_id=r.agent_owner_user_id then raise exception 'SKILL_REWARD_SELF_USAGE_FORBIDDEN'; end if;
 if p_quality_score<0 or p_quality_score>100 then raise exception 'SKILL_QUALITY_SCORE_INVALID'; end if;
 select * into s from public.agent_skills where agent_id=r.agent_id and lower(name)=lower(r.skill_name) and enabled=true order by updated_at desc limit 1;
 if not found then raise exception 'AGENT_SKILL_NOT_FOUND'; end if;
 if exists(select 1 from public.agent_skill_challenge_events where service_request_id=r.id and event_type='reward') then return jsonb_build_object('status','already_recorded','reward_credits',0); end if;
 reward:=greatest(0,least(100,round((r.credit_cost::numeric*p_quality_score/100.0)))::integer);
 lvl:=greatest(1,least(100,floor((p_quality_score+least(50,s.successful_usage_count+1)::numeric)/2)::integer));
 update public.agent_skills set usage_count=usage_count+1,successful_usage_count=successful_usage_count+case when p_quality_score>=70 then 1 else 0 end,quality_score=round(((quality_score*least(usage_count,99)+p_quality_score)/(least(usage_count,99)+1))::numeric,2),skill_level=lvl,reward_credits_earned=reward_credits_earned+reward,challenge_status='published',challenge_metadata=challenge_metadata||jsonb_build_object('last_quality_score',p_quality_score,'last_evaluated_at',timezone('utc',now())),updated_at=timezone('utc',now()) where id=s.id returning * into s;
 insert into public.agent_skill_challenge_events(skill_id,agent_id,owner_user_id,requester_user_id,service_request_id,event_type,quality_score,dimensions,evidence,reward_credits) values(s.id,r.agent_id,r.agent_owner_user_id,r.requester_user_id,r.id,'reward',p_quality_score,coalesce(p_dimensions,'{}'),coalesce(p_evidence,'{}'),reward);
 if reward>0 then insert into public.ai_credit_ledger(user_id,entry_type,amount,status,source_type,source_id,counterparty_user_id,agent_id,service_request_id,metadata,posted_at) values(r.agent_owner_user_id,'reward',reward,'posted','agent_skill_challenge',s.id,r.requester_user_id,r.agent_id,r.id,jsonb_build_object('quality_score',p_quality_score,'dimensions',coalesce(p_dimensions,'{}'),'evidence',coalesce(p_evidence,'{}'),'reward_model','verified_cross_owner_usage_v1'),timezone('utc',now())); end if;
 select coalesce(avg(quality_score),0) into avg_score from public.agent_skill_challenge_events where agent_id=r.agent_id and event_type='reward';
 insert into public.agent_skill_challenge_leaderboard(agent_id,owner_user_id,total_quality_score,quality_score,skill_count,verified_usage_count,successful_usage_count,reward_credits_earned,challenge_level,updated_at)
 values(r.agent_id,r.agent_owner_user_id,coalesce(avg_score,0)*greatest(1,(select count(*) from public.agent_skills where agent_id=r.agent_id)),avg_score,(select count(*) from public.agent_skills where agent_id=r.agent_id),(select count(*) from public.agent_skill_challenge_events where agent_id=r.agent_id and event_type='reward'),(select count(*) from public.agent_skill_challenge_events where agent_id=r.agent_id and event_type='reward' and quality_score>=70),(select coalesce(sum(reward_credits),0) from public.agent_skill_challenge_events where agent_id=r.agent_id and event_type='reward'),greatest(1,least(100,floor(avg_score)::integer)),timezone('utc',now()))
 on conflict(agent_id) do update set owner_user_id=excluded.owner_user_id,total_quality_score=excluded.total_quality_score,quality_score=excluded.quality_score,skill_count=excluded.skill_count,verified_usage_count=excluded.verified_usage_count,successful_usage_count=excluded.successful_usage_count,reward_credits_earned=excluded.reward_credits_earned,challenge_level=excluded.challenge_level,updated_at=excluded.updated_at;
 return jsonb_build_object('status','rewarded','skill_id',s.id,'quality_score',p_quality_score,'reward_credits',reward,'skill_level',s.skill_level);
end $$;
revoke all on function public.record_agent_skill_quality_outcome(uuid,numeric,jsonb,jsonb) from public,anon;
grant execute on function public.record_agent_skill_quality_outcome(uuid,numeric,jsonb,jsonb) to authenticated;
