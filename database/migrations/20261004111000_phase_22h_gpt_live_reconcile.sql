-- Phase 22H reconciliation: use OpenAI GPT-Live as the single Live voice layer.
alter table public.live_session_voice_bindings alter column model set default 'gpt-live-1';

create or replace function public.prepare_live_voice_binding(
  p_live_session_id uuid, p_collaboration_id uuid,
  p_model text default 'gpt-live-1', p_voice text default 'marin'
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); session_row public.live_sessions%rowtype; collab_row public.live_agent_collaborations%rowtype; binding public.live_session_voice_bindings%rowtype;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into session_row from public.live_sessions where id=p_live_session_id and host_user_id=uid;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND_OR_NOT_OWNED'; end if;
  if session_row.status <> 'live' then raise exception 'LIVE_SESSION_NOT_LIVE'; end if;
  select * into collab_row from public.live_agent_collaborations where id=p_collaboration_id and live_session_id=p_live_session_id and owner_user_id=uid;
  if not found then raise exception 'LIVE_COLLAB_NOT_FOUND_OR_NOT_OWNED'; end if;
  if collab_row.status <> 'active' or collab_row.consent_status <> 'approved' or collab_row.risk_decision <> 'allow'
     or collab_row.capability_verified is not true or collab_row.policy_verified is not true then raise exception 'LIVE_COLLAB_NOT_READY_FOR_VOICE'; end if;
  insert into public.live_session_voice_bindings(live_session_id,collaboration_id,owner_user_id,provider,model,voice,status,metadata)
  values(p_live_session_id,p_collaboration_id,uid,'openai_gpt_live',
    coalesce(nullif(trim(p_model),''),'gpt-live-1'),coalesce(nullif(trim(p_voice),''),'marin'),'ready',
    jsonb_build_object('transport','webrtc','session_type','full_duplex','delegation','client','backend_authority','existing_live_agent_runtime'))
  on conflict(live_session_id,collaboration_id) do update set model=excluded.model,voice=excluded.voice,provider=excluded.provider,status='ready',stopped_at=null,updated_at=now()
  returning * into binding;
  return jsonb_build_object('id',binding.id,'live_session_id',binding.live_session_id,'collaboration_id',binding.collaboration_id,'provider',binding.provider,'model',binding.model,'voice',binding.voice,'status',binding.status);
end; $$;

revoke all on function public.prepare_live_voice_binding(uuid,uuid,text,text) from public;
revoke all on function public.prepare_live_voice_binding(uuid,uuid,text,text) from anon;
grant execute on function public.prepare_live_voice_binding(uuid,uuid,text,text) to authenticated;
