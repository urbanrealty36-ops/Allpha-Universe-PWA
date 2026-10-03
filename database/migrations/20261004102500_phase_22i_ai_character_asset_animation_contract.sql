-- Phase 22I — AI Character Asset + Animation Contract.
-- Platform character assets are catalog/runtime presets, not user/business seed data.
create table if not exists public.live_character_asset_contracts (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null unique references public.live_character_assets(id) on delete cascade,
  contract_version text not null default 'ai-character-animation-v1',
  source_kind text not null default 'uploaded_glb' check (source_kind in ('platform_procedural','platform_theme_component','uploaded_glb')),
  component_name text,
  rig_profile text not null default 'humanoid-v1',
  body_channels jsonb not null default '[]'::jsonb,
  face_channels jsonb not null default '[]'::jsonb,
  viseme_contract jsonb not null default '{}'::jsonb,
  gesture_contract jsonb not null default '{}'::jsonb,
  state_machine jsonb not null default '{}'::jsonb,
  animation_clips jsonb not null default '{}'::jsonb,
  performance_budget jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('draft','active','deprecated')),
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);
alter table public.live_character_assets add column if not exists catalog_character_id uuid references public.agent_character_catalog(id) on delete set null;
alter table public.live_character_assets add column if not exists asset_source text not null default 'uploaded';
alter table public.live_character_assets drop constraint if exists live_character_assets_check;
alter table public.live_character_assets add constraint live_character_assets_check check (
  owner_user_id is not null or agent_id is not null or (asset_source='platform_catalog' and catalog_character_id is not null)
);
create unique index if not exists live_character_assets_platform_catalog_uidx on public.live_character_assets(catalog_character_id)
where catalog_character_id is not null and asset_source='platform_catalog';
create index if not exists live_character_asset_contracts_asset_idx on public.live_character_asset_contracts(asset_id);
create index if not exists live_character_asset_contracts_status_idx on public.live_character_asset_contracts(status);
alter table public.live_character_asset_contracts enable row level security;
drop policy if exists live_character_asset_contract_read on public.live_character_asset_contracts;
create policy live_character_asset_contract_read on public.live_character_asset_contracts for select to authenticated using (
  exists (select 1 from public.live_character_assets a where a.id=live_character_asset_contracts.asset_id
    and a.status='active' and a.moderation_status='approved'
    and (a.owner_user_id=(select auth.uid())
      or exists(select 1 from public.agents ag where ag.id=a.agent_id and ag.owner_user_id=(select auth.uid()))
      or (a.owner_user_id is null and a.agent_id is null and a.asset_source='platform_catalog')
      or (select private.has_platform_permission('admin.manage'))))
);
drop policy if exists live_character_asset_contract_admin_write on public.live_character_asset_contracts;
create policy live_character_asset_contract_admin_write on public.live_character_asset_contracts for all to authenticated
using ((select private.has_platform_permission('admin.manage')))
with check ((select private.has_platform_permission('admin.manage')));

insert into public.live_character_assets(owner_user_id,agent_id,catalog_character_id,asset_type,asset_source,name,storage_path,mime_type,metadata,moderation_status,status)
select null,null,c.id,'character','platform_catalog',c.name,'platform://agent-character/'||c.character_key,null,
jsonb_build_object('character_key',c.character_key,'catalog_character_id',c.id,'rights','allpha-original',
'runtime_mode','procedural_humanoid_v1','animation_contract_version','ai-character-animation-v1','platform_ready',true),
'approved','active'
from public.agent_character_catalog c where c.enabled=true
on conflict (catalog_character_id) where catalog_character_id is not null and asset_source='platform_catalog'
do update set name=excluded.name,metadata=excluded.metadata,status='active',moderation_status='approved',updated_at=timezone('utc',now());

insert into public.live_character_asset_contracts(asset_id,contract_version,source_kind,component_name,rig_profile,body_channels,face_channels,viseme_contract,gesture_contract,state_machine,animation_clips,performance_budget,metadata)
select a.id,'ai-character-animation-v1','platform_procedural','PlatformAgentCharacter','procedural-humanoid-v1',
'["root","pelvis","spine","chest","neck","head","left_upper_arm","left_forearm","left_hand","right_upper_arm","right_forearm","right_hand","left_thigh","left_shin","left_foot","right_thigh","right_shin","right_foot"]'::jsonb,
'["left_eye","right_eye","brows","mouth","jaw","cheeks"]'::jsonb,
jsonb_build_object('source','voice_audio_level','mode','amplitude_proxy','range',jsonb_build_array(0,1),'mouth_open_mapping','level','jaw_mapping','level*0.55','phoneme_exactness','not_claimed'),
jsonb_build_object('source','deterministic_runtime_state','idle','micro_sway','listening','attentive_head_tilt','thinking','head_shift_plus_hand_rest','speaking','open_gesture_plus_weight_shift','emphasis','short_hand_raise','greeting','wave','acknowledge','head_nod','farewell','wave'),
jsonb_build_object('states',jsonb_build_array('idle','listening','thinking','speaking','emphasis','greeting','acknowledge','farewell'),'priority',jsonb_build_object('farewell',90,'greeting',80,'emphasis',70,'speaking',60,'thinking',50,'listening',40,'acknowledge',35,'idle',10),'interruptible',true,'transition_ms',180),
jsonb_build_object('idle',jsonb_build_object('loop',true,'speed',1),'listening',jsonb_build_object('loop',true,'speed',1),'thinking',jsonb_build_object('loop',true,'speed',1),'speaking',jsonb_build_object('loop',true,'speed',1.05),'emphasis',jsonb_build_object('loop',false,'speed',1),'greeting',jsonb_build_object('loop',false,'speed',1),'acknowledge',jsonb_build_object('loop',false,'speed',1),'farewell',jsonb_build_object('loop',false,'speed',1)),
jsonb_build_object('animation_update_hz',60,'mobile_low_power','reduce_gesture_frequency','no_server_frame_persistence',true),
jsonb_build_object('rights','allpha-original','platform_ready',true,'asset_delivery','procedural')
from public.live_character_assets a where a.asset_source='platform_catalog'
on conflict(asset_id) do update set contract_version=excluded.contract_version,source_kind=excluded.source_kind,component_name=excluded.component_name,rig_profile=excluded.rig_profile,
body_channels=excluded.body_channels,face_channels=excluded.face_channels,viseme_contract=excluded.viseme_contract,gesture_contract=excluded.gesture_contract,state_machine=excluded.state_machine,
animation_clips=excluded.animation_clips,performance_budget=excluded.performance_budget,metadata=excluded.metadata,status='active',updated_at=timezone('utc',now());

-- Canonical selection: platform catalog characters are selectable, while user/agent assets remain ownership-scoped.
create or replace function private.select_live_character(p_live_session_id uuid,p_asset_id uuid,p_collaboration_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns public.live_session_character_bindings language plpgsql security definer set search_path to '' as $function$
declare s public.live_sessions; a public.live_character_assets; c public.live_agent_collaborations; b public.live_session_character_bindings;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into s from public.live_sessions where id=p_live_session_id and host_user_id=(select auth.uid()) for update;
  if s.id is null then raise exception 'LIVE_SESSION_NOT_FOUND_OR_NOT_OWNED'; end if;
  if s.status not in ('draft','scheduled','live') then raise exception 'LIVE_SESSION_NOT_CHARACTER_BINDABLE'; end if;
  select * into a from public.live_character_assets where id=p_asset_id and status='active' and moderation_status='approved'
    and (owner_user_id=(select auth.uid())
      or exists(select 1 from public.agents ag where ag.id=live_character_assets.agent_id and ag.owner_user_id=(select auth.uid()))
      or (owner_user_id is null and agent_id is null and asset_source='platform_catalog'));
  if a.id is null then raise exception 'LIVE_CHARACTER_ASSET_NOT_AVAILABLE'; end if;
  if p_collaboration_id is not null then
    select * into c from public.live_agent_collaborations where id=p_collaboration_id and live_session_id=p_live_session_id and owner_user_id=(select auth.uid())
      and status='active' and consent_status='approved' and risk_decision='allow';
    if c.id is null then raise exception 'LIVE_COLLAB_NOT_ACTIVE'; end if;
    if a.agent_id is not null and a.agent_id <> c.agent_id then raise exception 'LIVE_CHARACTER_AGENT_MISMATCH'; end if;
  end if;
  update public.live_session_character_bindings set status='removed',removed_at=timezone('utc',now()),updated_at=timezone('utc',now())
  where live_session_id=p_live_session_id and status='active';
  insert into public.live_session_character_bindings(live_session_id,live_agent_collaboration_id,asset_id,selected_by_user_id,status,metadata)
  values(p_live_session_id,p_collaboration_id,p_asset_id,(select auth.uid()),'active',coalesce(p_metadata,'{}'::jsonb)) returning * into b;
  return b;
end;$function$;
revoke all on function public.select_live_character(uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.select_live_character(uuid,uuid,uuid,jsonb) to authenticated;

create or replace function public.list_live_character_runtime_catalog(p_agent_id uuid default null)
returns table(asset_id uuid,character_id uuid,character_key text,character_name text,archetype text,asset_type text,asset_source text,metadata jsonb,contract jsonb)
language sql security definer set search_path to '' as $function$
select a.id,c.id,c.character_key,c.name,c.archetype,a.asset_type,a.asset_source,a.metadata,
jsonb_build_object('id',ac.id,'version',ac.contract_version,'source_kind',ac.source_kind,'component_name',ac.component_name,'rig_profile',ac.rig_profile,
'body_channels',ac.body_channels,'face_channels',ac.face_channels,'viseme_contract',ac.viseme_contract,'gesture_contract',ac.gesture_contract,
'state_machine',ac.state_machine,'animation_clips',ac.animation_clips,'performance_budget',ac.performance_budget)
from public.live_character_assets a
left join public.agent_character_catalog c on c.id=a.catalog_character_id
left join public.live_character_asset_contracts ac on ac.asset_id=a.id and ac.status='active'
where a.status='active' and a.moderation_status='approved'
and ((a.asset_source='platform_catalog' and c.enabled=true) or (p_agent_id is not null and a.agent_id=p_agent_id))
order by (a.asset_source='platform_catalog') desc,c.sort_order nulls last,a.updated_at desc;
$function$;
revoke all on function public.list_live_character_runtime_catalog(uuid) from public,anon;
grant execute on function public.list_live_character_runtime_catalog(uuid) to authenticated;
