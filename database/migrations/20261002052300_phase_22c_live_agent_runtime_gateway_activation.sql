-- Phase 22C — Live Agent Runtime / AI Gateway Activation
alter table public.agent_commands add column if not exists live_session_id uuid references public.live_sessions(id) on delete set null, add column if not exists live_collaboration_id uuid references public.live_agent_collaborations(id) on delete set null, add column if not exists command_source text not null default 'direct';
alter table public.agent_commands drop constraint if exists agent_commands_command_source_check;
alter table public.agent_commands add constraint agent_commands_command_source_check check (command_source in ('direct','live'));
create index if not exists agent_commands_live_session_idx on public.agent_commands(live_session_id);
create index if not exists agent_commands_live_collaboration_idx on public.agent_commands(live_collaboration_id);
create or replace function public.create_live_agent_command(p_collaboration_id uuid,p_command_text text,p_requested_capabilities text[] default '{}'::text[],p_idempotency_key text default null) returns public.agent_commands language plpgsql security definer set search_path to '' as $$
declare c public.live_agent_collaborations; s public.live_sessions; v public.agent_commands;
begin
 select * into c from public.live_agent_collaborations where id=p_collaboration_id and owner_user_id=(select auth.uid()) for update;
 if c.id is null then raise exception 'LIVE_COLLAB_NOT_FOUND_OR_NOT_OWNED'; end if;
 if c.status <> 'active' or c.consent_status <> 'approved' or c.risk_decision <> 'allow' then raise exception 'LIVE_COLLAB_NOT_ACTIVE'; end if;
 select * into s from public.live_sessions where id=c.live_session_id and host_user_id=(select auth.uid());
 if s.id is null or s.status not in ('scheduled','live') then raise exception 'LIVE_SESSION_NOT_EXECUTABLE'; end if;
 select public.create_agent_command(c.agent_id,trim(p_command_text),coalesce(p_requested_capabilities,'{}'),p_idempotency_key) into v;
 update public.agent_commands set live_session_id=s.id,live_collaboration_id=c.id,command_source='live' where id=v.id returning * into v;
 return v;
end; $$;
create or replace function public.begin_agent_execution(p_command_id uuid) returns jsonb language plpgsql security definer set search_path to '' as $$
declare c public.agent_commands; a public.agents; pol public.agent_policies; ks public.agent_kill_switches; lc public.live_agent_collaborations; approval_id uuid; need_approval boolean:=false; policy_rules jsonb;
begin
 select * into c from public.agent_commands where id=p_command_id and owner_user_id=(select auth.uid()) for update;
 if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
 if c.status <> 'ready' then raise exception 'COMMAND_NOT_READY'; end if;
 if c.command_source='live' then
   select * into lc from public.live_agent_collaborations where id=c.live_collaboration_id and owner_user_id=(select auth.uid());
   if lc.id is null or lc.status<>'active' or lc.consent_status<>'approved' or lc.risk_decision<>'allow' then raise exception 'LIVE_COLLAB_NOT_ACTIVE'; end if;
   if lc.live_session_id<>c.live_session_id then raise exception 'LIVE_COMMAND_CONTEXT_MISMATCH'; end if;
 end if;
 select * into a from public.agents where id=c.agent_id and owner_user_id=(select auth.uid());
 if a.id is null or a.status <> 'active' then raise exception 'AGENT_NOT_ACTIVE'; end if;
 select * into ks from public.agent_kill_switches where agent_id=c.agent_id;
 if coalesce(ks.enabled,false) then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;
 select * into pol from public.agent_policies where agent_id=c.agent_id and enabled=true order by policy_version desc limit 1;
 policy_rules:=coalesce(pol.rules,'{}'::jsonb);
 need_approval := exists(select 1 from public.agent_task_steps where command_id=c.id and requires_approval=true) or c.risk_level in ('high','critical') or c.autonomy_level='recommend' or (c.autonomy_level='assist' and c.risk_level in ('medium','high','critical')) or (c.autonomy_level='semi_autonomous' and c.risk_level in ('high','critical')) or coalesce((policy_rules->'approval_required_risk_levels') ? c.risk_level::text,false);
 insert into public.risk_assessments(actor_user_id,actor_agent_id,action,resource_type,resource_id,risk_level,decision,factors,policy_version) values((select auth.uid()),c.agent_id,'agent.execute','agent_command',c.id,c.risk_level,case when need_approval then 'approval_required' else 'allow' end,jsonb_build_object('autonomy_level',c.autonomy_level,'command_id',c.id,'command_source',c.command_source,'live_session_id',c.live_session_id,'live_collaboration_id',c.live_collaboration_id,'policy_rules',policy_rules),pol.policy_version);
 if need_approval then
   insert into public.approval_requests(requester_user_id,requester_agent_id,action,resource_type,resource_id,status,risk_level,payload,expires_at) values((select auth.uid()),c.agent_id,'agent.execute','agent_command',c.id,'pending'::public.approval_status,c.risk_level,jsonb_build_object('command_id',c.id,'command_text',c.command_text,'risk_level',c.risk_level,'correlation_id',c.correlation_id,'live_session_id',c.live_session_id),timezone('utc',now())+interval '24 hours') returning id into approval_id;
   update public.agent_commands set status='waiting_approval',risk_decision='approval_required' where id=c.id;
   update public.agent_execution_contexts set state='waiting_approval',updated_at=timezone('utc',now()) where command_id=c.id;
   insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata) values(c.id,c.agent_id,(select auth.uid()),'approval_requested','ready','waiting_approval',jsonb_build_object('approval_id',approval_id,'live_session_id',c.live_session_id,'live_collaboration_id',c.live_collaboration_id));
   return jsonb_build_object('status','waiting_approval','approval_id',approval_id,'command_id',c.id);
 end if;
 update public.agent_commands set status='running',risk_decision='allow',started_at=timezone('utc',now()) where id=c.id;
 update public.agent_execution_contexts set state='running',updated_at=timezone('utc',now()) where command_id=c.id;
 insert into public.agent_runtime_events(command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata) values(c.id,c.agent_id,(select auth.uid()),'execution_started','ready','running',jsonb_build_object('live_session_id',c.live_session_id,'live_collaboration_id',c.live_collaboration_id));
 return jsonb_build_object('status','running','command_id',c.id);
end; $$;
revoke all on function public.create_live_agent_command(uuid,text,text[],text) from public,anon,authenticated;
grant execute on function public.create_live_agent_command(uuid,text,text[],text) to authenticated;