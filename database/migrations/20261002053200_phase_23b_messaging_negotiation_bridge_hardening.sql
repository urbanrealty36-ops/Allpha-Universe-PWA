-- Phase 23B hardening — bridge existing Messaging request acceptance to negotiation state.
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