-- Phase 16 hardening: shared mission workflow runs and mission lifecycle/approval.

create or replace function public.publish_mission(p_mission_id uuid)
returns public.missions language plpgsql security definer set search_path='' as $$
declare m public.missions;
begin
 select * into m from public.missions where id=p_mission_id;
 if not found or not private.workflow_subject_owned(m.owner_type,m.owner_id) then raise exception 'MISSION_OWNER_DENIED'; end if;
 if not exists(select 1 from public.workflows w where w.id=m.workflow_id and w.status='active' and exists(select 1 from public.workflow_versions v where v.workflow_id=w.id and v.status='published')) then raise exception 'MISSION_WORKFLOW_NOT_READY'; end if;
 update public.missions set status='open',updated_at=timezone('utc',now()) where id=m.id returning * into m;
 return m;
end $$;

create or replace function public.decide_mission_participant(p_participant_id uuid,p_decision text)
returns public.mission_participants language plpgsql security definer set search_path='' as $$
declare p public.mission_participants; m public.missions; next_status text;
begin
 select * into p from public.mission_participants where id=p_participant_id;
 if not found then raise exception 'MISSION_PARTICIPANT_NOT_FOUND'; end if;
 select * into m from public.missions where id=p.mission_id;
 if not private.workflow_subject_owned(m.owner_type,m.owner_id) and not exists(select 1 from public.mission_participants f where f.mission_id=m.id and f.subject_type='user' and f.subject_id=auth.uid() and f.role='facilitator' and f.status='active') then raise exception 'MISSION_MODERATION_DENIED'; end if;
 if p.status<>'pending' then raise exception 'MISSION_PARTICIPANT_NOT_PENDING'; end if;
 next_status=case p_decision when 'approve' then 'active' when 'reject' then 'rejected' else null end;
 if next_status is null then raise exception 'MISSION_DECISION_INVALID'; end if;
 update public.mission_participants set status=next_status,joined_at=case when next_status='active' then timezone('utc',now()) else joined_at end,updated_at=timezone('utc',now()) where id=p.id returning * into p;
 return p;
end $$;

create or replace function public.create_shared_workflow_run(p_mission_id uuid,p_participant_id uuid,p_workflow_version_id uuid,p_agent_id uuid,p_input jsonb)
returns public.workflow_runs language plpgsql security definer set search_path='' as $$
declare r public.workflow_runs; m public.missions; p public.mission_participants; v public.workflow_versions; w public.workflows;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into m from public.missions where id=p_mission_id;
 select * into p from public.mission_participants where id=p_participant_id and mission_id=p_mission_id and status='active';
 select * into v from public.workflow_versions where id=p_workflow_version_id and status='published';
 select * into w from public.workflows where id=v.workflow_id;
 if not found or m.status not in ('open','active') or p.id is null or v.id is null then raise exception 'MISSION_WORKFLOW_ACCESS_DENIED'; end if;
 if not (private.workflow_subject_owned(m.owner_type,m.owner_id) or (p.subject_type='user' and p.subject_id=auth.uid()) or (p.subject_type='agent' and exists(select 1 from public.agents a where a.id=p.subject_id and a.owner_user_id=auth.uid()))) then raise exception 'MISSION_WORKFLOW_ACCESS_DENIED'; end if;
 if not exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=auth.uid() and a.status not in ('archived','deleted')) then raise exception 'AGENT_OWNERSHIP_DENIED'; end if;
 if v.workflow_id<>m.workflow_id then raise exception 'MISSION_WORKFLOW_MISMATCH'; end if;
 insert into public.workflow_runs(workflow_id,workflow_version_id,initiated_by_user_id,agent_id,status,input) values(w.id,v.id,auth.uid(),p_agent_id,'preparing',coalesce(p_input,'{}'::jsonb)) returning * into r;
 insert into public.workflow_run_steps(workflow_run_id,workflow_step_id,status) select r.id,s.id,'pending' from public.workflow_steps s where s.workflow_version_id=v.id and s.enabled=true order by s.sequence_no;
 insert into public.workflow_events(workflow_run_id,event_type,to_status,metadata) values(r.id,'mission_workflow_run_created','preparing',jsonb_build_object('mission_id',m.id,'participant_id',p.id));
 return r;
end $$;

create or replace function public.start_mission_run(p_mission_id uuid,p_participant_id uuid,p_agent_id uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.missions; p public.mission_participants; v public.workflow_versions; r public.mission_runs; wr public.workflow_runs;
begin
 select * into m from public.missions where id=p_mission_id; if not found then raise exception 'MISSION_NOT_FOUND'; end if;
 if not (private.workflow_subject_owned(m.owner_type,m.owner_id) or exists(select 1 from public.mission_participants x where x.id=p_participant_id and x.subject_type='user' and x.subject_id=auth.uid())) then raise exception 'MISSION_ACCESS_DENIED'; end if;
 select * into p from public.mission_participants where id=p_participant_id and mission_id=m.id and status='active'; if not found then raise exception 'MISSION_PARTICIPANT_NOT_ACTIVE'; end if;
 select * into v from public.workflow_versions where workflow_id=m.workflow_id and status='published' order by version_no desc limit 1; if not found then raise exception 'MISSION_WORKFLOW_NOT_PUBLISHED'; end if;
 if not exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=auth.uid()) then raise exception 'AGENT_OWNERSHIP_DENIED'; end if;
 insert into public.mission_runs(mission_id,participant_id,status,input) values(m.id,p.id,'created',coalesce(p_input,'{}'::jsonb)) returning * into r;
 wr:=public.create_shared_workflow_run(m.id,p.id,v.id,p_agent_id,coalesce(p_input,'{}'::jsonb));
 update public.mission_runs set workflow_run_id=wr.id,status='running',started_at=timezone('utc',now()) where id=r.id returning * into r;
 insert into public.workflow_events(workflow_run_id,mission_run_id,event_type,to_status,metadata) values(wr.id,r.id,'mission_run_started','running',jsonb_build_object('mission_id',m.id,'participant_id',p.id));
 return jsonb_build_object('mission_run',to_jsonb(r),'workflow_run',to_jsonb(wr));
end $$;

revoke all on function public.publish_mission(uuid) from public,anon,authenticated;
revoke all on function public.decide_mission_participant(uuid,text) from public,anon,authenticated;
revoke all on function public.create_shared_workflow_run(uuid,uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.publish_mission(uuid) to authenticated;
grant execute on function public.decide_mission_participant(uuid,text) to authenticated;
-- create_shared_workflow_run is an internal SECURITY DEFINER helper; it is intentionally not exposed to PostgREST.
alter function public.publish_mission(uuid) set search_path='';
alter function public.decide_mission_participant(uuid,text) set search_path='';
alter function public.create_shared_workflow_run(uuid,uuid,uuid,uuid,jsonb) set search_path='';
