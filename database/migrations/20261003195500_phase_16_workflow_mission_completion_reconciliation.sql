-- Phase 16 Workflow & Mission Engine completion reconciliation.
-- Applied to AllphaDb-Universe during implementation; retained here as the
-- canonical repository migration record. No business data is seeded.

drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions
for select to authenticated
using (
  private.workflow_subject_owned(owner_type, owner_id)
  or visibility = 'public'
  or exists (
    select 1 from public.mission_participants mp
    where mp.mission_id = missions.id
      and mp.subject_type = 'user'
      and mp.subject_id = (select auth.uid())
      and mp.status in ('pending','active')
  )
);

drop function if exists public.trigger_workflow(uuid,text,uuid,jsonb,text);
create function public.trigger_workflow(p_workflow_id uuid,p_trigger_type text,p_agent_id uuid,p_input jsonb default '{}'::jsonb,p_idempotency_key text default null)
returns public.workflow_runs language plpgsql security definer set search_path to ''
as $function$
declare w public.workflows; v public.workflow_versions; a public.agents; r public.workflow_runs;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into w from public.workflows where id=p_workflow_id and status='active';
  if not found then raise exception 'WORKFLOW_NOT_ACTIVE'; end if;
  if not private.workflow_subject_owned(w.owner_type,w.owner_id) then raise exception 'WORKFLOW_TRIGGER_DENIED'; end if;
  if w.trigger_type<>p_trigger_type then raise exception 'WORKFLOW_TRIGGER_TYPE_MISMATCH'; end if;
  select * into v from public.workflow_versions where workflow_id=w.id and status='published' order by version_no desc limit 1;
  if not found then raise exception 'WORKFLOW_VERSION_NOT_PUBLISHED'; end if;
  select * into a from public.agents where id=p_agent_id and owner_user_id=auth.uid() and status not in ('archived','deleted');
  if not found then raise exception 'AGENT_OWNERSHIP_DENIED'; end if;
  if p_idempotency_key is not null and exists (
    select 1 from public.workflow_runs where initiated_by_user_id=auth.uid() and workflow_id=w.id and agent_id=a.id
      and input->>'_idempotency_key'=p_idempotency_key and created_at>timezone('utc',now())-interval '24 hours'
  ) then
    select * into r from public.workflow_runs where initiated_by_user_id=auth.uid() and workflow_id=w.id and agent_id=a.id
      and input->>'_idempotency_key'=p_idempotency_key order by created_at desc limit 1;
    return r;
  end if;
  insert into public.workflow_runs(workflow_id,workflow_version_id,initiated_by_user_id,agent_id,status,input)
  values(w.id,v.id,auth.uid(),a.id,'created',coalesce(p_input,'{}'::jsonb)||case when p_idempotency_key is null then '{}'::jsonb else jsonb_build_object('_idempotency_key',p_idempotency_key) end)
  returning * into r;
  insert into public.workflow_run_steps(workflow_run_id,workflow_step_id,status)
  select r.id,s.id,'pending' from public.workflow_steps s where s.workflow_version_id=v.id and s.enabled=true order by s.sequence_no;
  insert into public.workflow_events(workflow_run_id,event_type,to_status,metadata)
  values(r.id,'workflow_triggered','created',jsonb_build_object('trigger_type',p_trigger_type,'workflow_id',w.id,'workflow_version_id',v.id,'agent_id',a.id));
  return r;
end;
$function$;

revoke execute on function public.trigger_workflow(uuid,text,uuid,jsonb,text) from public;
revoke execute on function public.trigger_workflow(uuid,text,uuid,jsonb,text) from anon;
grant execute on function public.trigger_workflow(uuid,text,uuid,jsonb,text) to authenticated;

create or replace function public.prepare_workflow_run(p_workflow_run_id uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare r public.workflow_runs; w public.workflows; v public.workflow_versions; c public.agent_commands; plan jsonb; caps text[]; step_count int;
begin
  select * into r from public.workflow_runs where id=p_workflow_run_id and initiated_by_user_id=auth.uid();
  if not found then raise exception 'WORKFLOW_RUN_ACCESS_DENIED'; end if;
  if r.status not in ('preparing','created') then return jsonb_build_object('workflow_run',to_jsonb(r),'status',r.status,'command_id',r.command_id); end if;
  select * into w from public.workflows where id=r.workflow_id;
  select * into v from public.workflow_versions where id=r.workflow_version_id and status='published';
  if not found or w.status<>'active' then raise exception 'WORKFLOW_VERSION_NOT_ACTIVE'; end if;
  if not exists(select 1 from public.agents a where a.id=r.agent_id and a.owner_user_id=auth.uid() and a.status not in ('archived','deleted')) then raise exception 'AGENT_OWNERSHIP_DENIED'; end if;
  select count(*) into step_count from public.workflow_steps where workflow_version_id=v.id and enabled=true;
  if step_count=0 then raise exception 'WORKFLOW_NO_STEPS'; end if;
  select array_agg(distinct t.capability order by t.capability) into caps from public.workflow_steps s join public.agent_tool_definitions t on t.tool_key=s.tool_key where s.workflow_version_id=v.id and s.enabled=true;
  with step_data as (
    select coalesce(jsonb_agg(jsonb_build_object('step_key',s.step_key,'tool_key',s.tool_key,'arguments',coalesce(s.arguments,'{}'::jsonb) || jsonb_build_object('_workflow_control',jsonb_build_object('condition',coalesce(s.condition,'{}'::jsonb),'retry_policy',coalesce(s.retry_policy,'{}'::jsonb),'requires_approval',s.requires_approval,'risk_level',s.risk_level::text))) order by s.sequence_no),'[]'::jsonb) steps
    from public.workflow_steps s where s.workflow_version_id=v.id and s.enabled=true
  )
  select jsonb_build_object('risk_level',case when exists(select 1 from public.workflow_steps where workflow_version_id=v.id and enabled=true and risk_level='critical') then 'critical' when exists(select 1 from public.workflow_steps where workflow_version_id=v.id and enabled=true and risk_level='high') then 'high' when exists(select 1 from public.workflow_steps where workflow_version_id=v.id and enabled=true and risk_level='medium') then 'medium' else 'low' end,'requires_approval',exists(select 1 from public.workflow_steps where workflow_version_id=v.id and enabled=true and (requires_approval or risk_level in ('high','critical'))),'tasks',jsonb_build_array(jsonb_build_object('task_key','workflow_'||r.id::text,'title',w.name,'description',coalesce(w.description,'Workflow execution'),'input',r.input,'steps',step_data.steps))) into plan from step_data;
  c:=public.create_agent_command(r.agent_id,'Workflow: '||w.name,coalesce(caps,array[]::text[]),'workflow-run:'||r.id::text);
  perform public.materialize_agent_plan(c.id,plan);
  update public.workflow_runs set command_id=c.id,status='ready' where id=r.id returning * into r;
  update public.workflow_run_steps set status='ready' where workflow_run_id=r.id;
  insert into public.workflow_events(workflow_run_id,event_type,from_status,to_status,metadata) values(r.id,'workflow_run_prepared','preparing','ready',jsonb_build_object('command_id',c.id));
  return jsonb_build_object('workflow_run',to_jsonb(r),'command_id',c.id,'plan',plan);
exception when others then
  update public.workflow_runs set status='failed',error_code=sqlstate,error_message=sqlerrm,completed_at=timezone('utc',now()) where id=p_workflow_run_id and initiated_by_user_id=auth.uid();
  raise;
end;
$function$;

create or replace function public.sync_workflow_run(p_workflow_run_id uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare r public.workflow_runs; c public.agent_commands; new_status text;
begin
  select * into r from public.workflow_runs where id=p_workflow_run_id and initiated_by_user_id=auth.uid();
  if not found then raise exception 'WORKFLOW_RUN_NOT_FOUND'; end if;
  if r.command_id is null then return jsonb_build_object('workflow_run',to_jsonb(r)); end if;
  select * into c from public.agent_commands where id=r.command_id;
  new_status=case c.status when 'waiting_approval' then 'waiting_approval' when 'running' then 'running' when 'completed' then 'completed' when 'failed' then 'failed' when 'cancelled' then 'cancelled' when 'killed' then 'killed' when 'denied' then 'failed' else r.status end;
  update public.workflow_runs set status=new_status,error_code=c.error_code,error_message=c.error_message,output=case when c.result_summary is not null then jsonb_build_object('summary',c.result_summary) else output end,started_at=coalesce(started_at,c.started_at),completed_at=case when new_status in ('completed','failed','cancelled','killed') then coalesce(completed_at,c.completed_at,timezone('utc',now())) else completed_at end where id=r.id returning * into r;
  update public.workflow_run_steps wrs set status=case ats.status when 'running' then 'running' when 'completed' then 'completed' when 'failed' then 'failed' when 'killed' then 'killed' when 'cancelled' then 'cancelled' when 'waiting_approval' then 'waiting_approval' when 'skipped' then 'completed' else wrs.status end,result=ats.result,error_code=ats.error_code,error_message=ats.error_message,started_at=ats.started_at,completed_at=ats.completed_at,agent_task_id=ats.task_id,agent_task_step_id=ats.id from public.agent_task_steps ats join public.agent_tasks at on at.id=ats.task_id where wrs.workflow_run_id=r.id and at.command_id=r.command_id and ats.step_key=(select s.step_key from public.workflow_steps s where s.id=wrs.workflow_step_id);
  return jsonb_build_object('workflow_run',to_jsonb(r),'command',to_jsonb(c));
end;
$function$;

revoke execute on function public.prepare_workflow_run(uuid) from public;
revoke execute on function public.prepare_workflow_run(uuid) from anon;
grant execute on function public.prepare_workflow_run(uuid) to authenticated;
revoke execute on function public.sync_workflow_run(uuid) from public;
revoke execute on function public.sync_workflow_run(uuid) from anon;
grant execute on function public.sync_workflow_run(uuid) to authenticated;

alter table public.agent_tool_runs drop constraint if exists agent_tool_runs_status_check;
alter table public.agent_tool_runs add constraint agent_tool_runs_status_check check (status = any (array['started','completed','failed','cancelled','killed','skipped']));

create or replace function public.record_agent_tool_result(p_step_id uuid,p_status text,p_result jsonb default '{}'::jsonb,p_error_code text default null,p_error_message text default null,p_latency_ms integer default null,p_output_fingerprint text default null)
returns public.agent_task_steps language plpgsql security definer set search_path to ''
as $function$
declare s public.agent_task_steps; c public.agent_commands;
begin
 select * into s from public.agent_task_steps where id=p_step_id and (owner_user_id=auth.uid() or command_id in (select id from public.agent_commands where requester_user_id=auth.uid())) for update;
 if s.id is null then raise exception 'STEP_NOT_FOUND'; end if;
 select * into c from public.agent_commands where id=s.command_id and (owner_user_id=auth.uid() or requester_user_id=auth.uid());
 if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
 if c.status not in ('running','waiting_approval') then raise exception 'COMMAND_NOT_EXECUTING'; end if;
 if p_status not in ('completed','failed','cancelled','killed','skipped') then raise exception 'STEP_STATUS_INVALID'; end if;
 update public.agent_task_steps set status=p_status,result=coalesce(p_result,'{}'),error_code=p_error_code,error_message=p_error_message,started_at=coalesce(started_at,timezone('utc',now())),completed_at=case when p_status in ('completed','failed','cancelled','killed','skipped') then timezone('utc',now()) else completed_at end where id=s.id returning * into s;
 insert into public.agent_tool_runs(step_id,command_id,agent_id,owner_user_id,tool_key,status,input_fingerprint,result,error_code,error_message,latency_ms,completed_at)
 select s.id,s.command_id,s.agent_id,s.owner_user_id,s.tool_key,p_status,p_output_fingerprint,coalesce(p_result,'{}'),p_error_code,p_error_message,p_latency_ms,case when p_status in ('completed','failed','cancelled','killed','skipped') then timezone('utc',now()) else null end;
 return s;
end;
$function$;

revoke execute on function public.record_agent_tool_result(uuid,text,jsonb,text,text,integer,text) from public;
revoke execute on function public.record_agent_tool_result(uuid,text,jsonb,text,text,integer,text) from anon;
grant execute on function public.record_agent_tool_result(uuid,text,jsonb,text,text,integer,text) to authenticated;
