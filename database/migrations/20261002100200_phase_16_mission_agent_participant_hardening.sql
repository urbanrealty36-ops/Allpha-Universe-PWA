create or replace function public.start_mission_run(p_mission_id uuid,p_participant_id uuid,p_agent_id uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.missions; p public.mission_participants; v public.workflow_versions; r public.mission_runs; wr public.workflow_runs;
begin
 select * into m from public.missions where id=p_mission_id; if not found then raise exception 'MISSION_NOT_FOUND'; end if;
 select * into p from public.mission_participants where id=p_participant_id and mission_id=m.id and status='active'; if not found then raise exception 'MISSION_PARTICIPANT_NOT_ACTIVE'; end if;
 if not (private.workflow_subject_owned(m.owner_type,m.owner_id) or (p.subject_type='user' and p.subject_id=auth.uid()) or (p.subject_type='agent' and exists(select 1 from public.agents a where a.id=p.subject_id and a.owner_user_id=auth.uid()))) then raise exception 'MISSION_ACCESS_DENIED'; end if;
 select * into v from public.workflow_versions where workflow_id=m.workflow_id and status='published' order by version_no desc limit 1; if not found then raise exception 'MISSION_WORKFLOW_NOT_PUBLISHED'; end if;
 if not exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=auth.uid()) then raise exception 'AGENT_OWNERSHIP_DENIED'; end if;
 insert into public.mission_runs(mission_id,participant_id,status,input) values(m.id,p.id,'created',coalesce(p_input,'{}'::jsonb)) returning * into r;
 wr:=public.create_shared_workflow_run(m.id,p.id,v.id,p_agent_id,coalesce(p_input,'{}'::jsonb));
 update public.mission_runs set workflow_run_id=wr.id,status='running',started_at=timezone('utc',now()) where id=r.id returning * into r;
 insert into public.workflow_events(workflow_run_id,mission_run_id,event_type,to_status,metadata) values(wr.id,r.id,'mission_run_started','running',jsonb_build_object('mission_id',m.id,'participant_id',p.id));
 return jsonb_build_object('mission_run',to_jsonb(r),'workflow_run',to_jsonb(wr));
end $$;
alter function public.start_mission_run(uuid,uuid,uuid,jsonb) set search_path='';
