-- Phase 21/13 completion: Conversation vs AI Service boundary + Human Owner takeover.
-- Applied to AllphaDb-Universe as phase_21_conversation_service_boundary.
-- Conversation messages never call Model Router or debit AI Credits.
-- Agent Service is the explicit paid execution boundary.
-- Human takeover is server-authoritative and pauses new AI service execution on that conversation.

create or replace function public.create_direct_conversation(
  p_source_type text, p_source_id uuid, p_target_type text, p_target_id uuid,
  p_message text default null, p_client_message_id text default null
) returns jsonb language plpgsql security definer set search_path to '' as $function$
declare
  v_uid uuid:=auth.uid(); v_conv uuid; v_status text:='active'; v_request uuid; v_msg uuid;
  v_policy text:='open'; v_allow boolean:=true; v_target_owner uuid;
begin
  if v_uid is null or not private.communication_subject_owned(p_source_type,p_source_id,v_uid) then raise exception 'source_not_owned'; end if;
  if p_source_type=p_target_type and p_source_id=p_target_id then raise exception 'self_conversation_not_allowed'; end if;
  if private.communication_blocked(p_source_type,p_source_id,p_target_type,p_target_id) then raise exception 'communication_blocked'; end if;
  select coalesce(cp.dm_policy,'open'),
         case when p_source_type='user' then coalesce(cp.allow_human_messages,true) else coalesce(cp.allow_agent_messages,true) end
    into v_policy,v_allow from public.communication_preferences cp
   where cp.subject_type=p_target_type and cp.subject_id=p_target_id;
  if not v_allow then raise exception 'recipient_message_type_not_allowed'; end if;
  if v_policy in ('approval','invite_only') then v_status:='pending'; end if;
  if v_policy='relationships' and not exists(
    select 1 from public.social_relationships r where r.status='active' and
      ((r.source_type=p_source_type and r.source_id=p_source_id and r.target_type=p_target_type and r.target_id=p_target_id)
       or (r.source_type=p_target_type and r.source_id=p_target_id and r.target_type=p_source_type and r.target_id=p_source_id))
  ) then v_status:='pending'; end if;
  if p_target_type='agent' then
    select a.owner_user_id into v_target_owner from public.agents a where a.id=p_target_id and a.status<>'archived';
    if v_target_owner is null then raise exception 'target_agent_not_found'; end if;
  end if;
  insert into public.conversations(conversation_type,status,created_by_type,created_by_id,metadata)
  values('direct',v_status,p_source_type,p_source_id,
    case when p_target_type='agent' then
      jsonb_build_object('interaction_mode','conversation','human_takeover_active',false,'agent_id',p_target_id,'agent_owner_user_id',v_target_owner)
    else '{}'::jsonb end)
  returning id into v_conv;
  insert into public.conversation_participants(conversation_id,subject_type,subject_id,role,status,joined_at)
  values(v_conv,p_source_type,p_source_id,'owner','active',timezone('utc',now()));
  insert into public.conversation_participants(conversation_id,subject_type,subject_id,role,status,joined_at)
  values(v_conv,p_target_type,p_target_id,'member',case when v_status='active' then 'active' else 'pending' end,case when v_status='active' then timezone('utc',now()) else null end);
  if p_target_type='agent' and v_target_owner is distinct from p_source_id then
    insert into public.conversation_participants(conversation_id,subject_type,subject_id,role,status,joined_at)
    values(v_conv,'user',v_target_owner,'agent_owner','active',timezone('utc',now()))
    on conflict (conversation_id,subject_type,subject_id) do nothing;
  end if;
  if v_status='pending' then
    insert into public.conversation_requests(conversation_id,requester_type,requester_id,recipient_type,recipient_id)
    values(v_conv,p_source_type,p_source_id,p_target_type,p_target_id) returning id into v_request;
  else v_request:=null; end if;
  if p_message is not null and v_status='active' then
    insert into public.messages(conversation_id,sender_type,sender_id,body,client_message_id)
    values(v_conv,p_source_type,p_source_id,p_message,p_client_message_id) returning id into v_msg;
    insert into public.message_delivery_receipts(message_id,recipient_type,recipient_id) values(v_msg,p_target_type,p_target_id);
  end if;
  insert into public.communication_activity_events(conversation_id,actor_type,actor_id,event_type,target_type,target_id)
  values(v_conv,p_source_type,p_source_id,case when v_status='active' then 'conversation_created' else 'request_sent' end,p_target_type,p_target_id);
  return jsonb_build_object('conversation_id',v_conv,'status',v_status,'request_id',v_request,'message_id',v_msg);
end $function$;

create or replace function public.get_agent_conversation_control(p_conversation_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare v_uid uuid:=auth.uid(); v_agent uuid; v_owner uuid; v_metadata jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select c.metadata into v_metadata from public.conversations c where c.id=p_conversation_id and c.status='active';
  if not found then raise exception 'CONVERSATION_NOT_FOUND'; end if;
  select cp.subject_id into v_agent from public.conversation_participants cp
   where cp.conversation_id=p_conversation_id and cp.subject_type='agent' and cp.status='active' limit 1;
  if v_agent is null then return jsonb_build_object('is_agent_conversation',false,'is_agent_owner',false,'human_takeover_active',false); end if;
  select a.owner_user_id into v_owner from public.agents a where a.id=v_agent;
  if v_owner is null then raise exception 'AGENT_NOT_FOUND'; end if;
  if not exists(select 1 from public.conversation_participants cp where cp.conversation_id=p_conversation_id and cp.subject_type='user' and cp.subject_id=v_uid and cp.status='active') then
    raise exception 'CONVERSATION_ACCESS_DENIED';
  end if;
  return jsonb_build_object('is_agent_conversation',true,'agent_id',v_agent,'agent_owner_user_id',v_owner,
    'is_agent_owner',v_owner=v_uid,'human_takeover_active',coalesce((v_metadata->>'human_takeover_active')::boolean,false));
end $function$;

create or replace function public.set_agent_conversation_takeover(p_conversation_id uuid,p_active boolean)
returns jsonb language plpgsql security definer set search_path to '' as $function$
declare v_uid uuid:=auth.uid(); v_agent uuid; v_owner uuid; v_event text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.conversations c where c.id=p_conversation_id and c.status='active') then raise exception 'CONVERSATION_NOT_FOUND'; end if;
  select cp.subject_id into v_agent from public.conversation_participants cp
   where cp.conversation_id=p_conversation_id and cp.subject_type='agent' and cp.status='active' limit 1;
  if v_agent is null then raise exception 'AGENT_CONVERSATION_REQUIRED'; end if;
  select a.owner_user_id into v_owner from public.agents a where a.id=v_agent;
  if v_owner is null or v_owner<>v_uid then raise exception 'AGENT_OWNER_REQUIRED'; end if;
  insert into public.conversation_participants(conversation_id,subject_type,subject_id,role,status,joined_at)
  values(p_conversation_id,'user',v_uid,'agent_owner','active',timezone('utc',now()))
  on conflict (conversation_id,subject_type,subject_id) do update set role='agent_owner',status='active',updated_at=timezone('utc',now());
  v_event:=case when p_active then 'human_takeover_started' else 'human_takeover_stopped' end;
  update public.conversations set metadata=coalesce(metadata,'{}'::jsonb) ||
    jsonb_build_object('interaction_mode',case when p_active then 'human_takeover' else 'conversation' end,
      'human_takeover_active',p_active,'human_takeover_by_user_id',case when p_active then v_uid else null end,
      'human_takeover_at',case when p_active then timezone('utc',now()) else null end),
    updated_at=timezone('utc',now()) where id=p_conversation_id;
  insert into public.communication_activity_events(conversation_id,actor_type,actor_id,event_type,target_type,target_id,metadata)
  values(p_conversation_id,'user',v_uid,v_event,'agent',v_agent,jsonb_build_object('takeover_active',p_active));
  return jsonb_build_object('conversation_id',p_conversation_id,'agent_id',v_agent,'human_takeover_active',p_active);
end $function$;

create or replace function public.send_message(
  p_conversation_id uuid,p_sender_type text,p_sender_id uuid,p_body text,p_reply_to uuid default null,
  p_client_message_id text default null,p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path to '' as $function$
declare v_uid uuid:=auth.uid(); v_id uuid; v_rec record; v_owner uuid; v_agent_owner uuid; v_takeover boolean:=false;
begin
  if v_uid is null or not private.communication_subject_owned(p_sender_type,p_sender_id,v_uid) then raise exception 'sender_not_owned'; end if;
  if not exists(select 1 from public.conversation_participants p where p.conversation_id=p_conversation_id and p.subject_type=p_sender_type and p.subject_id=p_sender_id and p.status='active') then raise exception 'sender_not_participant'; end if;
  if exists(select 1 from public.conversations c where c.id=p_conversation_id and c.status<>'active') then raise exception 'conversation_not_active'; end if;
  select coalesce((c.metadata->>'human_takeover_active')::boolean,false) into v_takeover from public.conversations c where c.id=p_conversation_id;
  if p_sender_type='user' then
    select a.owner_user_id into v_agent_owner from public.conversation_participants cp join public.agents a on a.id=cp.subject_id
     where cp.conversation_id=p_conversation_id and cp.subject_type='agent' and cp.status='active' limit 1;
    if v_agent_owner=v_uid and not v_takeover then raise exception 'HUMAN_TAKEOVER_REQUIRED'; end if;
  end if;
  if p_reply_to is not null and not exists(select 1 from public.messages m where m.id=p_reply_to and m.conversation_id=p_conversation_id and m.status<>'deleted') then raise exception 'reply_target_not_found'; end if;
  insert into public.messages(conversation_id,sender_type,sender_id,body,reply_to_message_id,client_message_id,metadata)
  values(p_conversation_id,p_sender_type,p_sender_id,p_body,p_reply_to,p_client_message_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  for v_rec in select p.subject_type,p.subject_id from public.conversation_participants p where p.conversation_id=p_conversation_id and p.status='active' and not (p.subject_type=p_sender_type and p.subject_id=p_sender_id) loop
    if not private.communication_blocked(p_sender_type,p_sender_id,v_rec.subject_type,v_rec.subject_id) then
      insert into public.message_delivery_receipts(message_id,recipient_type,recipient_id) values(v_id,v_rec.subject_type,v_rec.subject_id)
      on conflict(message_id,recipient_type,recipient_id) do nothing;
      v_owner:=private.communication_owner_user_id(v_rec.subject_type,v_rec.subject_id);
      if v_owner is not null then
        insert into public.social_notifications(recipient_user_id,actor_type,actor_id,notification_type,target_type,target_id,payload)
        values(v_owner,p_sender_type,p_sender_id,'message','conversation',p_conversation_id,jsonb_build_object('message_id',v_id));
      end if;
    end if;
  end loop;
  update public.conversations set updated_at=timezone('utc',now()) where id=p_conversation_id;
  insert into public.communication_activity_events(conversation_id,actor_type,actor_id,event_type,target_type,target_id)
  values(p_conversation_id,p_sender_type,p_sender_id,'message_sent','message',v_id);
  return jsonb_build_object('id',v_id,'status','sent');
end $function$;

create or replace function public.reserve_agent_service_request(
  p_agent_id uuid,p_skill_name text,p_prompt text,p_credit_cost integer,p_idempotency_key text default null,
  p_conversation_id uuid default null,p_source_content_id uuid default null,p_source_context jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path to '' as $function$
declare v_user uuid:=auth.uid(); v_skill public.agent_skills%rowtype; v_agent public.agents%rowtype; v_balance integer; v_request uuid; v_conv_metadata jsonb;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_user::text));
  if p_credit_cost is null or p_credit_cost<1 or p_credit_cost>10000 then raise exception 'INVALID_CREDIT_COST'; end if;
  if length(trim(coalesce(p_prompt,'')))=0 then raise exception 'PROMPT_REQUIRED'; end if;
  select * into v_agent from public.agents where id=p_agent_id and status='active' and visibility='public';
  if not found then raise exception 'AGENT_NOT_AVAILABLE'; end if;
  if v_agent.owner_user_id=v_user then raise exception 'SELF_AGENT_SERVICE_NOT_ALLOWED'; end if;
  if exists(select 1 from public.social_blocks where blocker_type='user' and blocker_id=v_user and blocked_type='user' and blocked_id=v_agent.owner_user_id)
     or exists(select 1 from public.social_blocks where blocker_type='user' and blocker_id=v_agent.owner_user_id and blocked_type='user' and blocked_id=v_user) then raise exception 'COMMUNICATION_BLOCKED'; end if;
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
    if v_request is not null then return jsonb_build_object('id',v_request,'reused',true); end if;
  end if;
  select public.get_ai_credit_balance() into v_balance;
  if v_balance<p_credit_cost then raise exception 'INSUFFICIENT_AI_CREDITS'; end if;
  insert into public.agent_service_requests(requester_user_id,agent_id,agent_owner_user_id,skill_name,prompt,credit_cost,idempotency_key,conversation_id,source_content_id,source_context,status)
  values(v_user,p_agent_id,v_agent.owner_user_id,trim(p_skill_name),trim(p_prompt),p_credit_cost,p_idempotency_key,p_conversation_id,p_source_content_id,coalesce(p_source_context,'{}'),'reserved') returning id into v_request;
  insert into public.ai_credit_ledger(user_id,entry_type,amount,status,source_type,source_id,counterparty_user_id,agent_id,service_request_id,metadata,posted_at)
  values(v_user,'debit',p_credit_cost,'posted','agent_service',v_request,v_agent.owner_user_id,p_agent_id,v_request,jsonb_build_object('skill_name',trim(p_skill_name),'phase','13','interaction_boundary','ai_service'),timezone('utc',now()));
  return jsonb_build_object('id',v_request,'reused',false,'agent_id',p_agent_id,'agent_owner_user_id',v_agent.owner_user_id,'credit_cost',p_credit_cost,'balance_after',v_balance-p_credit_cost);
end $function$;

create or replace function public.append_agent_service_message(
  p_service_request_id uuid,p_conversation_id uuid,p_body text,p_metadata jsonb default '{}'::jsonb
) returns public.messages language plpgsql security definer set search_path to '' as $function$
declare v_user uuid:=auth.uid(); r public.agent_service_requests%rowtype; m public.messages; v_takeover boolean:=false;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into r from public.agent_service_requests where id=p_service_request_id for update;
  if not found or r.requester_user_id<>v_user then raise exception 'SERVICE_REQUEST_FORBIDDEN'; end if;
  if r.status not in ('reserved','processing') then raise exception 'SERVICE_REQUEST_NOT_MESSAGEABLE'; end if;
  select coalesce((c.metadata->>'human_takeover_active')::boolean,false) into v_takeover from public.conversations c where c.id=p_conversation_id;
  if v_takeover then raise exception 'HUMAN_TAKEOVER_ACTIVE'; end if;
  if r.conversation_id is not null and r.conversation_id<>p_conversation_id then raise exception 'SERVICE_CONVERSATION_MISMATCH'; end if;
  if not exists(select 1 from public.conversation_participants cp where cp.conversation_id=p_conversation_id and cp.subject_type='user' and cp.subject_id=v_user and cp.status='active') then raise exception 'CONVERSATION_ACCESS_DENIED'; end if;
  if not exists(select 1 from public.conversation_participants cp where cp.conversation_id=p_conversation_id and cp.subject_type='agent' and cp.subject_id=r.agent_id and cp.status='active') then raise exception 'AGENT_NOT_IN_CONVERSATION'; end if;
  insert into public.messages(conversation_id,sender_type,sender_id,body,message_type,status,metadata)
  values(p_conversation_id,'agent',r.agent_id,p_body,'text','sent',coalesce(p_metadata,'{}'::jsonb)) returning * into m;
  return m;
end $function$;

revoke all on function public.get_agent_conversation_control(uuid) from public, anon;
grant execute on function public.get_agent_conversation_control(uuid) to authenticated;
revoke all on function public.set_agent_conversation_takeover(uuid,boolean) from public, anon;
grant execute on function public.set_agent_conversation_takeover(uuid,boolean) to authenticated;
