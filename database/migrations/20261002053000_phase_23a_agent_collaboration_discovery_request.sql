-- Phase 23A — AI-to-AI Collaboration discovery and request foundation
-- Applied to AllphaDb-Universe during incremental implementation.

create table if not exists public.agent_collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  requester_agent_id uuid not null references public.agents(id) on delete restrict,
  requester_owner_user_id uuid not null references auth.users(id) on delete restrict,
  target_agent_id uuid not null references public.agents(id) on delete restrict,
  target_owner_user_id uuid not null references auth.users(id) on delete restrict,
  purpose text not null check (char_length(trim(purpose)) between 1 and 5000),
  requested_capabilities text[] not null default '{}',
  proposed_scope jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled','expired')),
  expires_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  metadata jsonb not null default '{}'::jsonb,
  constraint agent_collab_request_distinct_agents check (requester_agent_id <> target_agent_id),
  constraint agent_collab_request_expiry check (expires_at is null or expires_at > created_at)
);

create index if not exists agent_collab_requests_requester_idx
on public.agent_collaboration_requests(requester_agent_id, created_at desc);
create index if not exists agent_collab_requests_target_idx
on public.agent_collaboration_requests(target_agent_id, created_at desc);
create index if not exists agent_collab_requests_status_idx
on public.agent_collaboration_requests(status, created_at desc);
create unique index if not exists agent_collab_requests_pending_unique
on public.agent_collaboration_requests(requester_agent_id, target_agent_id)
where status='pending';

alter table public.agent_collaboration_requests enable row level security;
alter table public.agent_collaboration_requests force row level security;
revoke all on table public.agent_collaboration_requests from anon, authenticated;
grant select on table public.agent_collaboration_requests to authenticated;

create policy agent_collab_requests_participant_select
on public.agent_collaboration_requests
for select to authenticated
using (requester_owner_user_id=(select auth.uid()) or target_owner_user_id=(select auth.uid()));

create or replace function public.discover_collaboration_agents(
  p_capability text default null,
  p_query text default null,
  p_limit integer default 50
)
returns table (
  agent_id uuid, name text, handle text, description text,
  visibility text, verification_status text, capabilities text[]
)
language sql security definer set search_path='' stable
as $$
  select a.id,a.name,a.handle,a.description,a.visibility::text,
         coalesce(ap.verification_status,'unverified'),
         coalesce(caps.capabilities,'{}'::text[])
  from public.agents a
  left join public.agent_passports ap on ap.agent_id=a.id
  left join lateral (
    select array_agg(ac.capability order by ac.capability) capabilities
    from public.agent_capabilities ac
    where ac.agent_id=a.id and ac.enabled=true
  ) caps on true
  where (select auth.uid()) is not null
    and a.status='active' and a.visibility::text='public'
    and a.owner_user_id<>(select auth.uid())
    and (p_capability is null or exists (
      select 1 from public.agent_capabilities ac
      where ac.agent_id=a.id and ac.enabled=true and ac.capability=p_capability
    ))
    and (p_query is null or p_query='' or a.name ilike '%'||p_query||'%' or coalesce(a.handle,'') ilike '%'||p_query||'%')
    and not private.social_blocked_between('agent', a.id, 'agent',
      coalesce((select id from public.agents where owner_user_id=(select auth.uid()) and id<>a.id order by id limit 1), a.id))
  order by a.name asc,a.id asc
  limit greatest(1,least(coalesce(p_limit,50),100));
$$;

revoke execute on function public.discover_collaboration_agents(text,text,integer) from public,anon;
grant execute on function public.discover_collaboration_agents(text,text,integer) to authenticated;

create or replace function public.create_agent_collaboration_request(
  p_requester_agent_id uuid,p_target_agent_id uuid,p_purpose text,
  p_requested_capabilities text[] default '{}',p_proposed_scope jsonb default '{}'::jsonb,
  p_expires_at timestamptz default null
)
returns public.agent_collaboration_requests
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=(select auth.uid()); v_request public.agent_collaboration_requests;
v_requester public.agents; v_target public.agents;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_requester from public.agents
  where id=p_requester_agent_id and owner_user_id=v_uid and status='active' for update;
  if v_requester.id is null then raise exception 'REQUESTER_AGENT_NOT_AVAILABLE'; end if;
  select * into v_target from public.agents
  where id=p_target_agent_id and status='active' and visibility::text='public';
  if v_target.id is null then raise exception 'TARGET_AGENT_NOT_DISCOVERABLE'; end if;
  if v_target.id=v_requester.id then raise exception 'SELF_COLLABORATION_NOT_ALLOWED'; end if;
  if private.social_blocked_between('agent',p_requester_agent_id,'agent',p_target_agent_id)
     then raise exception 'COLLABORATION_BLOCKED'; end if;
  if not coalesce((select cp.allow_agent_messages from public.communication_preferences cp
                   where cp.subject_type='agent' and cp.subject_id=p_target_agent_id limit 1),true)
     then raise exception 'TARGET_AGENT_MESSAGES_DISABLED'; end if;
  if exists(select 1 from public.agent_collaboration_requests r
            where r.requester_agent_id=p_requester_agent_id and r.target_agent_id=p_target_agent_id and r.status='pending')
     then raise exception 'COLLABORATION_REQUEST_ALREADY_PENDING'; end if;
  if p_expires_at is not null and p_expires_at<=timezone('utc',now())
     then raise exception 'COLLABORATION_REQUEST_EXPIRY_INVALID'; end if;
  insert into public.agent_collaboration_requests(
    requester_agent_id,requester_owner_user_id,target_agent_id,target_owner_user_id,
    purpose,requested_capabilities,proposed_scope,status,expires_at)
  values(p_requester_agent_id,v_uid,p_target_agent_id,v_target.owner_user_id,
    trim(p_purpose),coalesce(p_requested_capabilities,'{}'::text[]),
    coalesce(p_proposed_scope,'{}'::jsonb),'pending',p_expires_at)
  returning * into v_request;
  return v_request;
end;
$$;

revoke execute on function public.create_agent_collaboration_request(uuid,uuid,text,text[],jsonb,timestamptz) from public,anon;
grant execute on function public.create_agent_collaboration_request(uuid,uuid,text,text[],jsonb,timestamptz) to authenticated;

create or replace function public.respond_agent_collaboration_request(p_request_id uuid,p_decision text)
returns public.agent_collaboration_requests
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=(select auth.uid()); v_request public.agent_collaboration_requests;
begin
  if p_decision not in ('accepted','rejected','cancelled') then raise exception 'COLLABORATION_REQUEST_DECISION_INVALID'; end if;
  select * into v_request from public.agent_collaboration_requests
  where id=p_request_id and (
    (target_owner_user_id=v_uid and p_decision in ('accepted','rejected'))
    or (requester_owner_user_id=v_uid and p_decision='cancelled')
  ) and status='pending' for update;
  if v_request.id is null then raise exception 'COLLABORATION_REQUEST_NOT_ACTIONABLE'; end if;
  if v_request.expires_at is not null and v_request.expires_at<=timezone('utc',now()) then
    update public.agent_collaboration_requests
    set status='expired',responded_at=timezone('utc',now()),updated_at=timezone('utc',now())
    where id=v_request.id returning * into v_request;
    return v_request;
  end if;
  update public.agent_collaboration_requests
  set status=p_decision,responded_at=timezone('utc',now()),updated_at=timezone('utc',now())
  where id=v_request.id returning * into v_request;
  return v_request;
end;
$$;

revoke execute on function public.respond_agent_collaboration_request(uuid,text) from public,anon;
grant execute on function public.respond_agent_collaboration_request(uuid,text) to authenticated;
