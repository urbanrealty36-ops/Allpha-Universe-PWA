-- Phase 22H invariants: platform-ready Human uniforms + GPT-Live voice binding.
with checks as (
  select 'platform_uniform_catalog_8' name, ((select count(*) from public.uniform_catalog where metadata->>'platform_ready'='true' and status='published' and moderation_status='approved') >= 8) passed
  union all select 'voice_binding_table_rls', (select relrowsecurity from pg_class where oid='public.live_session_voice_bindings'::regclass)
  union all select 'claim_uniform_rpc', exists(select 1 from pg_proc where proname='claim_platform_uniform')
  union all select 'voice_prepare_rpc', exists(select 1 from pg_proc where proname='prepare_live_voice_binding')
  union all select 'voice_transition_rpc', exists(select 1 from pg_proc where proname='transition_live_voice_binding')
  union all select 'anon_claim_denied', not has_function_privilege('anon','public.claim_platform_uniform(uuid)','execute')
  union all select 'anon_voice_prepare_denied', not has_function_privilege('anon','public.prepare_live_voice_binding(uuid,uuid,text,text)','execute')
  union all select 'voice_provider_gpt_live', not exists(select 1 from public.live_session_voice_bindings where provider <> 'openai_gpt_live')
  union all select 'no_live_voice_seed_rows', ((select count(*) from public.live_session_voice_bindings)=0)
  union all select 'no_user_uniform_seed_rows', ((select count(*) from public.user_uniforms)=0)
)
select count(*) filter(where passed) passed,count(*) total,count(*) filter(where not passed) failed,
jsonb_agg(jsonb_build_object('name',name,'passed',passed) order by name) checks
from checks;
