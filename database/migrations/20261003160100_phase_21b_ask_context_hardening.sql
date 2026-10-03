-- Phase 21B hardening — constrain discovery provenance to canonical surface identifiers.

create or replace function public.get_or_create_agent_conversation(
  p_agent_id uuid,
  p_interaction_mode text default 'message',
  p_source_context jsonb default '{}'::jsonb,
  p_initial_message text default null,
  p_client_message_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_conversation uuid;
  v_status text;
  v_result jsonb;
  v_key text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_interaction_mode not in ('message','ask') then raise exception 'INVALID_INTERACTION_MODE'; end if;

  if p_source_context is null then p_source_context := '{}'::jsonb; end if;
  if jsonb_typeof(p_source_context) <> 'object' then raise exception 'INVALID_SOURCE_CONTEXT'; end if;
  for v_key in select jsonb_object_keys(p_source_context) loop
    if v_key not in ('source_surface','district_id','zone_id','booth_id','live_session_id','content_id','moment_id') then
      raise exception 'INVALID_SOURCE_CONTEXT_KEY';
    end if;
  end loop;

  if not exists (select 1 from public.agents a where a.id=p_agent_id and a.status<>'archived') then
    raise exception 'TARGET_AGENT_NOT_FOUND';
  end if;

  select c.id,c.status into v_conversation,v_status
  from public.conversations c
  where c.conversation_type='direct'
    and c.status in ('active','pending')
    and exists (select 1 from public.conversation_participants cp where cp.conversation_id=c.id and cp.subject_type='user' and cp.subject_id=v_uid and cp.status in ('active','pending'))
    and exists (select 1 from public.conversation_participants cp where cp.conversation_id=c.id and cp.subject_type='agent' and cp.subject_id=p_agent_id and cp.status in ('active','pending'))
  order by c.updated_at desc
  limit 1
  for update;

  if v_conversation is null then
    v_result := public.create_direct_conversation('user',v_uid,'agent',p_agent_id,null,p_client_message_id);
    v_conversation := (v_result->>'conversation_id')::uuid;
    v_status := coalesce(v_result->>'status','active');
  end if;

  update public.conversations
  set metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object('last_discovery_context',p_source_context,'last_interaction_mode',p_interaction_mode),
      updated_at=timezone('utc',now())
  where id=v_conversation;

  if p_initial_message is not null and btrim(p_initial_message)<>'' and v_status='active' then
    perform public.send_message(v_conversation,'user',v_uid,p_initial_message,null,p_client_message_id,
      jsonb_build_object('interaction_mode',p_interaction_mode,'discovery_context',p_source_context));
  end if;

  return jsonb_build_object('conversation_id',v_conversation,'status',v_status,'interaction_mode',p_interaction_mode);
end
$function$;

revoke all on function public.get_or_create_agent_conversation(uuid,text,jsonb,text,text) from public;
revoke all on function public.get_or_create_agent_conversation(uuid,text,jsonb,text,text) from anon;
grant execute on function public.get_or_create_agent_conversation(uuid,text,jsonb,text,text) to authenticated;
