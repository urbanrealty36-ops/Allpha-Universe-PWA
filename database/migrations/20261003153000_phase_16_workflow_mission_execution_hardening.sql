-- Phase 16 Workflow & Mission Engine v3 execution hardening
-- Cancellation delegates command authority to Phase 15 Agent Runtime.
-- No seed/business data.
create or replace function public.cancel_workflow_run(p_workflow_run_id uuid,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare r public.workflow_runs; previous_status text;
begin
 select * into r from public.workflow_runs where id=p_workflow_run_id and initiated_by_user_id=(select auth.uid()) for update;
 if r.id is null then raise exception 'WORKFLOW_RUN_NOT_FOUND'; end if;
 if r.status not in ('preparing','created','ready','waiting_approval','running') then raise exception 'WORKFLOW_RUN_NOT_CANCELLABLE'; end if;
 if r.command_id is null then
   update public.workflow_runs set status='cancelled',error_code='WORKFLOW_RUN_CANCELLED',error_message=coalesce(p_reason,'Cancelled by owner'),completed_at=timezone('utc',now()) where id=r.id returning * into r;
 else
   select status into previous_status from public.agent_commands where id=r.command_id and owner_user_id=(select auth.uid());
   if previous_status is null then raise exception 'WORKFLOW_COMMAND_ACCESS_DENIED'; end if;
   perform public.cancel_agent_command(r.command_id,p_reason);
   update public.workflow_runs set status='cancelled',error_code='WORKFLOW_RUN_CANCELLED',error_message=coalesce(p_reason,'Cancelled by owner'),completed_at=timezone('utc',now()) where id=r.id returning * into r;
 end if;
 update public.workflow_run_steps set status='cancelled',completed_at=timezone('utc',now()) where workflow_run_id=r.id and status in ('pending','ready','running','waiting_approval');
 insert into public.workflow_events(workflow_run_id,event_type,from_status,to_status,metadata) values(r.id,'workflow_run_cancelled',previous_status,'cancelled',jsonb_build_object('reason',p_reason));
 return jsonb_build_object('workflow_run',to_jsonb(r));
end;$function$;

create or replace function public.cancel_mission_run(p_mission_run_id uuid,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare mr public.mission_runs;
begin
 select * into mr from public.mission_runs where id=p_mission_run_id for update;
 if mr.id is null then raise exception 'MISSION_RUN_NOT_FOUND'; end if;
 if not exists(select 1 from public.mission_participants p where p.id=mr.participant_id and ((p.subject_type='user' and p.subject_id=(select auth.uid())) or exists(select 1 from public.missions m where m.id=p.mission_id and private.workflow_subject_owned(m.owner_type,m.owner_id)))) then raise exception 'MISSION_RUN_ACCESS_DENIED'; end if;
 if mr.workflow_run_id is not null then perform public.cancel_workflow_run(mr.workflow_run_id,p_reason); end if;
 update public.mission_runs set status='cancelled',completed_at=coalesce(completed_at,timezone('utc',now())) where id=mr.id returning * into mr;
 return jsonb_build_object('mission_run',to_jsonb(mr));
end;$function$;

revoke execute on function public.cancel_workflow_run(uuid,text) from public,anon;
grant execute on function public.cancel_workflow_run(uuid,text) to authenticated;
revoke execute on function public.cancel_mission_run(uuid,text) from public,anon;
grant execute on function public.cancel_mission_run(uuid,text) to authenticated;
