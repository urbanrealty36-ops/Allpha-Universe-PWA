-- Phase 23C — Human Approval + Collaboration Agreement
-- Declarative agreement only. Reuses existing Approval/Risk tables.
-- No capability, policy, permission or execution authority is granted here.

create table if not exists public.agent_collaboration_agreements (
  id uuid primary key default gen_random_uuid(),
  collaboration_request_id uuid not null unique references public.agent_collaboration_requests(id) on delete restrict,
  negotiation_id uuid not null unique references public.agent_collaboration_negotiations(id) on delete restrict,
  requester_agent_id uuid not null references public.agents(id) on delete restrict,
  target_agent_id uuid not null references public.agents(id) on delete restrict,
  requester_owner_user_id uuid not null references auth.users(id) on delete restrict,
  target_owner_user_id uuid not null references auth.users(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  state text not null default 'pending_approval'
    check (state in ('pending_approval','approved','rejected','expired','cancelled')),
  purpose text not null check (char_length(trim(purpose)) between 1 and 5000),
  requested_capabilities text[] not null default '{}'::text[],
  agreed_scope jsonb not null default '{}'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  terms jsonb not null default '{}'::jsonb,
  requester_policy_version integer not null check (requester_policy_version > 0),
  target_policy_version integer not null check (target_policy_version > 0),
  requester_capabilities_snapshot text[] not null default '{}'::text[],
  target_capabilities_snapshot text[] not null default '{}'::text[],
  risk_level public.risk_level not null,
  expires_at timestamptz,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz,
  rejected_at timestamptz,
  closed_at timestamptz,
  check (expires_at is null or expires_at > created_at),
  check (requester_agent_id <> target_agent_id),
  check (jsonb_typeof(agreed_scope) = 'object'),
  check (jsonb_typeof(constraints) = 'object'),
  check (jsonb_typeof(terms) = 'object')
);

create table if not exists public.agent_collaboration_agreement_events (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agent_collaboration_agreements(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_agent_id uuid references public.agents(id) on delete set null,
  event_type text not null
    check (event_type in ('created','approval_requested','approved','rejected','expired','cancelled','system')),
  approval_request_id uuid references public.approval_requests(id) on delete set null,
  risk_assessment_id uuid references public.risk_assessments(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists agent_collab_agreements_request_idx
  on public.agent_collaboration_agreements(collaboration_request_id);
create index if not exists agent_collab_agreements_negotiation_idx
  on public.agent_collaboration_agreements(negotiation_id);
create index if not exists agent_collab_agreements_requester_owner_idx
  on public.agent_collaboration_agreements(requester_owner_user_id);
create index if not exists agent_collab_agreements_target_owner_idx
  on public.agent_collaboration_agreements(target_owner_user_id);
create index if not exists agent_collab_agreements_state_idx
  on public.agent_collaboration_agreements(state, updated_at desc);
create index if not exists agent_collab_agreement_events_agreement_idx
  on public.agent_collaboration_agreement_events(agreement_id, created_at asc);
create index if not exists agent_collab_agreement_events_actor_idx
  on public.agent_collaboration_agreement_events(actor_user_id, created_at desc);

alter table public.agent_collaboration_agreements enable row level security;
alter table public.agent_collaboration_agreements force row level security;
alter table public.agent_collaboration_agreement_events enable row level security;
alter table public.agent_collaboration_agreement_events force row level security;

revoke all on table public.agent_collaboration_agreements from anon, authenticated;
revoke all on table public.agent_collaboration_agreement_events from anon, authenticated;
grant select on table public.agent_collaboration_agreements to authenticated;
grant select on table public.agent_collaboration_agreement_events to authenticated;

drop policy if exists agent_collab_agreements_participant_select on public.agent_collaboration_agreements;
create policy agent_collab_agreements_participant_select
on public.agent_collaboration_agreements
for select to authenticated
using (
  requester_owner_user_id = (select auth.uid())
  or target_owner_user_id = (select auth.uid())
);

drop policy if exists agent_collab_agreement_events_participant_select on public.agent_collaboration_agreement_events;
create policy agent_collab_agreement_events_participant_select
on public.agent_collaboration_agreement_events
for select to authenticated
using (
  exists (
    select 1
    from public.agent_collaboration_agreements a
    where a.id = agreement_id
      and (
        a.requester_owner_user_id = (select auth.uid())
        or a.target_owner_user_id = (select auth.uid())
      )
  )
);

create or replace function public.create_agent_collaboration_agreement(
  p_negotiation_id uuid,
  p_purpose text,
  p_requested_capabilities text[] default '{}',
  p_agreed_scope jsonb default '{}'::jsonb,
  p_constraints jsonb default '{}'::jsonb,
  p_terms jsonb default '{}'::jsonb,
  p_expires_at timestamptz default null
) returns public.agent_collaboration_agreements
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  n public.agent_collaboration_negotiations;
  r public.agent_collaboration_requests;
  requester public.agents;
  target public.agents;
  requester_policy public.agent_policies;
  target_policy public.agent_policies;
  requester_caps text[];
  target_caps text[];
  agreement public.agent_collaboration_agreements;
  risk_level public.risk_level := 'low';
  owner_count integer;
  approval_id uuid;
  risk_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(trim(coalesce(p_purpose,''))) not between 1 and 5000 then
    raise exception 'AGREEMENT_PURPOSE_INVALID';
  end if;
  if jsonb_typeof(coalesce(p_agreed_scope,'{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_constraints,'{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_terms,'{}'::jsonb)) <> 'object' then
    raise exception 'AGREEMENT_DECLARATIVE_OBJECT_REQUIRED';
  end if;
  if p_expires_at is not null and p_expires_at <= timezone('utc',now()) then
    raise exception 'AGREEMENT_EXPIRY_INVALID';
  end if;

  select * into n
  from public.agent_collaboration_negotiations
  where id=p_negotiation_id
  for update;
  if n.id is null then raise exception 'NEGOTIATION_NOT_FOUND'; end if;
  if n.state not in ('open','agreed') then raise exception 'NEGOTIATION_NOT_AGREEMENT_READY'; end if;

  select * into r
  from public.agent_collaboration_requests
  where id=n.collaboration_request_id
    and status='accepted'
  for update;
  if r.id is null then raise exception 'COLLABORATION_NOT_ACCEPTED'; end if;

  select * into requester
  from public.agents
  where id=r.requester_agent_id and status='active'
  for update;
  select * into target
  from public.agents
  where id=r.target_agent_id and status='active'
  for update;
  if requester.id is null or target.id is null then raise exception 'AGENT_NOT_ACTIVE'; end if;

  if v_uid <> requester.owner_user_id and v_uid <> target.owner_user_id then
    raise exception 'AGREEMENT_OWNER_REQUIRED';
  end if;

  if exists (
    select 1 from public.agent_collaboration_agreements a
    where a.negotiation_id=n.id and a.state in ('pending_approval','approved')
  ) then
    raise exception 'AGREEMENT_ALREADY_EXISTS';
  end if;

  select * into requester_policy
  from public.agent_policies
  where agent_id=requester.id and enabled=true
  order by policy_version desc
  limit 1;
  select * into target_policy
  from public.agent_policies
  where agent_id=target.id and enabled=true
  order by policy_version desc
  limit 1;
  if requester_policy.id is null or target_policy.id is null then
    raise exception 'AGENT_POLICY_REQUIRED';
  end if;

  select coalesce(array_agg(ac.capability order by ac.capability),'{}'::text[])
    into requester_caps
  from public.agent_capabilities ac
  where ac.agent_id=requester.id and ac.enabled=true;

  select coalesce(array_agg(ac.capability order by ac.capability),'{}'::text[])
    into target_caps
  from public.agent_capabilities ac
  where ac.agent_id=target.id and ac.enabled=true;

  if exists (
    select 1
    from unnest(coalesce(p_requested_capabilities,'{}'::text[])) c
    where not (c = any(target_caps))
  ) then
    raise exception 'TARGET_CAPABILITY_NOT_AVAILABLE';
  end if;

  -- Agreement commitment always requires Human approval.
  -- Risk is recorded as evidence for this commitment; 23D must re-assess
  -- current policy/capability/risk before any execution.
  if cardinality(coalesce(p_requested_capabilities,'{}'::text[])) > 0
     or p_agreed_scope <> '{}'::jsonb
     or p_terms <> '{}'::jsonb
     or p_constraints <> '{}'::jsonb then
    risk_level := 'medium';
  end if;
  if coalesce(p_terms->>'financial_commitment','false')='true'
     or coalesce(p_terms->>'sensitive_data','false')='true'
     or coalesce(p_terms->>'irreversible_action','false')='true' then
    risk_level := 'high';
  end if;

  insert into public.agent_collaboration_agreements(
    collaboration_request_id, negotiation_id, requester_agent_id, target_agent_id,
    requester_owner_user_id, target_owner_user_id, purpose, requested_capabilities,
    agreed_scope, constraints, terms, requester_policy_version, target_policy_version,
    requester_capabilities_snapshot, target_capabilities_snapshot, risk_level,
    expires_at, created_by_user_id
  ) values (
    r.id,n.id,requester.id,target.id,requester.owner_user_id,target.owner_user_id,
    trim(p_purpose),coalesce(p_requested_capabilities,'{}'::text[]),
    coalesce(p_agreed_scope,'{}'::jsonb),coalesce(p_constraints,'{}'::jsonb),
    coalesce(p_terms,'{}'::jsonb),requester_policy.policy_version,target_policy.policy_version,
    requester_caps,target_caps,risk_level,p_expires_at,v_uid
  ) returning * into agreement;

  insert into public.risk_assessments(
    actor_user_id,actor_agent_id,action,resource_type,resource_id,risk_level,decision,factors,policy_version
  ) values (
    requester.owner_user_id,requester.id,'agent.collaboration.commit',
    'agent_collaboration_agreement',agreement.id,risk_level,'approval_required',
    jsonb_build_object(
      'stage','collaboration_commitment',
      'agreement_id',agreement.id,
      'negotiation_id',n.id,
      'requested_capabilities',coalesce(p_requested_capabilities,'{}'::text[]),
      'scope',coalesce(p_agreed_scope,'{}'::jsonb),
      'constraints',coalesce(p_constraints,'{}'::jsonb),
      'terms',coalesce(p_terms,'{}'::jsonb),
      'execution_recheck_required',true
    ),requester_policy.policy_version
  ) returning id into risk_id;

  insert into public.agent_collaboration_agreement_events(
    agreement_id,actor_user_id,actor_agent_id,event_type,risk_assessment_id,payload
  ) values (
    agreement.id,v_uid,
    case when v_uid=requester.owner_user_id then requester.id else target.id end,
    'created',risk_id,
    jsonb_build_object('risk_level',risk_level,'approval_required',true)
  );

  if requester.owner_user_id = target.owner_user_id then
    owner_count := 1;
  else
    owner_count := 2;
  end if;

  insert into public.approval_requests(
    requester_user_id,requester_agent_id,action,resource_type,resource_id,status,risk_level,payload,expires_at
  ) values (
    requester.owner_user_id,requester.id,'agent.collaboration.commit',
    'agent_collaboration_agreement',agreement.id,'pending'::public.approval_status,risk_level,
    jsonb_build_object('agreement_id',agreement.id,'agent_id',requester.id,'purpose',agreement.purpose,'risk_level',risk_level),
    coalesce(p_expires_at,timezone('utc',now())+interval '24 hours')
  ) returning id into approval_id;

  insert into public.agent_collaboration_agreement_events(
    agreement_id,actor_user_id,actor_agent_id,event_type,approval_request_id,risk_assessment_id
  ) values (agreement.id,requester.owner_user_id,requester.id,'approval_requested',approval_id,risk_id);

  if owner_count=2 then
    insert into public.approval_requests(
      requester_user_id,requester_agent_id,action,resource_type,resource_id,status,risk_level,payload,expires_at
    ) values (
      target.owner_user_id,target.id,'agent.collaboration.commit',
      'agent_collaboration_agreement',agreement.id,'pending'::public.approval_status,risk_level,
      jsonb_build_object('agreement_id',agreement.id,'agent_id',target.id,'purpose',agreement.purpose,'risk_level',risk_level),
      coalesce(p_expires_at,timezone('utc',now())+interval '24 hours')
    ) returning id into approval_id;

    insert into public.agent_collaboration_agreement_events(
      agreement_id,actor_user_id,actor_agent_id,event_type,approval_request_id,risk_assessment_id
    ) values (agreement.id,target.owner_user_id,target.id,'approval_requested',approval_id,risk_id);
  end if;

  update public.agent_collaboration_negotiations
  set state='agreed',updated_at=timezone('utc',now())
  where id=n.id and state='open';

  insert into public.agent_collaboration_negotiation_events(
    negotiation_id,actor_agent_id,event_type,payload
  ) values (
    n.id,
    case when v_uid=requester.owner_user_id then requester.id else target.id end,
    'agreed',
    jsonb_build_object('agreement_id',agreement.id)
  );

  return agreement;
end;
$function$;

revoke execute on function public.create_agent_collaboration_agreement(uuid,text,text[],jsonb,jsonb,jsonb,timestamptz) from public,anon;
grant execute on function public.create_agent_collaboration_agreement(uuid,text,text[],jsonb,jsonb,jsonb,timestamptz) to authenticated;

create or replace function public.decide_agent_collaboration_agreement_approval(
  p_agreement_id uuid,
  p_decision text,
  p_reason text default null
) returns public.agent_collaboration_agreements
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  a public.agent_collaboration_agreements;
  ar public.approval_requests;
  pending_count integer;
  agent_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'INVALID_APPROVAL_DECISION'; end if;

  select * into a
  from public.agent_collaboration_agreements
  where id=p_agreement_id
    and (requester_owner_user_id=v_uid or target_owner_user_id=v_uid)
  for update;
  if a.id is null then raise exception 'AGREEMENT_NOT_FOUND_OR_ACCESS_DENIED'; end if;
  if a.state <> 'pending_approval' then raise exception 'AGREEMENT_NOT_PENDING_APPROVAL'; end if;
  if a.expires_at is not null and a.expires_at <= timezone('utc',now()) then
    update public.agent_collaboration_agreements
    set state='expired',closed_at=timezone('utc',now()),updated_at=timezone('utc',now())
    where id=a.id;
    insert into public.agent_collaboration_agreement_events(agreement_id,actor_user_id,event_type,payload)
    values(a.id,v_uid,'expired','{}'::jsonb);
    raise exception 'AGREEMENT_EXPIRED';
  end if;

  select ar.*
  into ar
  from public.approval_requests ar
  where ar.resource_type='agent_collaboration_agreement'
    and ar.resource_id=a.id
    and ar.requester_user_id=v_uid
    and ar.status='pending'::public.approval_status
  order by ar.created_at desc
  limit 1
  for update;
  if ar.id is null then raise exception 'APPROVAL_REQUEST_NOT_FOUND_OR_ALREADY_DECIDED'; end if;

  agent_id := ar.requester_agent_id;
  update public.approval_requests
  set status=case when p_decision='approved' then 'approved'::public.approval_status else 'rejected'::public.approval_status end,
      decision_by_user_id=v_uid, decision_reason=p_reason, decided_at=timezone('utc',now())
  where id=ar.id;

  if p_decision='rejected' then
    update public.agent_collaboration_agreements
    set state='rejected',rejected_at=timezone('utc',now()),closed_at=timezone('utc',now()),updated_at=timezone('utc',now())
    where id=a.id returning * into a;
    insert into public.agent_collaboration_agreement_events(
      agreement_id,actor_user_id,actor_agent_id,event_type,approval_request_id,payload
    ) values(a.id,v_uid,agent_id,'rejected',ar.id,jsonb_build_object('reason',p_reason));
    return a;
  end if;

  select count(*) into pending_count
  from public.approval_requests
  where resource_type='agent_collaboration_agreement'
    and resource_id=a.id
    and status='pending'::public.approval_status;

  if pending_count=0 then
    update public.agent_collaboration_agreements
    set state='approved',approved_at=timezone('utc',now()),updated_at=timezone('utc',now())
    where id=a.id returning * into a;
  else
    update public.agent_collaboration_agreements
    set updated_at=timezone('utc',now())
    where id=a.id returning * into a;
  end if;

  insert into public.agent_collaboration_agreement_events(
    agreement_id,actor_user_id,actor_agent_id,event_type,approval_request_id,payload
  ) values(
    a.id,v_uid,agent_id,'approved',ar.id,
    jsonb_build_object('pending_approvals_remaining',pending_count)
  );
  return a;
end;
$function$;

revoke execute on function public.decide_agent_collaboration_agreement_approval(uuid,text,text) from public,anon;
grant execute on function public.decide_agent_collaboration_agreement_approval(uuid,text,text) to authenticated;

create or replace function public.cancel_agent_collaboration_agreement(
  p_agreement_id uuid,
  p_reason text default null
) returns public.agent_collaboration_agreements
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  a public.agent_collaboration_agreements;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into a
  from public.agent_collaboration_agreements
  where id=p_agreement_id
    and (requester_owner_user_id=v_uid or target_owner_user_id=v_uid)
  for update;
  if a.id is null then raise exception 'AGREEMENT_NOT_FOUND_OR_ACCESS_DENIED'; end if;
  if a.state not in ('pending_approval','approved') then raise exception 'AGREEMENT_NOT_CANCELLABLE'; end if;

  update public.agent_collaboration_agreements
  set state='cancelled',closed_at=timezone('utc',now()),updated_at=timezone('utc',now())
  where id=a.id returning * into a;

  update public.approval_requests
  set status='cancelled'::public.approval_status,
      decision_reason=coalesce(p_reason,'Agreement cancelled'),
      decided_at=timezone('utc',now())
  where resource_type='agent_collaboration_agreement'
    and resource_id=a.id
    and status='pending'::public.approval_status;

  insert into public.agent_collaboration_agreement_events(
    agreement_id,actor_user_id,event_type,payload
  ) values(a.id,v_uid,'cancelled',jsonb_build_object('reason',p_reason));

  return a;
end;
$function$;

revoke execute on function public.cancel_agent_collaboration_agreement(uuid,text) from public,anon;
grant execute on function public.cancel_agent_collaboration_agreement(uuid,text) to authenticated;
