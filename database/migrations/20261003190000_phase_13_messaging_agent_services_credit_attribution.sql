-- Phase 13: Messaging & Social Communication — cross-owner Agent services and AI Credit attribution
create table if not exists public.agent_service_requests (
  id uuid primary key default gen_random_uuid(), requester_user_id uuid not null references public.users(id),
  agent_id uuid not null references public.agents(id), agent_owner_user_id uuid not null references public.users(id),
  skill_name text not null, service_type text not null default 'conversation_generation',
  conversation_id uuid null references public.conversations(id), source_content_id uuid null references public.content_items(id),
  source_context jsonb not null default '{}'::jsonb, prompt text not null,
  status text not null default 'reserved' check (status in ('reserved','processing','completed','failed','released')),
  credit_cost integer not null check (credit_cost > 0), idempotency_key text null,
  ai_gateway_request_id uuid null references public.ai_gateway_requests(id), result_message_id uuid null references public.messages(id),
  created_at timestamptz not null default timezone('utc',now()), completed_at timestamptz null,
  updated_at timestamptz not null default timezone('utc',now())
);
create unique index if not exists agent_service_requests_idempotency_key_uq on public.agent_service_requests(requester_user_id,idempotency_key) where idempotency_key is not null;
create index if not exists agent_service_requests_agent_idx on public.agent_service_requests(agent_id,created_at desc);
create index if not exists agent_service_requests_owner_idx on public.agent_service_requests(agent_owner_user_id,created_at desc);
create table if not exists public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id),
  entry_type text not null check (entry_type in ('grant','purchase','debit','reward','refund','adjustment')),
  amount integer not null check (amount > 0), status text not null default 'posted' check (status in ('reserved','posted','reversed')),
  source_type text not null, source_id uuid null, counterparty_user_id uuid null references public.users(id),
  agent_id uuid null references public.agents(id), service_request_id uuid null references public.agent_service_requests(id),
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default timezone('utc',now()), posted_at timestamptz null, reversed_at timestamptz null
);
create unique index if not exists ai_credit_ledger_request_debit_uq on public.ai_credit_ledger(service_request_id,entry_type) where service_request_id is not null and entry_type='debit';
create unique index if not exists ai_credit_ledger_request_reward_uq on public.ai_credit_ledger(service_request_id,entry_type) where service_request_id is not null and entry_type='reward';
create index if not exists ai_credit_ledger_user_idx on public.ai_credit_ledger(user_id,created_at desc);
alter table public.agent_service_requests enable row level security;
alter table public.ai_credit_ledger enable row level security;
drop policy if exists "agent_service_requests_participants" on public.agent_service_requests;
create policy "agent_service_requests_participants" on public.agent_service_requests for select to authenticated using ((select auth.uid())=requester_user_id or (select auth.uid())=agent_owner_user_id);
drop policy if exists "ai_credit_ledger_owner" on public.ai_credit_ledger;
create policy "ai_credit_ledger_owner" on public.ai_credit_ledger for select to authenticated using ((select auth.uid())=user_id);

create or replace function public.get_ai_credit_balance() returns integer language sql security invoker set search_path='' as $$
select coalesce(sum(case when entry_type in ('grant','purchase','reward','refund','adjustment') and status='posted' then amount when entry_type='debit' and status='posted' then -amount else 0 end),0)::integer from public.ai_credit_ledger where user_id=(select auth.uid()); $$;
create or replace function public.list_public_agent_services(p_skill_name text default null,p_limit integer default 30)
returns table(agent_id uuid,agent_name text,agent_handle text,owner_user_id uuid,skill_name text,skill_description text,skill_configuration jsonb,skill_risk_level text)
language sql security invoker set search_path='' as $$
select a.id,a.name,a.handle,a.owner_user_id,s.name,s.description,s.configuration,coalesce(c.risk_level,'low')
from public.agents a join public.agent_skills s on s.agent_id=a.id and s.enabled=true
left join public.agent_skill_catalog c on lower(c.skill_key)=lower(s.name)
where a.status='active' and a.visibility='public' and a.owner_user_id<>(select auth.uid())
and (p_skill_name is null or lower(s.name)=lower(p_skill_name))
and not exists(select 1 from public.social_blocks b where b.blocker_type='user' and b.blocker_id=(select auth.uid()) and b.blocked_type='user' and b.blocked_id=a.owner_user_id)
and not exists(select 1 from public.social_blocks b where b.blocker_type='user' and b.blocker_id=a.owner_user_id and b.blocked_type='user' and b.blocked_id=(select auth.uid()))
order by a.name asc limit greatest(1,least(coalesce(p_limit,30),100)); $$;

create or replace function public.reserve_agent_service_request(p_agent_id uuid,p_skill_name text,p_prompt text,p_credit_cost integer,p_idempotency_key text default null,p_conversation_id uuid default null,p_source_content_id uuid default null,p_source_context jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_skill public.agent_skills%rowtype; v_agent public.agents%rowtype; v_balance integer; v_request uuid;
begin
if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_user::text));
if p_credit_cost is null or p_credit_cost<1 or p_credit_cost>10000 then raise exception 'INVALID_CREDIT_COST'; end if;
if length(trim(coalesce(p_prompt,'')))=0 then raise exception 'PROMPT_REQUIRED'; end if;
select * into v_agent from public.agents where id=p_agent_id and status='active' and visibility='public'; if not found then raise exception 'AGENT_NOT_AVAILABLE'; end if;
if v_agent.owner_user_id=v_user then raise exception 'SELF_AGENT_SERVICE_NOT_ALLOWED'; end if;
if exists(select 1 from public.social_blocks where blocker_type='user' and blocker_id=v_user and blocked_type='user' and blocked_id=v_agent.owner_user_id) or exists(select 1 from public.social_blocks where blocker_type='user' and blocker_id=v_agent.owner_user_id and blocked_type='user' and blocked_id=v_user) then raise exception 'COMMUNICATION_BLOCKED'; end if;
select * into v_skill from public.agent_skills where agent_id=p_agent_id and enabled=true and lower(name)=lower(trim(p_skill_name)) limit 1; if not found then raise exception 'AGENT_SKILL_NOT_AVAILABLE'; end if;
if p_idempotency_key is not null then select id into v_request from public.agent_service_requests where requester_user_id=v_user and idempotency_key=p_idempotency_key limit 1; if v_request is not null then return jsonb_build_object('id',v_request,'reused',true); end if; end if;
select public.get_ai_credit_balance() into v_balance; if v_balance<p_credit_cost then raise exception 'INSUFFICIENT_AI_CREDITS'; end if;
insert into public.agent_service_requests(requester_user_id,agent_id,agent_owner_user_id,skill_name,prompt,credit_cost,idempotency_key,conversation_id,source_content_id,source_context,status)
values(v_user,p_agent_id,v_agent.owner_user_id,trim(p_skill_name),trim(p_prompt),p_credit_cost,p_idempotency_key,p_conversation_id,p_source_content_id,coalesce(p_source_context,'{}'::jsonb),'reserved') returning id into v_request;
insert into public.ai_credit_ledger(user_id,entry_type,amount,status,source_type,source_id,counterparty_user_id,agent_id,service_request_id,metadata,posted_at)
values(v_user,'debit',p_credit_cost,'posted','agent_service',v_request,v_agent.owner_user_id,p_agent_id,v_request,jsonb_build_object('skill_name',trim(p_skill_name),'phase','13'),timezone('utc',now()));
return jsonb_build_object('id',v_request,'reused',false,'agent_id',p_agent_id,'agent_owner_user_id',v_agent.owner_user_id,'credit_cost',p_credit_cost,'balance_after',v_balance-p_credit_cost);
end; $$;

create or replace function public.complete_agent_service_request(p_request_id uuid,p_ai_gateway_request_id uuid,p_result_message_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_req public.agent_service_requests%rowtype;
begin
select * into v_req from public.agent_service_requests where id=p_request_id for update; if not found then raise exception 'SERVICE_REQUEST_NOT_FOUND'; end if;
if v_req.requester_user_id<>v_user then raise exception 'SERVICE_REQUEST_FORBIDDEN'; end if;
if v_req.status='completed' then return jsonb_build_object('id',v_req.id,'status','completed','reused',true); end if;
if v_req.status not in ('reserved','processing') then raise exception 'SERVICE_REQUEST_NOT_SETTLEABLE'; end if;
update public.agent_service_requests set status='completed',ai_gateway_request_id=p_ai_gateway_request_id,result_message_id=p_result_message_id,completed_at=timezone('utc',now()),updated_at=timezone('utc',now()) where id=v_req.id;
insert into public.ai_credit_ledger(user_id,entry_type,amount,status,source_type,source_id,counterparty_user_id,agent_id,service_request_id,metadata,posted_at)
values(v_req.agent_owner_user_id,'reward',v_req.credit_cost,'posted','agent_service',v_req.id,v_req.requester_user_id,v_req.agent_id,v_req.id,coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('skill_name',v_req.skill_name,'phase','13'),timezone('utc',now())) on conflict(service_request_id,entry_type) do nothing;
return jsonb_build_object('id',v_req.id,'status','completed','agent_owner_user_id',v_req.agent_owner_user_id,'credit_cost',v_req.credit_cost);
end; $$;

create or replace function public.release_agent_service_request(p_request_id uuid,p_reason text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_req public.agent_service_requests%rowtype;
begin
select * into v_req from public.agent_service_requests where id=p_request_id for update; if not found then raise exception 'SERVICE_REQUEST_NOT_FOUND'; end if;
if v_req.requester_user_id<>v_user then raise exception 'SERVICE_REQUEST_FORBIDDEN'; end if;
if v_req.status='released' then return jsonb_build_object('id',v_req.id,'status','released','reused',true); end if;
if v_req.status='completed' then raise exception 'SERVICE_REQUEST_ALREADY_COMPLETED'; end if;
update public.agent_service_requests set status='released',updated_at=timezone('utc',now()) where id=v_req.id;
insert into public.ai_credit_ledger(user_id,entry_type,amount,status,source_type,source_id,counterparty_user_id,agent_id,service_request_id,metadata,posted_at)
values(v_req.requester_user_id,'refund',v_req.credit_cost,'posted','agent_service',v_req.id,v_req.agent_owner_user_id,v_req.agent_id,v_req.id,jsonb_build_object('reason',coalesce(p_reason,'generation_failed'),'phase','13'),timezone('utc',now())) on conflict(service_request_id,entry_type) do nothing;
return jsonb_build_object('id',v_req.id,'status','released','refunded',v_req.credit_cost);
end; $$;

create or replace function public.create_contextual_direct_conversation(p_target_type text,p_target_id uuid,p_message text default null,p_context_type text default null,p_context_id uuid default null,p_context jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_result jsonb; v_conversation uuid;
begin
if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
v_result:=public.create_direct_conversation('user',v_user,p_target_type,p_target_id,p_message,null); v_conversation:=(v_result->>'conversation_id')::uuid;
update public.conversations set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('context_type',p_context_type,'context_id',p_context_id,'context',coalesce(p_context,'{}'::jsonb)) where id=v_conversation;
return v_result||jsonb_build_object('context_type',p_context_type,'context_id',p_context_id);
end; $$;

create or replace function public.create_ai_gateway_request(p_agent_id uuid default null,p_idempotency_key text default null,p_requested_capabilities text[] default '{}',p_input_fingerprint text default null,p_metadata jsonb default '{}')
returns public.ai_gateway_requests language plpgsql security definer set search_path='' as $$
declare v public.ai_gateway_requests; v_allowed boolean:=false;
begin
if p_agent_id is not null then
v_allowed:=exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=auth.uid() and a.status<>'archived');
if not v_allowed then v_allowed:=exists(select 1 from public.agent_service_requests r where r.agent_id=p_agent_id and r.requester_user_id=auth.uid() and r.status in ('reserved','processing')); end if;
if not v_allowed then raise exception 'AI_GATEWAY_AGENT_NOT_AUTHORIZED'; end if;
end if;
if p_idempotency_key is not null then select * into v from public.ai_gateway_requests where user_id=auth.uid() and idempotency_key=p_idempotency_key; if v.id is not null then v.idempotency_reused:=true; return v; end if; end if;
insert into public.ai_gateway_requests(user_id,agent_id,idempotency_key,requested_capabilities,input_fingerprint,metadata) values(auth.uid(),p_agent_id,p_idempotency_key,coalesce(p_requested_capabilities,'{}'),p_input_fingerprint,coalesce(p_metadata,'{}'::jsonb)) returning * into v; return v;
end; $$;

create or replace function public.append_agent_service_message(p_service_request_id uuid,p_conversation_id uuid,p_body text,p_metadata jsonb default '{}')
returns public.messages language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); r public.agent_service_requests%rowtype; m public.messages;
begin
if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
select * into r from public.agent_service_requests where id=p_service_request_id for update; if not found or r.requester_user_id<>v_user then raise exception 'SERVICE_REQUEST_FORBIDDEN'; end if;
if r.status not in ('reserved','processing') then raise exception 'SERVICE_REQUEST_NOT_MESSAGEABLE'; end if;
if r.conversation_id is not null and r.conversation_id<>p_conversation_id then raise exception 'SERVICE_CONVERSATION_MISMATCH'; end if;
if not exists(select 1 from public.conversation_participants cp where cp.conversation_id=p_conversation_id and cp.subject_type='user' and cp.subject_id=v_user and cp.status='active') then raise exception 'CONVERSATION_ACCESS_DENIED'; end if;
if not exists(select 1 from public.conversation_participants cp where cp.conversation_id=p_conversation_id and cp.subject_type='agent' and cp.subject_id=r.agent_id and cp.status='active') then raise exception 'AGENT_NOT_IN_CONVERSATION'; end if;
insert into public.messages(conversation_id,sender_type,sender_id,body,message_type,status,metadata) values(p_conversation_id,'agent',r.agent_id,p_body,'text','sent',coalesce(p_metadata,'{}'::jsonb)) returning * into m; return m;
end; $$;

revoke all on function public.get_ai_credit_balance() from public; revoke execute on function public.get_ai_credit_balance() from anon, public;
grant execute on function public.get_ai_credit_balance() to authenticated;
revoke all on function public.list_public_agent_services(text,integer) from public; revoke execute on function public.list_public_agent_services(text,integer) from anon, public;
grant execute on function public.list_public_agent_services(text,integer) to authenticated;
revoke all on function public.reserve_agent_service_request(uuid,text,text,integer,text,uuid,uuid,jsonb) from public; revoke execute on function public.reserve_agent_service_request(uuid,text,text,integer,text,uuid,uuid,jsonb) from anon, public;
grant execute on function public.reserve_agent_service_request(uuid,text,text,integer,text,uuid,uuid,jsonb) to authenticated;
revoke all on function public.complete_agent_service_request(uuid,uuid,uuid,jsonb) from public; revoke execute on function public.complete_agent_service_request(uuid,uuid,uuid,jsonb) from anon, public;
grant execute on function public.complete_agent_service_request(uuid,uuid,uuid,jsonb) to authenticated;
revoke all on function public.release_agent_service_request(uuid,text) from public; revoke execute on function public.release_agent_service_request(uuid,text) from anon, public;
grant execute on function public.release_agent_service_request(uuid,text) to authenticated;
revoke all on function public.create_contextual_direct_conversation(text,uuid,text,text,uuid,jsonb) from public; revoke execute on function public.create_contextual_direct_conversation(text,uuid,text,text,uuid,jsonb) from anon, public;
grant execute on function public.create_contextual_direct_conversation(text,uuid,text,text,uuid,jsonb) to authenticated;
revoke all on function public.append_agent_service_message(uuid,uuid,text,jsonb) from public; revoke execute on function public.append_agent_service_message(uuid,uuid,text,jsonb) from anon, public;
grant execute on function public.append_agent_service_message(uuid,uuid,text,jsonb) to authenticated;
revoke all on function public.create_ai_gateway_request(uuid,text,text[],text,jsonb) from public; revoke execute on function public.create_ai_gateway_request(uuid,text,text[],text,jsonb) from anon, public; grant execute on function public.create_ai_gateway_request(uuid,text,text[],text,jsonb) to authenticated;


-- Phase 15 Runtime reconciliation: cross-owner services execute through the canonical Agent Runtime.
alter table public.agent_commands add column if not exists requester_user_id uuid references public.users(id);
alter table public.agent_commands add column if not exists service_request_id uuid references public.agent_service_requests(id);
create index if not exists agent_commands_requester_idx on public.agent_commands(requester_user_id,created_at desc);
create index if not exists agent_commands_service_request_idx on public.agent_commands(service_request_id);
drop policy if exists agent_commands_owner_read on public.agent_commands;
create policy agent_commands_owner_read on public.agent_commands for select to authenticated using ((select auth.uid())=owner_user_id or (select auth.uid())=requester_user_id);

create or replace function public.create_agent_service_command(p_service_request_id uuid,p_command_text text,p_requested_capabilities text[] default '{}',p_idempotency_key text default null)
returns public.agent_commands language plpgsql security definer set search_path='' as $$
declare r public.agent_service_requests%rowtype; a public.agents%rowtype; pol public.agent_policies; v public.agent_commands;
begin
if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
select * into r from public.agent_service_requests where id=p_service_request_id and requester_user_id=auth.uid() for update;
if r.id is null then raise exception 'SERVICE_REQUEST_NOT_FOUND'; end if;
if r.status not in ('reserved','processing') then raise exception 'SERVICE_REQUEST_NOT_ACTIVE'; end if;
select * into a from public.agents where id=r.agent_id and status='active' and visibility='public';
if a.id is null or a.owner_user_id=r.requester_user_id then raise exception 'AGENT_NOT_AVAILABLE'; end if;
select * into pol from public.agent_policies where agent_id=a.id and enabled=true order by policy_version desc limit 1;
if pol.id is null then raise exception 'AGENT_POLICY_REQUIRED'; end if;
if p_idempotency_key is not null then select * into v from public.agent_commands where requester_user_id=auth.uid() and idempotency_key=p_idempotency_key limit 1; if v.id is not null then return v; end if; end if;
update public.agent_service_requests set status='processing',updated_at=timezone('utc',now()) where id=r.id;
insert into public.agent_commands(agent_id,owner_user_id,requester_user_id,service_request_id,command_text,requested_capabilities,autonomy_level,policy_version,risk_level,risk_decision,idempotency_key,status,command_source)
values(a.id,a.owner_user_id,r.requester_user_id,r.id,trim(p_command_text),coalesce(p_requested_capabilities,'{}'),coalesce(pol.autonomy_level,'recommend'),pol.policy_version,'low','pending',p_idempotency_key,'planning','agent_service') returning * into v;
insert into public.agent_execution_contexts(command_id,agent_id,owner_user_id,correlation_id,state,budget_snapshot,policy_snapshot) values(v.id,a.id,a.owner_user_id,v.correlation_id,'planning','{}'::jsonb,to_jsonb(pol));
insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata) values(v.id,a.id,a.owner_user_id,'service_command_created','received','planning',jsonb_build_object('service_request_id',r.id,'requester_user_id',r.requester_user_id,'skill_name',r.skill_name));
return v;
end $$;

revoke all on function public.create_agent_service_command(uuid,text,text[],text) from public,anon;
grant execute on function public.create_agent_service_command(uuid,text,text[],text) to authenticated;

drop policy if exists agent_execution_contexts_owner_read on public.agent_execution_contexts;
create policy agent_execution_contexts_owner_read on public.agent_execution_contexts for select to authenticated using ((select auth.uid())=owner_user_id or command_id in (select id from public.agent_commands where requester_user_id=(select auth.uid())));
drop policy if exists agent_runtime_events_owner_read on public.agent_runtime_events;
create policy agent_runtime_events_owner_read on public.agent_runtime_events for select to authenticated using ((select auth.uid())=owner_user_id or command_id in (select id from public.agent_commands where requester_user_id=(select auth.uid())));
drop policy if exists agent_task_steps_owner_read on public.agent_task_steps;
create policy agent_task_steps_owner_read on public.agent_task_steps for select to authenticated using ((select auth.uid())=owner_user_id or command_id in (select id from public.agent_commands where requester_user_id=(select auth.uid())));
drop policy if exists agent_tasks_owner_read on public.agent_tasks;
create policy agent_tasks_owner_read on public.agent_tasks for select to authenticated using ((select auth.uid())=owner_user_id or command_id in (select id from public.agent_commands where requester_user_id=(select auth.uid())));
drop policy if exists agent_tool_runs_owner_read on public.agent_tool_runs;
create policy agent_tool_runs_owner_read on public.agent_tool_runs for select to authenticated using ((select auth.uid())=owner_user_id or command_id in (select id from public.agent_commands where requester_user_id=(select auth.uid())));
drop policy if exists agent_spend_events_owner_read on public.agent_spend_events;
create policy agent_spend_events_owner_read on public.agent_spend_events for select to authenticated using ((select auth.uid())=owner_user_id or command_id in (select id from public.agent_commands where requester_user_id=(select auth.uid())));

-- Runtime function bodies are reconciled in the linked database by the same authorization rule:
-- owner OR requester for a service command; owner-only behavior remains for normal commands.
