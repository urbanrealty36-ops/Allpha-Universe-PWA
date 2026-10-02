drop policy if exists workflows_select on public.workflows;
create policy workflows_select on public.workflows for select to authenticated using (private.workflow_subject_owned(owner_type,owner_id));
drop policy if exists workflow_versions_select on public.workflow_versions;
create policy workflow_versions_select on public.workflow_versions for select to authenticated using (exists(select 1 from public.workflows w where w.id=workflow_id and private.workflow_subject_owned(w.owner_type,w.owner_id)));
drop policy if exists workflow_steps_select on public.workflow_steps;
create policy workflow_steps_select on public.workflow_steps for select to authenticated using (exists(select 1 from public.workflow_versions v join public.workflows w on w.id=v.workflow_id where v.id=workflow_version_id and private.workflow_subject_owned(w.owner_type,w.owner_id)));

create or replace function public.create_mission(p_owner_type text,p_owner_id uuid,p_workflow_id uuid,p_name text,p_description text,p_visibility text,p_join_policy text,p_max_participants int,p_metadata jsonb)
returns public.missions language plpgsql security definer set search_path='' as $$
declare m public.missions;
begin
 if not private.workflow_subject_owned(p_owner_type,p_owner_id) then raise exception 'MISSION_OWNER_DENIED'; end if;
 if not exists(select 1 from public.workflows w where w.id=p_workflow_id and private.workflow_subject_owned(w.owner_type,w.owner_id) and w.status='active' and exists(select 1 from public.workflow_versions v where v.workflow_id=w.id and v.status='published')) then raise exception 'MISSION_WORKFLOW_UNAVAILABLE'; end if;
 insert into public.missions(owner_type,owner_id,workflow_id,name,description,visibility,join_policy,max_participants,metadata) values(p_owner_type,p_owner_id,p_workflow_id,p_name,p_description,p_visibility,p_join_policy,p_max_participants,coalesce(p_metadata,'{}'::jsonb)) returning * into m;
 return m;
end $$;
alter function public.create_mission(text,uuid,uuid,text,text,text,text,integer,jsonb) set search_path='';
