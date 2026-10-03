-- Phase 13/15 reconciliation: cross-owner Agent Services use canonical Agent Runtime authorization.
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

create or replace function public.materialize_agent_plan(p_command_id uuid,p_plan jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.agent_commands; s jsonb; t jsonb; tool public.agent_tool_definitions; cap boolean; task_id uuid; step_no integer; task_no integer:=0; derived_risk public.risk_level:='low';
begin
select * into c from public.agent_commands where id=p_command_id and (owner_user_id=auth.uid() or requester_user_id=auth.uid()) for update;
if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
if c.status not in ('planning','received') then raise exception 'COMMAND_NOT_PLANABLE'; end if;
if jsonb_typeof(p_plan->'tasks')<>'array' or jsonb_array_length(p_plan->'tasks')=0 then raise exception 'PLAN_TASKS_REQUIRED'; end if;
delete from public.agent_task_steps where command_id=c.id; delete from public.agent_tasks where command_id=c.id;
for t in select * from jsonb_array_elements(p_plan->'tasks') loop
task_no:=task_no+1;
insert into public.agent_tasks(command_id,agent_id,owner_user_id,task_key,title,description,status,sequence_no,input) values(c.id,c.agent_id,c.owner_user_id,coalesce(t->>'task_key','task_'||task_no),coalesce(t->>'title','Agent task'),t->>'description','ready',task_no,coalesce(t->'input','{}')) returning id into task_id;
step_no:=0;
for s in select * from jsonb_array_elements(coalesce(t->'steps','[]')) loop
step_no:=step_no+1;
select * into tool from public.agent_tool_definitions where tool_key=s->>'tool_key' and enabled=true;
if tool.id is null then raise exception 'AGENT_TOOL_NOT_AVAILABLE:%',s->>'tool_key'; end if;
select exists(select 1 from public.agent_capabilities ac where ac.agent_id=c.agent_id and ac.capability=tool.capability and ac.enabled=true) into cap;
if not cap then raise exception 'AGENT_CAPABILITY_NOT_GRANTED:%',tool.capability; end if;
if tool.risk_level='critical' then derived_risk:='critical'; elsif tool.risk_level='high' and derived_risk<>'critical' then derived_risk:='high'; elsif tool.risk_level='medium' and derived_risk='low' then derived_risk:='medium'; end if;
insert into public.agent_task_steps(task_id,command_id,agent_id,owner_user_id,step_key,tool_key,sequence_no,arguments,status,risk_level,requires_approval) values(task_id,c.id,c.agent_id,c.owner_user_id,coalesce(s->>'step_key','step_'||step_no),tool.tool_key,step_no,coalesce(s->'arguments','{}'),'ready',tool.risk_level,(tool.risk_level in ('high','critical') or c.autonomy_level='recommend'));
end loop; end loop;
update public.agent_commands set status='ready',risk_level=derived_risk,risk_decision='pending' where id=c.id;
update public.agent_execution_contexts set state='ready',updated_at=timezone('utc',now()) where command_id=c.id;
insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata) values(c.id,c.agent_id,c.owner_user_id,'plan_materialized','planning','ready',jsonb_build_object('risk_level',derived_risk,'task_count',task_no,'service_request_id',c.service_request_id));
return jsonb_build_object('command_id',c.id,'status','ready','risk_level',derived_risk);
end $$;

create or replace function public.begin_agent_execution(p_command_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.agent_commands; a public.agents; pol public.agent_policies; ks public.agent_kill_switches; approval_id uuid; need_approval boolean:=false; policy_rules jsonb; current_caps text[]; svc public.agent_service_requests;
begin
select * into c from public.agent_commands where id=p_command_id and (owner_user_id=auth.uid() or requester_user_id=auth.uid()) for update;
if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
if c.status<>'ready' then raise exception 'COMMAND_NOT_READY'; end if;
if c.service_request_id is not null then select * into svc from public.agent_service_requests where id=c.service_request_id and requester_user_id=auth.uid() for update; if svc.id is null or svc.status not in ('processing','reserved') or svc.agent_id<>c.agent_id then raise exception 'SERVICE_REQUEST_NOT_ACTIVE'; end if; end if;
select * into a from public.agents where id=c.agent_id;
if a.id is null or a.status<>'active' then raise exception 'AGENT_NOT_ACTIVE'; end if;
select * into ks from public.agent_kill_switches where agent_id=c.agent_id;
if coalesce(ks.enabled,false) then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
select * into pol from public.agent_policies where agent_id=c.agent_id and enabled=true order by policy_version desc limit 1;
if pol.id is null then raise exception 'AGENT_POLICY_REQUIRED'; end if;
policy_rules:=coalesce(pol.rules,'{}');
select coalesce(array_agg(ac.capability order by ac.capability),'{}') into current_caps from public.agent_capabilities ac where ac.agent_id=c.agent_id and ac.enabled=true;
if exists(select 1 from unnest(coalesce(c.requested_capabilities,'{}')) x where not(x=any(current_caps))) then raise exception 'AGENT_CAPABILITY_REVOKED'; end if;
need_approval:=exists(select 1 from public.agent_task_steps where command_id=c.id and requires_approval=true) or c.risk_level in ('high','critical') or c.autonomy_level='recommend' or (c.autonomy_level='assist' and c.risk_level in ('medium','high','critical')) or coalesce((policy_rules->'approval_required_risk_levels') ? c.risk_level::text,false);
insert into public.risk_assessments(actor_user_id,actor_agent_id,action,resource_type,resource_id,risk_level,decision,factors,policy_version) values(auth.uid(),c.agent_id,'agent.execute','agent_command',c.id,c.risk_level,case when need_approval then 'approval_required' else 'allow' end,jsonb_build_object('autonomy_level',c.autonomy_level,'command_id',c.id,'command_source',c.command_source,'service_request_id',c.service_request_id,'policy_rules',policy_rules,'execution_recheck',true),pol.policy_version);
if need_approval then
insert into public.approval_requests(requester_user_id,requester_agent_id,action,resource_type,resource_id,status,risk_level,payload,expires_at) values(auth.uid(),c.agent_id,'agent.execute','agent_command',c.id,'pending'::public.approval_status,c.risk_level,jsonb_build_object('command_id',c.id,'command_text',c.command_text,'risk_level',c.risk_level,'service_request_id',c.service_request_id,'correlation_id',c.correlation_id),timezone('utc',now())) returning id into approval_id;
update public.agent_commands set status='waiting_approval',risk_decision='approval_required' where id=c.id;
update public.agent_execution_contexts set state='waiting_approval',updated_at=timezone('utc',now()) where command_id=c.id;
insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata) values(c.id,c.agent_id,c.owner_user_id,'approval_requested','ready','waiting_approval',jsonb_build_object('approval_id',approval_id,'service_request_id',c.service_request_id));
return jsonb_build_object('status','waiting_approval','approval_id',approval_id,'command_id',c.id);
end if;
update public.agent_commands set status='running',risk_decision='allow',started_at=timezone('utc',now()) where id=c.id;
update public.agent_execution_contexts set state='running',updated_at=timezone('utc',now()) where command_id=c.id;
insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata) values(c.id,c.agent_id,c.owner_user_id,'execution_started','ready','running',jsonb_build_object('service_request_id',c.service_request_id));
return jsonb_build_object('status','running','command_id',c.id);
end $$;

create or replace function public.record_agent_tool_result(p_step_id uuid,p_status text,p_result jsonb default '{}',p_error_code text default null,p_error_message text default null,p_latency_ms integer default null,p_output_fingerprint text default null)
returns public.agent_task_steps language plpgsql security definer set search_path='' as $$
declare s public.agent_task_steps; c public.agent_commands;
begin
select * into s from public.agent_task_steps where id=p_step_id and (owner_user_id=auth.uid() or command_id in (select id from public.agent_commands where requester_user_id=auth.uid())) for update;
if s.id is null then raise exception 'STEP_NOT_FOUND'; end if;
select * into c from public.agent_commands where id=s.command_id and (owner_user_id=auth.uid() or requester_user_id=auth.uid());
if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
if c.status not in ('running','waiting_approval') then raise exception 'COMMAND_NOT_EXECUTING'; end if;
update public.agent_task_steps set status=p_status,result=coalesce(p_result,'{}'),error_code=p_error_code,error_message=p_error_message,started_at=coalesce(started_at,timezone('utc',now())),completed_at=case when p_status in ('completed','failed','cancelled','killed','skipped') then timezone('utc',now()) else completed_at end where id=s.id returning * into s;
insert into public.agent_tool_runs(step_id,command_id,agent_id,owner_user_id,tool_key,status,input_fingerprint,result,error_code,error_message,latency_ms,completed_at) select s.id,s.command_id,s.agent_id,s.owner_user_id,s.tool_key,p_status,null,coalesce(p_result,'{}'),p_error_code,p_error_message,p_latency_ms,case when p_status in ('completed','failed','cancelled','killed') then timezone('utc',now()) else null end;
return s;
end $$;

create or replace function public.transition_agent_command(p_command_id uuid,p_to_state text,p_error_code text default null,p_error_message text default null,p_result_summary text default null)
returns public.agent_commands language plpgsql security definer set search_path='' as $$
declare c public.agent_commands; ks public.agent_kill_switches; allowed boolean:=false;
begin
select * into c from public.agent_commands where id=p_command_id and (owner_user_id=auth.uid() or requester_user_id=auth.uid()) for update;
if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
select * into ks from public.agent_kill_switches where agent_id=c.agent_id;
if coalesce(ks.enabled,false) and p_to_state not in ('killed','cancelled') then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
allowed:=(c.status='ready' and p_to_state in ('running','cancelled','waiting_approval','killed')) or (c.status='waiting_approval' and p_to_state in ('running','cancelled','killed')) or (c.status='running' and p_to_state in ('completed','failed','cancelled','killed')) or (c.status='planning' and p_to_state in ('failed','cancelled','killed'));
if not allowed then raise exception 'INVALID_COMMAND_STATE_TRANSITION'; end if;
update public.agent_commands set status=p_to_state,error_code=p_error_code,error_message=p_error_message,result_summary=p_result_summary,started_at=case when p_to_state='running' and started_at is null then timezone('utc',now()) else started_at end,completed_at=case when p_to_state in ('completed','failed','cancelled','killed') then timezone('utc',now()) else completed_at end where id=c.id returning * into c;
update public.agent_execution_contexts set state=p_to_state,updated_at=timezone('utc',now()) where command_id=c.id;
insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata) values(c.id,c.agent_id,c.owner_user_id,'command_state_transition',c.status,p_to_state,jsonb_build_object('error_code',p_error_code,'service_request_id',c.service_request_id));
return c;
end $$;

create or replace function public.record_agent_spend(p_agent_id uuid,p_command_id uuid,p_step_id uuid,p_amount numeric,p_currency text,p_metadata jsonb default '{}')
returns public.agent_spend_events language plpgsql security definer set search_path='' as $$
declare b public.agent_budgets; v public.agent_spend_events; daily numeric; monthly numeric; owner_id uuid;
begin
if p_amount<0 then raise exception 'INVALID_SPEND'; end if;
select owner_user_id into owner_id from public.agents where id=p_agent_id;
if owner_id is null then raise exception 'AGENT_NOT_FOUND'; end if;
if not exists(select 1 from public.agents where id=p_agent_id and owner_user_id=auth.uid()) and not exists(select 1 from public.agent_service_requests where id=(select service_request_id from public.agent_commands where id=p_command_id) and requester_user_id=auth.uid() and agent_id=p_agent_id and status in ('processing','reserved')) then raise exception 'AGENT_NOT_AUTHORIZED'; end if;
select * into b from public.agent_budgets where agent_id=p_agent_id and enabled=true limit 1;
if b.agent_id is not null then
if upper(p_currency)<>upper(b.currency) then raise exception 'AGENT_BUDGET_CURRENCY_MISMATCH'; end if;
select coalesce(sum(amount),0) into daily from public.agent_spend_events where agent_id=p_agent_id and spend_type='actual' and currency=upper(p_currency) and created_at>=date_trunc('day',timezone('utc',now()));
select coalesce(sum(amount),0) into monthly from public.agent_spend_events where agent_id=p_agent_id and spend_type='actual' and currency=upper(p_currency) and created_at>=date_trunc('month',timezone('utc',now()));
if b.max_spend_per_action is not null and p_amount>b.max_spend_per_action then raise exception 'AGENT_ACTION_SPEND_LIMIT_EXCEEDED'; end if;
if b.daily_spend_limit is not null and daily+p_amount>b.daily_spend_limit then raise exception 'AGENT_DAILY_SPEND_LIMIT_EXCEEDED'; end if;
if b.monthly_spend_limit is not null and monthly+p_amount>b.monthly_spend_limit then raise exception 'AGENT_MONTHLY_SPEND_LIMIT_EXCEEDED'; end if;
end if;
insert into public.agent_spend_events(agent_id,owner_user_id,command_id,step_id,amount,currency,spend_type,metadata) values(p_agent_id,owner_id,p_command_id,p_step_id,p_amount,upper(p_currency),'actual',coalesce(p_metadata,'{}')) returning * into v;
return v;
end $$;

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

revoke all on function public.create_agent_service_command(uuid,text,text[],text) from public,anon;
grant execute on function public.create_agent_service_command(uuid,text,text[],text) to authenticated;
