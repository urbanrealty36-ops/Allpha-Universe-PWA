-- Phase 23D — approved collaboration agreement execution binding
alter table public.agent_commands
  add column if not exists collaboration_agreement_id uuid
  references public.agent_collaboration_agreements(id) on delete restrict;

create index if not exists agent_commands_collaboration_agreement_idx
  on public.agent_commands(collaboration_agreement_id);

create or replace function public.create_collaboration_execution_command(
  p_agreement_id uuid,
  p_command_text text,
  p_requested_capabilities text[] default '{}',
  p_idempotency_key text default null
) returns public.agent_commands
language plpgsql
security definer
set search_path=''
as $function$
declare
  a public.agent_collaboration_agreements;
  c public.agent_commands;
  requester public.agents;
  target public.agents;
  v_caps text[];
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into a
  from public.agent_collaboration_agreements
  where id=p_agreement_id
    and state='approved'
    and (requester_owner_user_id=(select auth.uid()) or target_owner_user_id=(select auth.uid()))
  for update;
  if a.id is null then raise exception 'COLLABORATION_AGREEMENT_NOT_APPROVED'; end if;
  if a.expires_at is not null and a.expires_at <= timezone('utc',now()) then
    update public.agent_collaboration_agreements
      set state='expired',closed_at=timezone('utc',now()),updated_at=timezone('utc',now())
      where id=a.id;
    raise exception 'COLLABORATION_AGREEMENT_EXPIRED';
  end if;

  select * into requester from public.agents where id=a.requester_agent_id and status='active';
  select * into target from public.agents where id=a.target_agent_id and status='active';
  if requester.id is null or target.id is null then raise exception 'COLLABORATION_AGENT_NOT_ACTIVE'; end if;

  -- The authenticated owner must own one of the collaborating Agents.
  -- The execution Agent is selected explicitly from the agreement participants.
  if (select auth.uid())=requester.owner_user_id then
    if not (requester.id = a.requester_agent_id) then raise exception 'COLLABORATION_REQUESTER_BINDING_INVALID'; end if;
  elsif (select auth.uid())=target.owner_user_id then
    if not (target.id = a.target_agent_id) then raise exception 'COLLABORATION_TARGET_BINDING_INVALID'; end if;
  else
    raise exception 'COLLABORATION_OWNER_REQUIRED';
  end if;

  v_caps:=coalesce(p_requested_capabilities,'{}'::text[]);
  if exists(select 1 from unnest(v_caps) c where not (c=any(a.requested_capabilities))) then
    raise exception 'EXECUTION_CAPABILITY_OUTSIDE_AGREEMENT';
  end if;

  c:=public.create_agent_command(
    case when (select auth.uid())=requester.owner_user_id then requester.id else target.id end,
    trim(p_command_text),
    v_caps,
    p_idempotency_key
  );

  update public.agent_commands
  set collaboration_agreement_id=a.id,
      command_source='collaboration'
  where id=c.id
  returning * into c;

  insert into public.agent_runtime_events(
    command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata
  ) values(
    c.id,c.agent_id,c.owner_user_id,'collaboration_agreement_bound','planning','planning',
    jsonb_build_object(
      'agreement_id',a.id,
      'agreement_version',a.version,
      'agreement_state',a.state,
      'agreement_policy_versions',jsonb_build_object(
        'requester',a.requester_policy_version,
        'target',a.target_policy_version
      )
    )
  );
  return c;
end;
$function$;

revoke execute on function public.create_collaboration_execution_command(uuid,text,text[],text) from public,anon;
grant execute on function public.create_collaboration_execution_command(uuid,text,text[],text) to authenticated;

create or replace function public.begin_agent_execution(p_command_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  c public.agent_commands;
  a public.agents;
  pol public.agent_policies;
  ks public.agent_kill_switches;
  lc public.live_agent_collaborations;
  ca public.agent_collaboration_agreements;
  approval_id uuid;
  need_approval boolean:=false;
  policy_rules jsonb;
  current_caps text[];
begin
  select * into c from public.agent_commands
  where id=p_command_id and owner_user_id=(select auth.uid()) for update;
  if c.id is null then raise exception 'COMMAND_NOT_FOUND'; end if;
  if c.status <> 'ready' then raise exception 'COMMAND_NOT_READY'; end if;

  if c.collaboration_agreement_id is not null then
    select * into ca
    from public.agent_collaboration_agreements
    where id=c.collaboration_agreement_id
      and state='approved'
      and (requester_owner_user_id=(select auth.uid()) or target_owner_user_id=(select auth.uid()))
    for update;
    if ca.id is null then raise exception 'COLLABORATION_AGREEMENT_NOT_APPROVED'; end if;
    if ca.expires_at is not null and ca.expires_at <= timezone('utc',now()) then
      update public.agent_collaboration_agreements
        set state='expired',closed_at=timezone('utc',now()),updated_at=timezone('utc',now())
        where id=ca.id;
      raise exception 'COLLABORATION_AGREEMENT_EXPIRED';
    end if;
    if c.agent_id not in (ca.requester_agent_id,ca.target_agent_id) then
      raise exception 'COMMAND_AGENT_OUTSIDE_AGREEMENT';
    end if;
    if exists(
      select 1 from unnest(coalesce(c.requested_capabilities,'{}'::text[])) x
      where not (x=any(ca.requested_capabilities))
    ) then raise exception 'EXECUTION_CAPABILITY_OUTSIDE_AGREEMENT'; end if;
  end if;

  if c.command_source='live' then
    select * into lc from public.live_agent_collaborations
    where id=c.live_collaboration_id and owner_user_id=(select auth.uid());
    if lc.id is null or lc.status<>'active' or lc.consent_status<>'approved' or lc.risk_decision<>'allow' then raise exception 'LIVE_COLLAB_NOT_ACTIVE'; end if;
    if lc.live_session_id<>c.live_session_id then raise exception 'LIVE_COMMAND_CONTEXT_MISMATCH'; end if;
  end if;

  select * into a from public.agents where id=c.agent_id and owner_user_id=(select auth.uid());
  if a.id is null or a.status <> 'active' then raise exception 'AGENT_NOT_ACTIVE'; end if;

  select * into ks from public.agent_kill_switches where agent_id=c.agent_id;
  if coalesce(ks.enabled,false) then raise exception 'AGENT_KILL_SWITCH_ENABLED'; end if;

  select * into pol from public.agent_policies where agent_id=c.agent_id and enabled=true order by policy_version desc limit 1;
  if pol.id is null then raise exception 'AGENT_POLICY_REQUIRED'; end if;
  policy_rules:=coalesce(pol.rules,'{}'::jsonb);

  select coalesce(array_agg(ac.capability order by ac.capability),'{}'::text[])
  into current_caps
  from public.agent_capabilities ac
  where ac.agent_id=c.agent_id and ac.enabled=true;

  if exists(
    select 1 from unnest(coalesce(c.requested_capabilities,'{}'::text[])) x
    where not (x=any(current_caps))
  ) then raise exception 'AGENT_CAPABILITY_REVOKED'; end if;

  if ca.id is not null and exists(
    select 1 from unnest(coalesce(ca.requested_capabilities,'{}'::text[])) x
    where not (x=any(current_caps))
  ) then raise exception 'AGREEMENT_CAPABILITY_REVOKED'; end if;

  need_approval := exists(select 1 from public.agent_task_steps where command_id=c.id and requires_approval=true)
    or c.risk_level in ('high','critical')
    or c.autonomy_level='recommend'
    or (c.autonomy_level='assist' and c.risk_level in ('medium','high','critical'))
    or (c.autonomy_level='semi_autonomous' and c.risk_level in ('high','critical'))
    or coalesce((policy_rules->'approval_required_risk_levels') ? c.risk_level::text,false);

  insert into public.risk_assessments(
    actor_user_id,actor_agent_id,action,resource_type,resource_id,risk_level,decision,factors,policy_version
  ) values(
    (select auth.uid()),c.agent_id,'agent.execute','agent_command',c.id,c.risk_level,
    case when need_approval then 'approval_required' else 'allow' end,
    jsonb_build_object(
      'autonomy_level',c.autonomy_level,
      'command_id',c.id,
      'command_source',c.command_source,
      'collaboration_agreement_id',c.collaboration_agreement_id,
      'live_session_id',c.live_session_id,
      'live_collaboration_id',c.live_collaboration_id,
      'policy_rules',policy_rules,
      'execution_recheck',true
    ),
    pol.policy_version
  );

  if need_approval then
    insert into public.approval_requests(
      requester_user_id,requester_agent_id,action,resource_type,resource_id,status,risk_level,payload,expires_at
    ) values(
      (select auth.uid()),c.agent_id,'agent.execute','agent_command',c.id,'pending'::public.approval_status,
      c.risk_level,
      jsonb_build_object(
        'command_id',c.id,'command_text',c.command_text,'risk_level',c.risk_level,
        'collaboration_agreement_id',c.collaboration_agreement_id,
        'correlation_id',c.correlation_id
      ),
      timezone('utc',now())+interval '24 hours'
    ) returning id into approval_id;

    update public.agent_commands set status='waiting_approval',risk_decision='approval_required' where id=c.id;
    update public.agent_execution_contexts set state='waiting_approval',updated_at=timezone('utc',now()) where command_id=c.id;
    insert into public.agent_runtime_events(
      command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata
    ) values(
      c.id,c.agent_id,(select auth.uid()),'approval_requested','ready','waiting_approval',
      jsonb_build_object(
        'approval_id',approval_id,
        'collaboration_agreement_id',c.collaboration_agreement_id,
        'live_session_id',c.live_session_id,
        'live_collaboration_id',c.live_collaboration_id
      )
    );
    return jsonb_build_object('status','waiting_approval','approval_id',approval_id,'command_id',c.id);
  end if;

  update public.agent_commands
  set status='running',risk_decision='allow',started_at=timezone('utc',now())
  where id=c.id;
  update public.agent_execution_contexts set state='running',updated_at=timezone('utc',now()) where command_id=c.id;
  insert into public.agent_runtime_events(
    command_id,agent_id,owner_user_id,event_type,from_state,to_state,metadata
  ) values(
    c.id,c.agent_id,(select auth.uid()),'execution_started','ready','running',
    jsonb_build_object(
      'collaboration_agreement_id',c.collaboration_agreement_id,
      'live_session_id',c.live_session_id,
      'live_collaboration_id',c.live_collaboration_id
    )
  );
  return jsonb_build_object('status','running','command_id',c.id);
end;
$function$;

revoke execute on function public.begin_agent_execution(uuid) from public,anon;
grant execute on function public.begin_agent_execution(uuid) to authenticated;
