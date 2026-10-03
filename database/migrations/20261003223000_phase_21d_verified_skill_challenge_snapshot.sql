-- Phase 21D: persist the exact Agent Skill used by each explicit AI Service request.
alter table public.agent_service_requests
  add column if not exists skill_id uuid references public.agent_skills(id) on delete set null;

create index if not exists idx_agent_service_requests_skill_id
  on public.agent_service_requests(skill_id);

create or replace function public.reserve_agent_service_request(
  p_agent_id uuid,p_skill_name text,p_prompt text,p_credit_cost integer,
  p_idempotency_key text default null,p_conversation_id uuid default null,
  p_source_content_id uuid default null,p_source_context jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_skill public.agent_skills%rowtype; v_agent public.agents%rowtype; v_balance integer; v_request uuid; v_conv_metadata jsonb;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_user::text));
  if p_credit_cost is null or p_credit_cost<1 or p_credit_cost>10000 then raise exception 'INVALID_CREDIT_COST'; end if;
  if length(trim(coalesce(p_prompt,'')))=0 then raise exception 'PROMPT_REQUIRED'; end if;
  select * into v_agent from public.agents where id=p_agent_id and status='active' and visibility='public';
  if not found then raise exception 'AGENT_NOT_AVAILABLE'; end if;
  if v_agent.owner_user_id=v_user then raise exception 'SELF_AGENT_SERVICE_NOT_ALLOWED'; end if;
  if exists(select 1 from public.social_blocks where blocker_type='user' and blocker_id=v_user and blocked_type='user' and blocked_id=v_agent.owner_user_id) or exists(select 1 from public.social_blocks where blocker_type='user' and blocker_id=v_agent.owner_user_id and blocked_type='user' and blocked_id=v_user) then raise exception 'COMMUNICATION_BLOCKED'; end if;
  select * into v_skill from public.agent_skills where agent_id=p_agent_id and enabled=true and lower(name)=lower(trim(p_skill_name)) limit 1;
  if not found then raise exception 'AGENT_SKILL_NOT_AVAILABLE'; end if;
  if not exists(select 1 from public.agent_capabilities where agent_id=p_agent_id and capability='ai.generate' and enabled=true) then raise exception 'AGENT_GENERATION_CAPABILITY_NOT_GRANTED'; end if;
  if p_conversation_id is not null then
    select c.metadata into v_conv_metadata from public.conversations c where c.id=p_conversation_id and c.status='active';
    if not found then raise exception 'CONVERSATION_NOT_FOUND'; end if;
    if coalesce((v_conv_metadata->>'human_takeover_active')::boolean,false) then raise exception 'HUMAN_TAKEOVER_ACTIVE'; end if;
    if not exists(select 1 from public.conversation_participants cp where cp.conversation_id=p_conversation_id and cp.subject_type='user' and cp.subject_id=v_user and cp.status='active') then raise exception 'CONVERSATION_REQUESTER_NOT_PARTICIPANT'; end if;
    if not exists(select 1 from public.conversation_participants cp where cp.conversation_id=p_conversation_id and cp.subject_type='agent' and cp.subject_id=p_agent_id and cp.status='active') then raise exception 'CONVERSATION_AGENT_NOT_PARTICIPANT'; end if;
  end if;
  if p_idempotency_key is not null then
    select id into v_request from public.agent_service_requests where requester_user_id=v_user and idempotency_key=p_idempotency_key limit 1;
    if v_request is not null then return jsonb_build_object('id',v_request,'reused',true,'skill_id',v_skill.id); end if;
  end if;
  select public.get_ai_credit_balance() into v_balance;
  if v_balance<p_credit_cost then raise exception 'INSUFFICIENT_AI_CREDITS'; end if;
  insert into public.agent_service_requests(requester_user_id,agent_id,agent_owner_user_id,skill_id,skill_name,prompt,credit_cost,idempotency_key,conversation_id,source_content_id,source_context,status)
  values(v_user,p_agent_id,v_agent.owner_user_id,v_skill.id,trim(p_skill_name),trim(p_prompt),p_credit_cost,p_idempotency_key,p_conversation_id,p_source_content_id,coalesce(p_source_context,'{}'),'reserved') returning id into v_request;
  insert into public.ai_credit_ledger(user_id,entry_type,amount,status,source_type,source_id,counterparty_user_id,agent_id,service_request_id,metadata,posted_at)
  values(v_user,'debit',p_credit_cost,'posted','agent_service',v_request,v_agent.owner_user_id,p_agent_id,v_request,jsonb_build_object('skill_id',v_skill.id,'skill_name',trim(p_skill_name),'phase','13','interaction_boundary','ai_service'),timezone('utc',now()));
  return jsonb_build_object('id',v_request,'reused',false,'agent_id',p_agent_id,'agent_owner_user_id',v_agent.owner_user_id,'skill_id',v_skill.id,'credit_cost',p_credit_cost,'balance_after',v_balance-p_credit_cost);
end; $function$;

revoke all on function public.reserve_agent_service_request(uuid,text,text,integer,text,uuid,uuid,jsonb) from public,anon;
grant execute on function public.reserve_agent_service_request(uuid,text,text,integer,text,uuid,uuid,jsonb) to authenticated;

create or replace function public.list_verifiable_agent_service_requests(p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_limit<1 or p_limit>100 then raise exception 'INVALID_LIMIT'; end if;
  return coalesce((select jsonb_agg(to_jsonb(x) order by x.completed_at desc) from (
    select r.id service_request_id,r.agent_id,r.agent_owner_user_id,r.skill_id,r.skill_name,r.service_type,r.credit_cost,r.conversation_id,r.source_content_id,r.result_message_id,r.generated_content_id,r.completed_at,a.name agent_name,a.handle agent_handle,s.category skill_category,s.version skill_version,s.skill_level,s.quality_score,(r.result_message_id is not null or r.generated_content_id is not null) has_result
    from public.agent_service_requests r join public.agents a on a.id=r.agent_id left join public.agent_skills s on s.id=r.skill_id
    where r.requester_user_id=v_user and r.agent_owner_user_id<>v_user and r.status='completed'
      and not exists(select 1 from public.agent_skill_challenge_events e where e.service_request_id=r.id and e.event_type='reward')
    order by r.completed_at desc limit p_limit
  ) x),'[]'::jsonb);
end; $function$;

revoke all on function public.list_verifiable_agent_service_requests(integer) from public,anon;
grant execute on function public.list_verifiable_agent_service_requests(integer) to authenticated;