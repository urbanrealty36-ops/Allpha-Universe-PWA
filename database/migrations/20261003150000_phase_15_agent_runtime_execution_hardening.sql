-- Phase 15 Agent Runtime & Execution hardening
-- Canonical runtime remains Agent Runtime -> Policy/Risk/Approval -> AI Gateway.
-- No business seed data.

create or replace function public.resume_agent_after_approval(p_command_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  c public.agent_commands;
  a public.agents;
  pol public.agent_policies;
  ks public.agent_kill_switches;
  ap public.approval_requests;
  current_caps text[];
  policy_rules jsonb;
begin
  select * into c from public.agent_commands where id=p_command_id and owner_user_id=(select auth.uid()) for update;
  if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
  if c.status <> 'waiting_approval' then raise exception 'COMMAND_NOT_WAITING_APPROVAL'; end if;
  select * into ap from public.approval_requests where resource_id=c.id and resource_type='agent_command' and requester_user_id=(select auth.uid()) order by created_at desc limit 1 for update;
  if ap.id is null then raise exception 'APPROVAL_NOT_FOUND'; end if;
  if ap.status <> 'approved'::public.approval_status then raise exception 'APPROVAL_NOT_GRANTED'; end if;
  if ap.expires_at is not null and ap.expires_at <= timezone('utc',now()) then
    update public.approval_requests set status='expired'::public.approval_status, decided_at=coalesce(decided_at,timezone('utc',now())) where id=ap.id;
    raise exception 'APPROVAL_EXPIRED';
  end if;
  select * into a from public.agents where id=c.agent_id and owner_user_id=(select auth.uid());
  if a.id is null or a.status <> 'active' then raise exception 'AGENT_NOT_ACTIVE'; end if;
  select * into ks from public.agent_kill_switches where agent_id=c.agent_id;
  if coalesce(ks.enabled,false) then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
  select * into pol from public.agent_policies where agent_id=c.agent_id and enabled=true order by policy_version desc limit 1;
  if pol.id is null then raise exception 'AGENT_POLICY_REQUIRED'; end if;
  policy_rules:=coalesce(pol.rules,'{}'::jsonb);
  select coalesce(array_agg(ac.capability order by ac.capability),'{}'::text[]) into current_caps
  from public.agent_capabilities ac where ac.agent_id=c.agent_id and ac.enabled=true;
  if exists(select 1 from unnest(coalesce(c.requested_capabilities,'{}'::text[])) x where not (x=any(current_caps))) then raise exception 'AGENT_CAPABILITY_REVOKED'; end if;
  insert into public.risk_assessments(actor_user_id,actor_agent_id,action,resource_type,resource_id,risk_level,decision,factors,policy_version)
  values((select auth.uid()),c.agent_id,'agent.execute.recheck','agent_command',c.id,c.risk_level,'allow',
    jsonb_build_object('approval_id',ap.id,'approval_recheck',true,'execution_recheck',true,'policy_rules',policy_rules,'policy_version',pol.policy_version),pol.policy_version);
  update public.agent_commands set status='running',risk_decision='allow',policy_version=pol.policy_version,started_at=coalesce(started_at,timezone('utc',now())) where id=c.id;
  update public.agent_execution_contexts set state='running',policy_snapshot=coalesce(to_jsonb(pol),'{}'::jsonb),updated_at=timezone('utc',now()) where command_id=c.id;
  insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata)
  values(c.id,c.agent_id,(select auth.uid()),'approval_resumed','waiting_approval','running',jsonb_build_object('approval_id',ap.id,'policy_version',pol.policy_version,'execution_recheck',true));
  return jsonb_build_object('status','running','command_id',c.id,'approval_id',ap.id);
end;
$function$;

create or replace function public.cancel_agent_command(p_command_id uuid, p_reason text default null)
returns public.agent_commands
language plpgsql
security definer
set search_path = ''
as $function$
declare c public.agent_commands; previous_status text;
begin
  select * into c from public.agent_commands where id=p_command_id and owner_user_id=(select auth.uid()) for update;
  if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
  if c.status not in ('planning','ready','waiting_approval','running') then raise exception 'COMMAND_NOT_CANCELLABLE'; end if;
  previous_status:=c.status;
  update public.agent_commands set status='cancelled',error_code='AGENT_COMMAND_CANCELLED',error_message=coalesce(p_reason,'Cancelled by owner'),completed_at=timezone('utc',now()) where id=c.id returning * into c;
  update public.agent_execution_contexts set state='cancelled',updated_at=timezone('utc',now()) where command_id=c.id;
  update public.agent_tasks set status='cancelled',completed_at=timezone('utc',now()) where command_id=c.id and status in ('pending','ready','running','waiting_approval');
  update public.agent_task_steps set status='cancelled',completed_at=timezone('utc',now()) where command_id=c.id and status in ('pending','ready','running','waiting_approval');
  insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata)
  values(c.id,c.agent_id,(select auth.uid()),'command_cancelled',previous_status,'cancelled',jsonb_build_object('reason',p_reason));
  return c;
end;
$function$;

revoke execute on function public.cancel_agent_command(uuid,text) from public, anon;
grant execute on function public.cancel_agent_command(uuid,text) to authenticated;
