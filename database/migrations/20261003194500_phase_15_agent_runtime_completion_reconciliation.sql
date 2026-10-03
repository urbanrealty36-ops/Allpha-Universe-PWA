-- Phase 15 Agent Runtime completion reconciliation.
-- Live schema was reconciled first; this migration records the authoritative final functions.

create or replace function public.get_agent_runtime_context(p_command_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare c public.agent_commands; a public.agents; pol public.agent_policies; caps jsonb; tools jsonb; is_owner boolean;
begin
  select * into c from public.agent_commands where id=p_command_id and (owner_user_id=auth.uid() or requester_user_id=auth.uid());
  if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
  is_owner:=c.owner_user_id=auth.uid();
  select * into a from public.agents where id=c.agent_id;
  if a.id is null or a.status<>'active' then raise exception 'AGENT_NOT_ACTIVE'; end if;
  select * into pol from public.agent_policies where agent_id=c.agent_id and enabled=true order by policy_version desc limit 1;
  if pol.id is null then raise exception 'AGENT_POLICY_REQUIRED'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('capability',ac.capability,'constraints',case when is_owner then ac.constraints else '{}'::jsonb end) order by ac.capability),'[]'::jsonb)
    into caps from public.agent_capabilities ac where ac.agent_id=c.agent_id and ac.enabled=true;
  select coalesce(jsonb_agg(jsonb_build_object('tool_key',td.tool_key,'name',td.name,'description',td.description,'capability',td.capability,'risk_level',td.risk_level,'input_schema',td.input_schema) order by td.tool_key),'[]'::jsonb)
    into tools from public.agent_tool_definitions td
   where td.enabled=true and exists(select 1 from public.agent_capabilities ac where ac.agent_id=c.agent_id and ac.capability=td.capability and ac.enabled=true);
  return jsonb_build_object(
    'command',jsonb_build_object('id',c.id,'agent_id',c.agent_id,'command_text',c.command_text,'requested_capabilities',c.requested_capabilities,'autonomy_level',c.autonomy_level,'command_source',c.command_source,'service_request_id',c.service_request_id,'live_session_id',c.live_session_id,'live_collaboration_id',c.live_collaboration_id),
    'agent',jsonb_build_object('id',a.id,'name',a.name,'description',a.description,'runtime_state',a.runtime_state,'persona',case when is_owner then coalesce(a.persona,'{}'::jsonb) else '{}'::jsonb end),
    'policy',jsonb_build_object('policy_version',pol.policy_version,'autonomy_level',pol.autonomy_level,'spending_limit',pol.spending_limit,'rate_limit',pol.rate_limit,'approval_required_risk_levels',coalesce(pol.rules->'approval_required_risk_levels','[]'::jsonb)),
    'capabilities',caps,'available_tools',tools,
    'privacy',jsonb_build_object('requester_is_owner',is_owner,'private_policy_rules_excluded',not is_owner,'private_capability_constraints_excluded',not is_owner,'private_agent_persona_excluded',not is_owner)
  );
end
$function$;

revoke execute on function public.get_agent_runtime_context(uuid) from anon;
grant execute on function public.get_agent_runtime_context(uuid) to authenticated;

-- The execution lifecycle must provide a real future approval window, update Agent runtime state,
-- and preserve the actual prior command state in telemetry.
create or replace function public.transition_agent_command(p_command_id uuid,p_to_state text,p_error_code text default null,p_error_message text default null,p_result_summary text default null)
returns public.agent_commands
language plpgsql security definer set search_path to ''
as $function$
declare c public.agent_commands; ks public.agent_kill_switches; previous_status text; allowed boolean:=false;
begin
 select * into c from public.agent_commands where id=p_command_id and (owner_user_id=auth.uid() or requester_user_id=auth.uid()) for update;
 if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
 previous_status:=c.status;
 select * into ks from public.agent_kill_switches where agent_id=c.agent_id;
 if coalesce(ks.enabled,false) and p_to_state not in ('killed','cancelled') then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
 allowed:=(c.status='ready' and p_to_state in ('running','cancelled','waiting_approval','killed'))
   or (c.status='waiting_approval' and p_to_state in ('running','cancelled','killed'))
   or (c.status='running' and p_to_state in ('completed','failed','cancelled','killed'))
   or (c.status='planning' and p_to_state in ('failed','cancelled','killed'));
 if not allowed then raise exception 'INVALID_COMMAND_STATE_TRANSITION'; end if;
 update public.agent_commands set status=p_to_state,error_code=p_error_code,error_message=p_error_message,result_summary=p_result_summary,
   started_at=case when p_to_state='running' and started_at is null then timezone('utc',now()) else started_at end,
   completed_at=case when p_to_state in ('completed','failed','cancelled','killed') then timezone('utc',now()) else completed_at end
 where id=c.id returning * into c;
 update public.agent_execution_contexts set state=p_to_state,updated_at=timezone('utc',now()) where command_id=c.id;
 if p_to_state in ('completed','failed','cancelled','killed') then
   update public.agent_tasks set status=case when p_to_state='completed' then 'completed' else p_to_state end,completed_at=timezone('utc',now())
    where command_id=c.id and status in ('pending','ready','running','waiting_approval');
   update public.agent_task_steps set status=case when p_to_state='completed' then 'completed' else p_to_state end,completed_at=timezone('utc',now())
    where command_id=c.id and status in ('pending','ready','running','waiting_approval');
   update public.agents set runtime_state=case when p_to_state='killed' then 'sleeping'::public.agent_runtime_state else 'online'::public.agent_runtime_state end,updated_at=timezone('utc',now())
    where id=c.agent_id;
 end if;
 insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata)
 values(c.id,c.agent_id,c.owner_user_id,'command_state_transition',previous_status,p_to_state,jsonb_build_object('error_code',p_error_code,'service_request_id',c.service_request_id));
 return c;
end $function$;

create or replace function public.begin_agent_execution(p_command_id uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare c public.agent_commands; a public.agents; pol public.agent_policies; ks public.agent_kill_switches; approval_id uuid; need_approval boolean:=false; policy_rules jsonb; current_caps text[]; svc public.agent_service_requests; approver uuid;
begin
 select * into c from public.agent_commands where id=p_command_id and (owner_user_id=auth.uid() or requester_user_id=auth.uid()) for update;
 if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
 if c.status<>'ready' then raise exception 'COMMAND_NOT_READY'; end if;
 if c.service_request_id is not null then
   select * into svc from public.agent_service_requests where id=c.service_request_id and requester_user_id=auth.uid() for update;
   if svc.id is null or svc.status not in ('processing','reserved') or svc.agent_id<>c.agent_id then raise exception 'SERVICE_REQUEST_NOT_ACTIVE'; end if;
 end if;
 select * into a from public.agents where id=c.agent_id; if a.id is null or a.status<>'active' then raise exception 'AGENT_NOT_ACTIVE'; end if;
 select * into ks from public.agent_kill_switches where agent_id=c.agent_id; if coalesce(ks.enabled,false) then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
 select * into pol from public.agent_policies where agent_id=c.agent_id and enabled=true order by policy_version desc limit 1; if pol.id is null then raise exception 'AGENT_POLICY_REQUIRED'; end if;
 policy_rules:=coalesce(pol.rules,'{}');
 select coalesce(array_agg(ac.capability order by ac.capability),'{}') into current_caps from public.agent_capabilities ac where ac.agent_id=c.agent_id and ac.enabled=true;
 if exists(select 1 from unnest(coalesce(c.requested_capabilities,'{}')) x where not(x=any(current_caps))) then raise exception 'AGENT_CAPABILITY_REVOKED'; end if;
 need_approval:=exists(select 1 from public.agent_task_steps where command_id=c.id and requires_approval=true)
   or c.risk_level in ('high','critical') or c.autonomy_level='recommend'
   or (c.autonomy_level='assist' and c.risk_level in ('medium','high','critical'))
   or coalesce((policy_rules->'approval_required_risk_levels') ? c.risk_level::text,false);
 approver:=case when c.service_request_id is not null then a.owner_user_id else auth.uid() end;
 insert into public.risk_assessments(actor_user_id,actor_agent_id,action,resource_type,resource_id,risk_level,decision,factors,policy_version)
 values(auth.uid(),c.agent_id,'agent.execute','agent_command',c.id,c.risk_level,case when need_approval then 'approval_required' else 'allow' end,
   jsonb_build_object('autonomy_level',c.autonomy_level,'command_id',c.id,'command_source',c.command_source,'service_request_id',c.service_request_id,'approver_user_id',approver,'policy_rules',policy_rules,'execution_recheck',true),pol.policy_version);
 if need_approval then
   insert into public.approval_requests(requester_user_id,requester_agent_id,action,resource_type,resource_id,status,risk_level,payload,expires_at)
   values(approver,c.agent_id,'agent.execute','agent_command',c.id,'pending'::public.approval_status,c.risk_level,
     jsonb_build_object('command_id',c.id,'command_text',c.command_text,'risk_level',c.risk_level,'service_request_id',c.service_request_id,'service_requester_user_id',c.requester_user_id,'correlation_id',c.correlation_id),
     timezone('utc',now())+interval '15 minutes') returning id into approval_id;
   update public.agent_commands set status='waiting_approval',risk_decision='approval_required' where id=c.id;
   update public.agent_execution_contexts set state='waiting_approval',updated_at=timezone('utc',now()) where command_id=c.id;
   update public.agents set runtime_state='awaiting_approval'::public.agent_runtime_state,updated_at=timezone('utc',now()) where id=c.agent_id;
   insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata)
   values(c.id,c.agent_id,c.owner_user_id,'approval_requested','ready','waiting_approval',jsonb_build_object('approval_id',approval_id,'service_request_id',c.service_request_id,'approver_user_id',approver));
   return jsonb_build_object('status','waiting_approval','approval_id',approval_id,'command_id',c.id);
 end if;
 update public.agent_commands set status='running',risk_decision='allow',policy_version=pol.policy_version,started_at=timezone('utc',now()) where id=c.id;
 update public.agent_execution_contexts set state='running',policy_snapshot=coalesce(to_jsonb(pol),'{}'),updated_at=timezone('utc',now()) where command_id=c.id;
 update public.agent_tasks set status='running' where command_id=c.id and status='ready';
 update public.agents set runtime_state='online'::public.agent_runtime_state,updated_at=timezone('utc',now()) where id=c.agent_id;
 insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata)
 values(c.id,c.agent_id,c.owner_user_id,'execution_started','ready','running',jsonb_build_object('service_request_id',c.service_request_id));
 return jsonb_build_object('status','running','command_id',c.id);
end $function$;

create or replace function public.resume_agent_after_approval(p_command_id uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare c public.agent_commands; a public.agents; pol public.agent_policies; ks public.agent_kill_switches; ap public.approval_requests; current_caps text[]; policy_rules jsonb;
begin
 select * into c from public.agent_commands where id=p_command_id and (owner_user_id=auth.uid() or requester_user_id=auth.uid()) for update;
 if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
 if c.status<>'waiting_approval' then raise exception 'COMMAND_NOT_WAITING_APPROVAL'; end if;
 select * into ap from public.approval_requests where resource_id=c.id and resource_type='agent_command' and status='approved'::public.approval_status order by created_at desc limit 1 for update;
 if ap.id is null then raise exception 'APPROVAL_NOT_GRANTED'; end if;
 if ap.expires_at is not null and ap.expires_at<=timezone('utc',now()) then
   update public.approval_requests set status='expired'::public.approval_status,decided_at=coalesce(decided_at,timezone('utc',now())) where id=ap.id;
   raise exception 'APPROVAL_EXPIRED';
 end if;
 select * into a from public.agents where id=c.agent_id and status='active'; if a.id is null then raise exception 'AGENT_NOT_ACTIVE'; end if;
 select * into ks from public.agent_kill_switches where agent_id=c.agent_id; if coalesce(ks.enabled,false) then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
 select * into pol from public.agent_policies where agent_id=c.agent_id and enabled=true order by policy_version desc limit 1; if pol.id is null then raise exception 'AGENT_POLICY_REQUIRED'; end if;
 policy_rules:=coalesce(pol.rules,'{}');
 select coalesce(array_agg(ac.capability order by ac.capability),'{}') into current_caps from public.agent_capabilities ac where ac.agent_id=c.agent_id and ac.enabled=true;
 if exists(select 1 from unnest(coalesce(c.requested_capabilities,'{}')) x where not(x=any(current_caps))) then raise exception 'AGENT_CAPABILITY_REVOKED'; end if;
 insert into public.risk_assessments(actor_user_id,actor_agent_id,action,resource_type,resource_id,risk_level,decision,factors,policy_version)
 values(auth.uid(),c.agent_id,'agent.execute.recheck','agent_command',c.id,c.risk_level,'allow',jsonb_build_object('approval_id',ap.id,'approval_recheck',true,'execution_recheck',true,'policy_rules',policy_rules,'policy_version',pol.policy_version),pol.policy_version);
 update public.agent_commands set status='running',risk_decision='allow',policy_version=pol.policy_version,started_at=coalesce(started_at,timezone('utc',now())) where id=c.id;
 update public.agent_execution_contexts set state='running',policy_snapshot=coalesce(to_jsonb(pol),'{}'),updated_at=timezone('utc',now()) where command_id=c.id;
 update public.agent_tasks set status='running' where command_id=c.id and status='ready';
 update public.agents set runtime_state='online'::public.agent_runtime_state,updated_at=timezone('utc',now()) where id=c.agent_id;
 insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata)
 values(c.id,c.agent_id,c.owner_user_id,'approval_resumed','waiting_approval','running',jsonb_build_object('approval_id',ap.id,'policy_version',pol.policy_version,'execution_recheck',true));
 return jsonb_build_object('status','running','command_id',c.id,'approval_id',ap.id);
end $function$;
