-- Phase 22H — platform-ready Human uniform catalog + governed OpenAI Realtime voice binding
-- Applied to AllphaDb-Universe before repository reconciliation.
-- Platform catalog rows are product presentation assets/presets, not tenant/business seed data.

create table if not exists public.live_session_voice_bindings (
  id uuid primary key default gen_random_uuid(),
  live_session_id uuid not null references public.live_sessions(id) on delete cascade,
  collaboration_id uuid not null references public.live_agent_collaborations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'openai_realtime',
  model text not null default 'gpt-realtime-2.1',
  voice text not null default 'marin',
  status text not null default 'ready' check (status in ('ready','active','stopped','failed')),
  started_at timestamptz,
  stopped_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (live_session_id, collaboration_id)
);

alter table public.live_session_voice_bindings enable row level security;
drop policy if exists live_voice_binding_owner_select on public.live_session_voice_bindings;
create policy live_voice_binding_owner_select on public.live_session_voice_bindings
  for select to authenticated using ((select auth.uid()) = owner_user_id);
revoke all on public.live_session_voice_bindings from anon;
revoke insert, update, delete on public.live_session_voice_bindings from authenticated;

create or replace function public.claim_platform_uniform(p_uniform_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  uniform_row public.uniform_catalog%rowtype;
  ownership_row public.user_uniforms%rowtype;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into uniform_row from public.uniform_catalog
    where id = p_uniform_id and status = 'published' and moderation_status = 'approved';
  if not found then raise exception 'UNIFORM_NOT_AVAILABLE'; end if;

  insert into public.user_uniforms(user_id, uniform_id, acquired_via, entitlement_ref, metadata, status, equipped)
  values (uid, uniform_row.id, 'platform_ready', 'platform_ready:' || uniform_row.uniform_key,
    jsonb_build_object('platform_ready', true, 'uniform_key', uniform_row.uniform_key), 'owned', false)
  on conflict (user_id, uniform_id) do update
    set status = 'owned', metadata = public.user_uniforms.metadata || excluded.metadata, updated_at = now()
  returning * into ownership_row;

  return jsonb_build_object('ownership_id', ownership_row.id, 'uniform_id', uniform_row.id,
    'uniform_key', uniform_row.uniform_key, 'name', uniform_row.name,
    'acquired_via', ownership_row.acquired_via, 'status', ownership_row.status);
end; $$;

revoke all on function public.claim_platform_uniform(uuid) from public;
revoke all on function public.claim_platform_uniform(uuid) from anon;
grant execute on function public.claim_platform_uniform(uuid) to authenticated;

create or replace function public.prepare_live_voice_binding(
  p_live_session_id uuid, p_collaboration_id uuid,
  p_model text default 'gpt-realtime-2.1', p_voice text default 'marin'
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  session_row public.live_sessions%rowtype;
  collab_row public.live_agent_collaborations%rowtype;
  binding public.live_session_voice_bindings%rowtype;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into session_row from public.live_sessions where id = p_live_session_id and host_user_id = uid;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND_OR_NOT_OWNED'; end if;
  select * into collab_row from public.live_agent_collaborations
    where id = p_collaboration_id and live_session_id = p_live_session_id and owner_user_id = uid;
  if not found then raise exception 'LIVE_COLLAB_NOT_FOUND_OR_NOT_OWNED'; end if;
  if collab_row.status <> 'active' or collab_row.consent_status <> 'approved'
     or collab_row.risk_decision <> 'allow'
     or collab_row.capability_verified is not true or collab_row.policy_verified is not true then
    raise exception 'LIVE_COLLAB_NOT_READY_FOR_VOICE';
  end if;

  insert into public.live_session_voice_bindings(live_session_id, collaboration_id, owner_user_id, provider, model, voice, status, metadata)
  values (p_live_session_id,p_collaboration_id,uid,'openai_realtime',
    coalesce(nullif(trim(p_model), ''), 'gpt-realtime-2.1'),
    coalesce(nullif(trim(p_voice), ''), 'marin'),'ready',
    jsonb_build_object('transport','webrtc','session_type','speech_to_speech'))
  on conflict (live_session_id, collaboration_id) do update
    set model = excluded.model, voice = excluded.voice, status = 'ready', stopped_at = null, updated_at = now()
  returning * into binding;

  return jsonb_build_object('id',binding.id,'live_session_id',binding.live_session_id,
    'collaboration_id',binding.collaboration_id,'provider',binding.provider,
    'model',binding.model,'voice',binding.voice,'status',binding.status);
end; $$;

revoke all on function public.prepare_live_voice_binding(uuid,uuid,text,text) from public;
revoke all on function public.prepare_live_voice_binding(uuid,uuid,text,text) from anon;
grant execute on function public.prepare_live_voice_binding(uuid,uuid,text,text) to authenticated;

create or replace function public.transition_live_voice_binding(p_binding_id uuid, p_target text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); row public.live_session_voice_bindings%rowtype;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into row from public.live_session_voice_bindings where id = p_binding_id and owner_user_id = uid;
  if not found then raise exception 'LIVE_VOICE_BINDING_NOT_FOUND'; end if;
  if p_target not in ('active','stopped','failed') then raise exception 'LIVE_VOICE_TARGET_INVALID'; end if;
  update public.live_session_voice_bindings
    set status=p_target,
        started_at=case when p_target='active' then coalesce(started_at,now()) else started_at end,
        stopped_at=case when p_target in ('stopped','failed') then now() else null end,
        updated_at=now()
    where id=row.id returning * into row;
  return jsonb_build_object('id',row.id,'status',row.status,'started_at',row.started_at,'stopped_at',row.stopped_at);
end; $$;

revoke all on function public.transition_live_voice_binding(uuid,text) from public;
revoke all on function public.transition_live_voice_binding(uuid,text) from anon;
grant execute on function public.transition_live_voice_binding(uuid,text) to authenticated;

insert into public.uniform_catalog
  (uniform_key,name,description,asset_type,theme_compatibility,metadata,moderation_status,status)
values
  ('allpha_classic_white_shirt','Allpha Classic White','Clean white shirt for everyday Live, Content and professional presence.','3d_scene','{"mode":"universal"}','{"platform_ready":true,"runtime_mode":"procedural_uniform_preset_v1","garment":"shirt","palette":["#F4F4F1","#1C2733"],"rig_contract":"human-presentation-v1","rights":"allpha-original"}','approved','published'),
  ('allpha_business_navy','Allpha Business Navy','Navy business shirt with a restrained Allpha professional look.','3d_scene','{"mode":"universal"}','{"platform_ready":true,"runtime_mode":"procedural_uniform_preset_v1","garment":"business_shirt","palette":["#0B1B3A","#E8EDF5"],"rig_contract":"human-presentation-v1","rights":"allpha-original"}','approved','published'),
  ('allpha_suit_tie','Allpha Suit & Tie','Formal suit and tie presentation for executive, meeting and premium Live experiences.','3d_scene','{"mode":"universal"}','{"platform_ready":true,"runtime_mode":"procedural_uniform_preset_v1","garment":"suit_tie","palette":["#15171B","#F2F2EF"],"rig_contract":"human-presentation-v1","rights":"allpha-original"}','approved','published'),
  ('allpha_formal_black','Allpha Formal Black','Minimal black formal look for stage and evening Live experiences.','3d_scene','{"mode":"universal"}','{"platform_ready":true,"runtime_mode":"procedural_uniform_preset_v1","garment":"formal","palette":["#090A0C","#C8CDD4"],"rig_contract":"human-presentation-v1","rights":"allpha-original"}','approved','published'),
  ('allpha_nusantara_batik','Allpha Nusantara Batik','Original Nusantara-inspired presentation preset; not a reproduction of a specific commercial motif.','3d_scene','{"mode":"nusantara"}','{"platform_ready":true,"runtime_mode":"procedural_uniform_preset_v1","garment":"nusantara","palette":["#6E3C1F","#D4A86A","#1B2D27"],"rig_contract":"human-presentation-v1","rights":"allpha-original"}','approved','published'),
  ('allpha_nusantara_modern','Allpha Nusantara Modern','Contemporary Nusantara-inspired formal shirt for cultural and community stages.','3d_scene','{"mode":"nusantara"}','{"platform_ready":true,"runtime_mode":"procedural_uniform_preset_v1","garment":"cultural","palette":["#1C4B3A","#E9D9B0"],"rig_contract":"human-presentation-v1","rights":"allpha-original"}','approved','published'),
  ('allpha_creator_street','Allpha Creator Street','Creator hoodie and streetwear preset for informal interactive experiences.','3d_scene','{"mode":"creator"}','{"platform_ready":true,"runtime_mode":"procedural_uniform_preset_v1","garment":"creator","palette":["#17191F","#5ED7FF"],"rig_contract":"human-presentation-v1","rights":"allpha-original"}','approved','published'),
  ('allpha_future_tech','Allpha Future Tech','Futuristic techwear presentation preset for Galaxy/World stages.','3d_scene','{"mode":"sci_fi"}','{"platform_ready":true,"runtime_mode":"procedural_uniform_preset_v1","garment":"sci_fi","palette":["#0A1820","#27D8FF","#C8F5FF"],"rig_contract":"human-presentation-v1","rights":"allpha-original"}','approved','published')
on conflict (uniform_key) do update set name=excluded.name,description=excluded.description,
  metadata=excluded.metadata,theme_compatibility=excluded.theme_compatibility,
  moderation_status='approved',status='published',updated_at=now();

create index if not exists live_voice_bindings_owner_status_idx
  on public.live_session_voice_bindings(owner_user_id,status);
