-- Phase 16 — Workflow & Mission Engine
-- Authoritative orchestration layer over Phase 15 Agent Runtime.

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user','agent')),
  owner_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  trigger_type text not null default 'manual' check (trigger_type in ('manual','event','schedule','webhook')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(owner_type, owner_id, slug)
);

create table if not exists public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  input_schema jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(workflow_id, version_no)
);

create table if not exists public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_version_id uuid not null references public.workflow_versions(id) on delete cascade,
  step_key text not null check (length(trim(step_key)) between 1 and 120),
  title text not null check (length(trim(title)) between 1 and 240),
  description text,
  sequence_no integer not null check (sequence_no > 0),
  tool_key text not null references public.agent_tool_definitions(tool_key),
  arguments jsonb not null default '{}'::jsonb,
  input_schema jsonb not null default '{}'::jsonb,
  condition jsonb not null default '{}'::jsonb,
  retry_policy jsonb not null default '{}'::jsonb,
  risk_level public.risk_level not null default 'low',
  requires_approval boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(workflow_version_id, step_key),
  unique(workflow_version_id, sequence_no)
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete restrict,
  workflow_version_id uuid not null references public.workflow_versions(id) on delete restrict,
  initiated_by_user_id uuid not null references auth.users(id) on delete restrict,
  agent_id uuid not null references public.agents(id) on delete restrict,
  command_id uuid references public.agent_commands(id) on delete set null,
  status text not null default 'created' check (status in ('created','preparing','ready','running','waiting_approval','completed','failed','cancelled','killed')),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc',now()),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.workflow_run_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null references public.workflow_runs(id) on delete cascade,
  workflow_step_id uuid not null references public.workflow_steps(id) on delete restrict,
  agent_task_id uuid references public.agent_tasks(id) on delete set null,
  agent_task_step_id uuid references public.agent_task_steps(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','ready','running','waiting_approval','completed','failed','cancelled','killed')),
  result jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  unique(workflow_run_id, workflow_step_id)
);

create table if not exists public.workflow_events (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid references public.workflow_runs(id) on delete cascade,
  mission_run_id uuid,
  event_type text not null,
  from_status text,
  to_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user','agent')),
  owner_id uuid not null,
  workflow_id uuid not null references public.workflows(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 200),
  description text,
  status text not null default 'draft' check (status in ('draft','open','active','completed','cancelled','archived')),
  visibility text not null default 'public' check (visibility in ('public','private','restricted')),
  join_policy text not null default 'open' check (join_policy in ('open','approval','invite_only')),
  max_participants integer check (max_participants is null or max_participants > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.mission_participants (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  subject_type text not null check (subject_type in ('user','agent')),
  subject_id uuid not null,
  role text not null default 'participant' check (role in ('owner','participant','facilitator')),
  status text not null default 'pending' check (status in ('pending','active','rejected','left','completed','removed')),
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(mission_id, subject_type, subject_id)
);

create table if not exists public.mission_runs (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  participant_id uuid not null references public.mission_participants(id) on delete restrict,
  workflow_run_id uuid references public.workflow_runs(id) on delete set null,
  status text not null default 'created' check (status in ('created','running','waiting_approval','completed','failed','cancelled','killed')),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists workflows_owner_idx on public.workflows(owner_type, owner_id, status);
create index if not exists workflow_versions_workflow_idx on public.workflow_versions(workflow_id, status, version_no desc);
create index if not exists workflow_steps_version_idx on public.workflow_steps(workflow_version_id, sequence_no);
create index if not exists workflow_runs_agent_idx on public.workflow_runs(agent_id, status, created_at desc);
create index if not exists workflow_runs_command_idx on public.workflow_runs(command_id);
create index if not exists workflow_run_steps_run_idx on public.workflow_run_steps(workflow_run_id, status);
create index if not exists workflow_events_run_idx on public.workflow_events(workflow_run_id, created_at desc);
create index if not exists missions_owner_idx on public.missions(owner_type, owner_id, status);
create index if not exists mission_participants_mission_idx on public.mission_participants(mission_id, status);
create index if not exists mission_participants_subject_idx on public.mission_participants(subject_type, subject_id, status);
create index if not exists mission_runs_mission_idx on public.mission_runs(mission_id, status, created_at desc);

alter table public.workflows enable row level security;
alter table public.workflow_versions enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_run_steps enable row level security;
alter table public.workflow_events enable row level security;
alter table public.missions enable row level security;
alter table public.mission_participants enable row level security;
alter table public.mission_runs enable row level security;

create or replace function private.workflow_subject_owned(p_owner_type text, p_owner_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select case
    when p_owner_type='user' then p_owner_id=auth.uid()
    when p_owner_type='agent' then exists(select 1 from public.agents a where a.id=p_owner_id and a.owner_user_id=auth.uid())
    else false
  end
$$;
revoke all on function private.workflow_subject_owned(text,uuid) from public, anon, authenticated;

drop policy if exists workflows_select on public.workflows;
create policy workflows_select on public.workflows for select to authenticated using (private.workflow_subject_owned(owner_type,owner_id) or status='active');
drop policy if exists workflow_versions_select on public.workflow_versions;
create policy workflow_versions_select on public.workflow_versions for select to authenticated using (exists(select 1 from public.workflows w where w.id=workflow_id and (private.workflow_subject_owned(w.owner_type,w.owner_id) or w.status='active')));
drop policy if exists workflow_steps_select on public.workflow_steps;
create policy workflow_steps_select on public.workflow_steps for select to authenticated using (exists(select 1 from public.workflow_versions v join public.workflows w on w.id=v.workflow_id where v.id=workflow_version_id and (private.workflow_subject_owned(w.owner_type,w.owner_id) or w.status='active')));
drop policy if exists workflow_runs_select on public.workflow_runs;
create policy workflow_runs_select on public.workflow_runs for select to authenticated using (initiated_by_user_id=auth.uid());
drop policy if exists workflow_run_steps_select on public.workflow_run_steps;
create policy workflow_run_steps_select on public.workflow_run_steps for select to authenticated using (exists(select 1 from public.workflow_runs r where r.id=workflow_run_id and r.initiated_by_user_id=auth.uid()));
drop policy if exists workflow_events_select on public.workflow_events;
create policy workflow_events_select on public.workflow_events for select to authenticated using (exists(select 1 from public.workflow_runs r where r.id=workflow_run_id and r.initiated_by_user_id=auth.uid()));
drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions for select to authenticated using (private.workflow_subject_owned(owner_type,owner_id) or visibility='public' or exists(select 1 from public.mission_participants mp where mp.mission_id=id and mp.subject_type='user' and mp.subject_id=auth.uid()));
drop policy if exists mission_participants_select on public.mission_participants;
create policy mission_participants_select on public.mission_participants for select to authenticated using (subject_type='user' and subject_id=auth.uid() or exists(select 1 from public.missions m where m.id=mission_id and private.workflow_subject_owned(m.owner_type,m.owner_id)));
drop policy if exists mission_runs_select on public.mission_runs;
create policy mission_runs_select on public.mission_runs for select to authenticated using (exists(select 1 from public.mission_participants mp where mp.id=participant_id and mp.subject_type='user' and mp.subject_id=auth.uid()) or exists(select 1 from public.missions m join public.mission_participants mp on mp.mission_id=m.id where mp.id=participant_id and private.workflow_subject_owned(m.owner_type,m.owner_id)));

revoke all on public.workflows,public.workflow_versions,public.workflow_steps,public.workflow_runs,public.workflow_run_steps,public.workflow_events,public.missions,public.mission_participants,public.mission_runs from anon,authenticated;
grant select on public.workflows,public.workflow_versions,public.workflow_steps,public.workflow_runs,public.workflow_run_steps,public.workflow_events,public.missions,public.mission_participants,public.mission_runs to authenticated;

alter table public.workflow_events add constraint workflow_events_mission_run_fk foreign key (mission_run_id) references public.mission_runs(id) on delete cascade;

create or replace function public.create_workflow(p_owner_type text,p_owner_id uuid,p_name text,p_slug text,p_description text,p_trigger_type text,p_metadata jsonb)
returns public.workflows language plpgsql security definer set search_path='' as $$
declare v public.workflows;
begin
 if auth.uid() is null or not private.workflow_subject_owned(p_owner_type,p_owner_id) then raise exception 'WORKFLOW_OWNER_DENIED'; end if;
 insert into public.workflows(owner_type,owner_id,name,slug,description,trigger_type,metadata) values(p_owner_type,p_owner_id,p_name,p_slug,p_description,p_trigger_type,coalesce(p_metadata,'{}'::jsonb)) returning * into v;
 return v;
end $$;

create or replace function public.create_workflow_version(p_workflow_id uuid,p_input_schema jsonb,p_metadata jsonb)
returns public.workflow_versions language plpgsql security definer set search_path='' as $$
declare v public.workflow_versions; w public.workflows; n int;
begin
 select * into w from public.workflows where id=p_workflow_id;
 if not found or not private.workflow_subject_owned(w.owner_type,w.owner_id) then raise exception 'WORKFLOW_OWNER_DENIED'; end if;
 select coalesce(max(version_no),0)+1 into n from public.workflow_versions where workflow_id=p_workflow_id;
 insert into public.workflow_versions(workflow_id,version_no,input_schema,metadata) values(p_workflow_id,n,coalesce(p_input_schema,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb)) returning * into v;
 return v;
end $$;

create or replace function public.add_workflow_step(p_workflow_version_id uuid,p_step_key text,p_title text,p_description text,p_sequence_no int,p_tool_key text,p_arguments jsonb,p_input_schema jsonb,p_condition jsonb,p_retry_policy jsonb,p_risk_level public.risk_level,p_requires_approval boolean)
returns public.workflow_steps language plpgsql security definer set search_path='' as $$
declare v public.workflow_steps; w public.workflows;
begin
 select w.* into w from public.workflows w join public.workflow_versions x on x.workflow_id=w.id where x.id=p_workflow_version_id;
 if not found or not private.workflow_subject_owned(w.owner_type,w.owner_id) then raise exception 'WORKFLOW_OWNER_DENIED'; end if;
 if exists(select 1 from public.workflow_versions where id=p_workflow_version_id and status='published') then raise exception 'WORKFLOW_VERSION_IMMUTABLE'; end if;
 if not exists(select 1 from public.agent_tool_definitions where tool_key=p_tool_key and enabled=true) then raise exception 'WORKFLOW_TOOL_NOT_AVAILABLE'; end if;
 insert into public.workflow_steps(workflow_version_id,step_key,title,description,sequence_no,tool_key,arguments,input_schema,condition,retry_policy,risk_level,requires_approval)
 values(p_workflow_version_id,p_step_key,p_title,p_description,p_sequence_no,p_tool_key,coalesce(p_arguments,'{}'::jsonb),coalesce(p_input_schema,'{}'::jsonb),coalesce(p_condition,'{}'::jsonb),coalesce(p_retry_policy,'{}'::jsonb),p_risk_level,coalesce(p_requires_approval,false)) returning * into v;
 return v;
end $$;

create or replace function public.publish_workflow_version(p_workflow_version_id uuid)
returns public.workflow_versions language plpgsql security definer set search_path='' as $$
declare v public.workflow_versions; w public.workflows; invalid_count int;
begin
 select * into v from public.workflow_versions where id=p_workflow_version_id;
 select * into w from public.workflows where id=v.workflow_id;
 if not found or not private.workflow_subject_owned(w.owner_type,w.owner_id) then raise exception 'WORKFLOW_OWNER_DENIED'; end if;
 if v.status='published' then return v; end if;
 if not exists(select 1 from public.workflow_steps where workflow_version_id=p_workflow_version_id and enabled=true) then raise exception 'WORKFLOW_NO_STEPS'; end if;
 select count(*) into invalid_count from public.workflow_steps s left join public.agent_tool_definitions t on t.tool_key=s.tool_key where s.workflow_version_id=p_workflow_version_id and s.enabled=true and (t.tool_key is null or t.enabled=false);
 if invalid_count>0 then raise exception 'WORKFLOW_INVALID_TOOL'; end if;
 update public.workflow_versions set status='published',published_at=timezone('utc',now()),updated_at=timezone('utc',now()) where id=p_workflow_version_id returning * into v;
 update public.workflow_versions set status='archived',updated_at=timezone('utc',now()) where workflow_id=v.workflow_id and id<>v.id and status='published';
 update public.workflows set status='active',updated_at=timezone('utc',now()) where id=v.workflow_id;
 return v;
end $$;

create or replace function public.create_workflow_run(p_workflow_version_id uuid,p_agent_id uuid,p_input jsonb)
returns public.workflow_runs language plpgsql security definer set search_path='' as $$
declare r public.workflow_runs; v public.workflow_versions; w public.workflows;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v from public.workflow_versions where id=p_workflow_version_id;
 select * into w from public.workflows where id=v.workflow_id;
 if not found or v.status<>'published' or w.status<>'active' then raise exception 'WORKFLOW_VERSION_NOT_PUBLISHED'; end if;
 if not private.workflow_subject_owned(w.owner_type,w.owner_id) then raise exception 'WORKFLOW_OWNER_DENIED'; end if;
 if not exists(select 1 from public.agents a where a.id=p_agent_id and a.owner_user_id=auth.uid() and a.status not in ('archived','deleted')) then raise exception 'AGENT_OWNERSHIP_DENIED'; end if;
 insert into public.workflow_runs(workflow_id,workflow_version_id,initiated_by_user_id,agent_id,status,input) values(w.id,v.id,auth.uid(),p_agent_id,'preparing',coalesce(p_input,'{}'::jsonb)) returning * into r;
 insert into public.workflow_run_steps(workflow_run_id,workflow_step_id,status) select r.id,s.id,'pending' from public.workflow_steps s where s.workflow_version_id=v.id and s.enabled=true order by s.sequence_no;
 insert into public.workflow_events(workflow_run_id,event_type,to_status,metadata) values(r.id,'workflow_run_created','preparing',jsonb_build_object('workflow_version_id',v.id,'agent_id',p_agent_id));
 return r;
end $$;

create or replace function public.prepare_workflow_run(p_workflow_run_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.workflow_runs; w public.workflows; v public.workflow_versions; c public.agent_commands; plan jsonb; caps text[]; key text; step_count int;
begin
 select * into r from public.workflow_runs where id=p_workflow_run_id;
 if not found or r.initiated_by_user_id<>auth.uid() then raise exception 'WORKFLOW_RUN_ACCESS_DENIED'; end if;
 if r.status not in ('preparing','created') then return jsonb_build_object('workflow_run',to_jsonb(r),'status',r.status,'command_id',r.command_id); end if;
 select * into w from public.workflows where id=r.workflow_id; select * into v from public.workflow_versions where id=r.workflow_version_id;
 select count(*) into step_count from public.workflow_steps where workflow_version_id=v.id and enabled=true; if step_count=0 then raise exception 'WORKFLOW_NO_STEPS'; end if;
 select array_agg(distinct t.capability order by t.capability) into caps from public.workflow_steps s join public.agent_tool_definitions t on t.tool_key=s.tool_key where s.workflow_version_id=v.id and s.enabled=true;
 select jsonb_build_object('risk_level',case when exists(select 1 from public.workflow_steps where workflow_version_id=v.id and enabled=true and risk_level='critical') then 'critical' when exists(select 1 from public.workflow_steps where workflow_version_id=v.id and enabled=true and risk_level='high') then 'high' when exists(select 1 from public.workflow_steps where workflow_version_id=v.id and enabled=true and risk_level='medium') then 'medium' else 'low' end,'requires_approval',exists(select 1 from public.workflow_steps where workflow_version_id=v.id and enabled=true and (requires_approval or risk_level in ('high','critical'))),'tasks',jsonb_build_array(jsonb_build_object('task_key','workflow_'||r.id::text,'title',w.name,'description',coalesce(w.description,'Workflow execution'),'input',r.input,'steps',jsonb_agg(jsonb_build_object('step_key',s.step_key,'tool_key',s.tool_key,'arguments',s.arguments) order by s.sequence_no))) into plan from public.workflow_steps s where s.workflow_version_id=v.id and s.enabled=true;
 c := public.create_agent_command(r.agent_id,'Workflow: '||w.name,coalesce(caps,array[]::text[]),'workflow-run:'||r.id::text);
 perform public.materialize_agent_plan(c.id,plan);
 update public.workflow_runs set command_id=c.id,status='ready' where id=r.id returning * into r;
 update public.workflow_run_steps wrs set status='ready' where wrs.workflow_run_id=r.id;
 insert into public.workflow_events(workflow_run_id,event_type,from_status,to_status,metadata) values(r.id,'workflow_run_prepared','preparing','ready',jsonb_build_object('command_id',c.id));
 return jsonb_build_object('workflow_run',to_jsonb(r),'command_id',c.id,'plan',plan);
exception when others then
 update public.workflow_runs set status='failed',error_code=sqlstate,error_message=sqlerrm,completed_at=timezone('utc',now()) where id=p_workflow_run_id and initiated_by_user_id=auth.uid();
 raise;
end $$;

create or replace function public.sync_workflow_run(p_workflow_run_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.workflow_runs; c public.agent_commands; new_status text;
begin
 select * into r from public.workflow_runs where id=p_workflow_run_id and initiated_by_user_id=auth.uid(); if not found then raise exception 'WORKFLOW_RUN_NOT_FOUND'; end if;
 if r.command_id is null then return jsonb_build_object('workflow_run',to_jsonb(r)); end if;
 select * into c from public.agent_commands where id=r.command_id;
 new_status=case c.status when 'waiting_approval' then 'waiting_approval' when 'running' then 'running' when 'completed' then 'completed' when 'failed' then 'failed' when 'cancelled' then 'cancelled' when 'killed' then 'killed' when 'denied' then 'failed' else r.status end;
 update public.workflow_runs set status=new_status,error_code=c.error_code,error_message=c.error_message,output=case when c.result_summary is not null then jsonb_build_object('summary',c.result_summary) else output end,started_at=coalesce(started_at,c.started_at),completed_at=case when new_status in ('completed','failed','cancelled','killed') then coalesce(completed_at,c.completed_at,timezone('utc',now())) else completed_at end where id=r.id returning * into r;
 update public.workflow_run_steps wrs set status=case ats.status when 'running' then 'running' when 'completed' then 'completed' when 'failed' then 'failed' when 'killed' then 'killed' when 'cancelled' then 'cancelled' when 'waiting_approval' then 'waiting_approval' else wrs.status end,result=ats.result,error_code=ats.error_code,error_message=ats.error_message,started_at=ats.started_at,completed_at=ats.completed_at from public.agent_task_steps ats join public.agent_tasks at on at.id=ats.task_id where wrs.workflow_run_id=r.id and at.command_id=r.command_id and ats.step_key=(select s.step_key from public.workflow_steps s where s.id=wrs.workflow_step_id);
 return jsonb_build_object('workflow_run',to_jsonb(r),'command',to_jsonb(c));
end $$;

create or replace function public.create_mission(p_owner_type text,p_owner_id uuid,p_workflow_id uuid,p_name text,p_description text,p_visibility text,p_join_policy text,p_max_participants int,p_metadata jsonb)
returns public.missions language plpgsql security definer set search_path='' as $$
declare m public.missions;
begin
 if not private.workflow_subject_owned(p_owner_type,p_owner_id) then raise exception 'MISSION_OWNER_DENIED'; end if;
 if not exists(select 1 from public.workflows w where w.id=p_workflow_id and (private.workflow_subject_owned(w.owner_type,w.owner_id) or w.status='active')) then raise exception 'MISSION_WORKFLOW_UNAVAILABLE'; end if;
 insert into public.missions(owner_type,owner_id,workflow_id,name,description,visibility,join_policy,max_participants,metadata) values(p_owner_type,p_owner_id,p_workflow_id,p_name,p_description,p_visibility,p_join_policy,p_max_participants,coalesce(p_metadata,'{}'::jsonb)) returning * into m;
 return m;
end $$;

create or replace function public.join_mission(p_mission_id uuid,p_subject_type text,p_subject_id uuid)
returns public.mission_participants language plpgsql security definer set search_path='' as $$
declare m public.missions; p public.mission_participants; s uuid; st text;
begin
 select * into m from public.missions where id=p_mission_id; if not found then raise exception 'MISSION_NOT_FOUND'; end if;
 if p_subject_type='user' then s=auth.uid(); if p_subject_id<>auth.uid() then raise exception 'MISSION_SUBJECT_DENIED'; end if; else s=p_subject_id; if not exists(select 1 from public.agents a where a.id=s and a.owner_user_id=auth.uid()) then raise exception 'MISSION_AGENT_OWNERSHIP_DENIED'; end if; end if;
 if m.status<>'open' or m.join_policy='invite_only' then raise exception 'MISSION_NOT_OPEN'; end if;
 if m.max_participants is not null and (select count(*) from public.mission_participants where mission_id=m.id and status='active')>=m.max_participants then raise exception 'MISSION_CAPACITY_REACHED'; end if;
 st=case when m.join_policy='open' then 'active' else 'pending' end;
 insert into public.mission_participants(mission_id,subject_type,subject_id,role,status,joined_at) values(m.id,p_subject_type,s,'participant',st,case when st='active' then timezone('utc',now()) end) on conflict(mission_id,subject_type,subject_id) do update set status=excluded.status,joined_at=excluded.joined_at,updated_at=timezone('utc',now()) returning * into p;
 return p;
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
 wr:=public.create_workflow_run(v.id,p_agent_id,coalesce(p_input,'{}'::jsonb));
 update public.mission_runs set workflow_run_id=wr.id,status='running',started_at=timezone('utc',now()) where id=r.id returning * into r;
 insert into public.workflow_events(workflow_run_id,mission_run_id,event_type,to_status,metadata) values(wr.id,r.id,'mission_run_started','running',jsonb_build_object('mission_id',m.id,'participant_id',p.id));
 return jsonb_build_object('mission_run',to_jsonb(r),'workflow_run',to_jsonb(wr));
end $$;

create or replace function public.sync_mission_run(p_mission_run_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare mr public.mission_runs; wr public.workflow_runs; ns text;
begin
 select * into mr from public.mission_runs where id=p_mission_run_id; if not found then raise exception 'MISSION_RUN_NOT_FOUND'; end if;
 if not exists(select 1 from public.mission_participants p where p.id=mr.participant_id and ((p.subject_type='user' and p.subject_id=auth.uid()) or exists(select 1 from public.missions m where m.id=p.mission_id and private.workflow_subject_owned(m.owner_type,m.owner_id)))) then raise exception 'MISSION_RUN_ACCESS_DENIED'; end if;
 select * into wr from public.workflow_runs where id=mr.workflow_run_id; if not found then return jsonb_build_object('mission_run',to_jsonb(mr)); end if;
 ns=case wr.status when 'waiting_approval' then 'waiting_approval' when 'running' then 'running' when 'completed' then 'completed' when 'failed' then 'failed' when 'cancelled' then 'cancelled' when 'killed' then 'killed' else mr.status end;
 update public.mission_runs set status=ns,output=wr.output,completed_at=case when ns in ('completed','failed','cancelled','killed') then coalesce(completed_at,wr.completed_at,timezone('utc',now())) else completed_at end where id=mr.id returning * into mr;
 return jsonb_build_object('mission_run',to_jsonb(mr),'workflow_run',to_jsonb(wr));
end $$;

revoke all on function public.create_workflow(text,uuid,text,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.create_workflow_version(uuid,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.add_workflow_step(uuid,text,text,text,int,text,jsonb,jsonb,jsonb,jsonb,public.risk_level,boolean) from public,anon,authenticated;
revoke all on function public.publish_workflow_version(uuid) from public,anon,authenticated;
revoke all on function public.create_workflow_run(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.prepare_workflow_run(uuid) from public,anon,authenticated;
revoke all on function public.sync_workflow_run(uuid) from public,anon,authenticated;
revoke all on function public.create_mission(text,uuid,uuid,text,text,text,text,int,jsonb) from public,anon,authenticated;
revoke all on function public.join_mission(uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.start_mission_run(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.sync_mission_run(uuid) from public,anon,authenticated;
grant execute on function public.create_workflow(text,uuid,text,text,text,text,jsonb) to authenticated;
grant execute on function public.create_workflow_version(uuid,jsonb,jsonb) to authenticated;
grant execute on function public.add_workflow_step(uuid,text,text,text,int,text,jsonb,jsonb,jsonb,jsonb,public.risk_level,boolean) to authenticated;
grant execute on function public.publish_workflow_version(uuid) to authenticated;
grant execute on function public.create_workflow_run(uuid,uuid,jsonb) to authenticated;
grant execute on function public.prepare_workflow_run(uuid) to authenticated;
grant execute on function public.sync_workflow_run(uuid) to authenticated;
grant execute on function public.create_mission(text,uuid,uuid,text,text,text,text,int,jsonb) to authenticated;
grant execute on function public.join_mission(uuid,text,uuid) to authenticated;
grant execute on function public.start_mission_run(uuid,uuid,uuid,jsonb) to authenticated;
grant execute on function public.sync_mission_run(uuid) to authenticated;

-- Functions are SECURITY DEFINER; pin the search path to avoid shadowing attacks.
alter function public.create_workflow(text,uuid,text,text,text,text,jsonb) set search_path='';
alter function public.create_workflow_version(uuid,jsonb,jsonb) set search_path='';
alter function public.add_workflow_step(uuid,text,text,text,int,text,jsonb,jsonb,jsonb,jsonb,public.risk_level,boolean) set search_path='';
alter function public.publish_workflow_version(uuid) set search_path='';
alter function public.create_workflow_run(uuid,uuid,jsonb) set search_path='';
alter function public.prepare_workflow_run(uuid) set search_path='';
alter function public.sync_workflow_run(uuid) set search_path='';
alter function public.create_mission(text,uuid,uuid,text,text,text,text,int,jsonb) set search_path='';
alter function public.join_mission(uuid,text,uuid) set search_path='';
alter function public.start_mission_run(uuid,uuid,uuid,jsonb) set search_path='';
alter function public.sync_mission_run(uuid) set search_path='';
