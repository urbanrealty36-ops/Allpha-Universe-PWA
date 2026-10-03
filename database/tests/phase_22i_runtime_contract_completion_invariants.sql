-- Phase 22I — runtime contract completion invariants.
begin;
select plan(10);

select is(
  (select count(*) from public.live_character_assets where asset_source='platform_catalog' and status='active' and moderation_status='approved'),
  34::bigint,
  '34 platform AI Character runtime assets are active and approved'
);

select is(
  (select count(*) from public.live_character_asset_contracts c join public.live_character_assets a on a.id=c.asset_id where a.asset_source='platform_catalog' and c.status='active'),
  34::bigint,
  'all platform AI Character assets have active animation contracts'
);

select ok(
  not exists (
    select 1 from public.live_character_assets a
    left join public.live_character_asset_contracts c on c.asset_id=a.id and c.status='active'
    where a.asset_source='platform_catalog' and a.status='active' and a.moderation_status='approved' and c.id is null
  ),
  'no active platform character is missing its animation contract'
);

select ok(
  not exists (
    select 1 from public.live_character_asset_contracts
    where contract_version='ai-character-animation-v1'
      and jsonb_array_length(body_channels) < 18
  ),
  'v1 contract exposes the full-body channel baseline'
);

select ok(
  not exists (
    select 1 from public.live_character_asset_contracts
    where contract_version='ai-character-animation-v1'
      and jsonb_array_length(face_channels) < 6
  ),
  'v1 contract exposes face/eye/mouth channel baseline'
);

select ok(
  not exists (
    select 1 from public.live_character_asset_contracts
    where contract_version='ai-character-animation-v1'
      and coalesce(viseme_contract->>'mode','') <> 'amplitude_proxy'
  ),
  'v1 voice-to-mouth contract is explicitly amplitude-proxy and does not claim phoneme exactness'
);

select ok(
  not exists (
    select 1 from public.live_character_asset_contracts
    where contract_version='ai-character-animation-v1'
      and not (state_machine->'states' @> '["idle","listening","thinking","speaking","emphasis","greeting","acknowledge","farewell"]'::jsonb)
  ),
  'v1 state machine contains canonical voice and semantic presentation states'
);

select ok(
  not exists (
    select 1 from public.live_character_asset_contracts
    where contract_version='ai-character-animation-v1'
      and coalesce(performance_budget->>'no_server_frame_persistence','false') <> 'true'
  ),
  'animation frames remain client/runtime presentation state'
);

select is(
  (select count(*) from public.uniform_catalog where status='published' and moderation_status='approved'),
  8::bigint,
  '8 published approved platform uniforms remain available'
);

select is(
  (select count(*) from public.user_characters),
  0::bigint,
  'no fabricated user character records are seeded for runtime tests'
);

select * from finish();
rollback;
