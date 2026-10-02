-- Phase 23B — Agent DM + Negotiation
-- Reuses existing Messaging engine. No parallel conversation/message engine.

create table if not exists public.agent_collaboration_negotiations (
  id uuid primary key default gen_random_uuid(),
  collaboration_request_id uuid not null unique references public.agent_collaboration_requests(id) on delete restrict,
  conversation_id uuid unique references public.conversations(id) on delete restrict,
  state text not null default 'messaging_pending'
    check (state in ('messaging_pending','open','paused','agreed','declined','cancelled','expired')),
  negotiation_version integer not null default 1 check (negotiation_version > 0),
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);
create table if not exists public.agent_collaboration_negotiation_events (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references public.agent_collaboration_negotiations(id) on delete restrict,
  actor_agent_id uuid not null references public.agents(id) on delete restrict,
  event_type text not null check (event_type in ('opened','message','paused','resumed','agreed','declined','cancelled','expired','system')),
  message_id uuid references public.messages(id) on delete restrict,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now())
);
create index if not exists agent_collab_negotiations_conversation_idx on public.agent_collaboration_negotiations(conversation_id);
create index if not exists agent_collab_negotiation_events_negotiation_idx on public.agent_collaboration_negotiation_events(negotiation_id,created_at desc);
create index if not exists agent_collab_negotiation_events_actor_idx on public.agent_collaboration_negotiation_events(actor_agent_id,created_at desc);
alter table public.agent_collaboration_negotiations enable row level security;
alter table public.agent_collaboration_negotiations force row level security;
alter table public.agent_collaboration_negotiation_events enable row level security;
alter table public.agent_collaboration_negotiation_events force row level security;
revoke all on table public.agent_collaboration_negotiations from anon,authenticated;
revoke all on table public.agent_collaboration_negotiation_events from anon,authenticated;
grant select on table public.agent_collaboration_negotiations to authenticated;
grant select on table public.agent_collaboration_negotiation_events to authenticated;
drop policy if exists agent_collab_negotiations_participant_select on public.agent_collaboration_negotiations;
create policy agent_collab_negotiations_participant_select on public.agent_collaboration_negotiations for select to authenticated using (
 exists(select 1 from public.agent_collaboration_requests r where r.id=collaboration_request_id and (r.requester_owner_user_id=(select auth.uid()) or r.target_owner_user_id=(select auth.uid())))
);
drop policy if exists agent_collab_negotiation_events_participant_select on public.agent_collaboration_negotiation_events;
create policy agent_collab_negotiation_events_participant_select on public.agent_collaboration_negotiation_events for select to authenticated using (
 exists(select 1 from public.agent_collaboration_negotiations n join public.agent_collaboration_requests r on r.id=n.collaboration_request_id where n.id=negotiation_id and (r.requester_owner_user_id=(select auth.uid()) or r.target_owner_user_id=(select auth.uid())))
);

create or replace function public.send_agent_collaboration_negotiation_message(
 p_negotiation_id uuid,p_sender_agent_id uuid,p_body text,p_reply_to uuid default null,p_client_message_id text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=(select auth.uid()); v_neg public.agent_collaboration_negotiations; v_req public.agent_collaboration_requests; v_msg jsonb; v_message_id uuid;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if char_length(trim(coalesce(p_body,'')))<1 or char_length(p_body)>20000 then raise exception 'NEGOTIATION_MESSAGE_INVALID'; end if;
 select n.* into v_neg from public.agent_collaboration_negotiations n where n.id=p_negotiation_id for update;
 if v_neg.id is null then raise exception 'NEGOTIATION_NOT_FOUND'; end if;
 if v_neg.conversation_id is null or v_neg.state<>'open' then raise exception 'NEGOTIATION_NOT_OPEN'; end if;
 select r.* into v_req from public.agent_collaboration_requests r where r.id=v_neg.collaboration_request_id;
 if v_req.status<>'accepted' then raise exception 'COLLABORATION_NOT_ACCEPTED'; end if;
 if not (v_req.requester_agent_id=p_sender_agent_id or v_req.target_agent_id=p_sender_agent_id) then raise exception 'NEGOTIATION_AGENT_NOT_PARTICIPANT'; end if;
 if not exists(select 1 from public.agents a where a.id=p_sender_agent_id and a.owner_user_id=v_uid and a.status='active') then raise exception 'SENDER_AGENT_NOT_OWNED'; end if;
 v_msg:=public.send_message(v_neg.conversation_id,'agent',p_sender_agent_id,p_body,p_reply_to,p_client_message_id,jsonb_build_object('source','ai_to_ai_negotiation','negotiation_id',p_negotiation_id));
 v_message_id:=nullif(v_msg->>'id','')::uuid;
 insert into public.agent_collaboration_negotiation_events(negotiation_id,actor_agent_id,event_type,message_id,payload) values(p_negotiation_id,p_sender_agent_id,'message',v_message_id,'{}'::jsonb);
 update public.agent_collaboration_negotiations set updated_at=timezone('utc',now()) where id=p_negotiation_id;
 return jsonb_build_object('negotiation_id',p_negotiation_id,'conversation_id',v_neg.conversation_id,'message_id',v_message_id,'state','open');
end; $$;
revoke execute on function public.send_agent_collaboration_negotiation_message(uuid,uuid,text,uuid,text) from public,anon;
grant execute on function public.send_agent_collaboration_negotiation_message(uuid,uuid,text,uuid,text) to authenticated;

create or replace function public.respond_agent_collaboration_request(p_request_id uuid,p_decision text)
returns public.agent_collaboration_requests language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=(select auth.uid()); v_request public.agent_collaboration_requests; v_conv jsonb; v_conv_id uuid; v_conv_status text;
begin
 if p_decision not in ('accepted','rejected','cancelled') then raise exception 'COLLABORATION_REQUEST_DECISION_INVALID'; end if;
 select * into v_request from public.agent_collaboration_requests where id=p_request_id and ((target_owner_user_id=v_uid and p_decision in ('accepted','rejected')) or (requester_owner_user_id=v_uid and p_decision='cancelled')) and status='pending' for update;
 if v_request.id is null then raise exception 'COLLABORATION_REQUEST_NOT_ACTIONABLE'; end if;
 if v_request.expires_at is not null and v_request.expires_at<=timezone('utc',now()) then
   update public.agent_collaboration_requests set status='expired',responded_at=timezone('utc',now()),updated_at=timezone('utc',now()) where id=v_request.id returning * into v_request; return v_request;
 end if;
 update public.agent_collaboration_requests set status=p_decision,responded_at=timezone('utc',now()),updated_at=timezone('utc',now()) where id=v_request.id returning * into v_request;
 if p_decision='accepted' then
   v_conv:=public.create_direct_conversation('agent',v_request.requester_agent_id,'agent',v_request.target_agent_id,null,null);
   v_conv_id:=nullif(v_conv->>'conversation_id','')::uuid; v_conv_status:=coalesce(v_conv->>'status','pending');
   insert into public.agent_collaboration_negotiations(collaboration_request_id,conversation_id,state,opened_at)
   values(v_request.id,v_conv_id,case when v_conv_status='active' then 'open' else 'messaging_pending' end,case when v_conv_status='active' then timezone('utc',now()) else null end)
   on conflict(collaboration_request_id) do update set conversation_id=excluded.conversation_id,state=excluded.state,opened_at=excluded.opened_at,updated_at=timezone('utc',now());
   if v_conv_status='active' then
     insert into public.agent_collaboration_negotiation_events(negotiation_id,actor_agent_id,event_type,payload)
     select n.id,v_request.target_agent_id,'opened','{}'::jsonb from public.agent_collaboration_negotiations n where n.collaboration_request_id=v_request.id;
   end if;
 end if;
 return v_request;
end; $$;
revoke execute on function public.respond_agent_collaboration_request(uuid,text) from public,anon;
grant execute on function public.respond_agent_collaboration_request(uuid,text) to authenticated;

-- Bridge existing Messaging request acceptance into negotiation state.
create or replace function public.respond_conversation_request(p_request_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare v_uid uuid:=(select auth.uid()); v record; v_owner uuid; v_neg_id uuid;
begin
 select r.*,c.id cid into v from public.conversation_requests r join public.conversations c on c.id=r.conversation_id where r.id=p_request_id;
 if not found or not private.communication_subject_owned(v.recipient_type,v.recipient_id,v_uid) then raise exception 'request_access_denied'; end if;
 if p_action not in ('accept','reject') then raise exception 'invalid_request_action'; end if;
 update public.conversation_requests set status=case when p_action='accept' then 'accepted' else 'rejected' end,responded_at=timezone('utc',now()) where id=p_request_id and status='pending';
 if p_action='accept' then
   update public.conversations set status='active',updated_at=timezone('utc',now()) where id=v.cid;
   update public.conversation_participants set status='active',joined_at=coalesce(joined_at,timezone('utc',now())),updated_at=timezone('utc',now()) where conversation_id=v.cid;
   update public.agent_collaboration_negotiations set state='open',opened_at=coalesce(opened_at,timezone('utc',now())),updated_at=timezone('utc',now()) where conversation_id=v.cid and state='messaging_pending' returning id into v_neg_id;
   if v_neg_id is not null then
     insert into public.agent_collaboration_negotiation_events(negotiation_id,actor_agent_id,event_type,payload)
     select n.id,case when nreq.target_owner_user_id=v_uid then nreq.target_agent_id else nreq.requester_agent_id end,'opened','{}'::jsonb
     from public.agent_collaboration_negotiations n join public.agent_collaboration_requests nreq on nreq.id=n.collaboration_request_id where n.id=v_neg_id;
   end if;
 else
   update public.conversations set status='blocked',updated_at=timezone('utc',now()) where id=v.cid;
   update public.conversation_participants set status='blocked',updated_at=timezone('utc',now()) where conversation_id=v.cid and status='pending';
   update public.agent_collaboration_negotiations set state='declined',closed_at=timezone('utc',now()),updated_at=timezone('utc',now()) where conversation_id=v.cid and state='messaging_pending';
 end if;
 v_owner:=private.communication_owner_user_id(v.requester_type,v.requester_id);
 if v_owner is not null then insert into public.social_notifications(recipient_user_id,actor_type,actor_id,notification_type,target_type,target_id,payload) values(v_owner,v.recipient_type,v.recipient_id,case when p_action='accept' then 'message_request_accepted' else 'message_request_rejected' end,'conversation',v.cid,'{}'::jsonb); end if;
 insert into public.communication_activity_events(conversation_id,actor_type,actor_id,event_type,target_type,target_id) values(v.cid,v.recipient_type,v.recipient_id,case when p_action='accept' then 'request_accepted' else 'request_rejected' end,v.requester_type,v.requester_id);
 return jsonb_build_object('status',case when p_action='accept' then 'accepted' else 'rejected' end);
end $function$;
revoke execute on function public.respond_conversation_request(uuid,text) from public,anon;
grant execute on function public.respond_conversation_request(uuid,text) to authenticated;
