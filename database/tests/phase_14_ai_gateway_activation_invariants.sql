begin;
select plan(18);

select ok(
  exists(select 1 from public.ai_providers where provider_key='openai' and enabled=true),
  'an enabled OpenAI provider is configured'
);
select ok(
  exists(select 1 from public.ai_providers where provider_key='openai' and credential_env_var='OPENAI_API_KEY'),
  'OpenAI credential is referenced only by environment-variable name'
);
select ok(
  not exists(select 1 from public.ai_providers where metadata ? 'api_key' or metadata ? 'secret' or metadata ? 'credential'),
  'provider metadata does not contain secret fields'
);
select ok(
  exists(
    select 1
    from public.ai_models m
    join public.ai_providers p on p.id=m.provider_id
    where p.provider_key='openai'
      and p.enabled=true
      and m.enabled=true
      and m.model_key='gpt-6-luna'
      and 'ai.generate' = any(select jsonb_array_elements_text(m.capabilities))
  ),
  'enabled OpenAI generation model exists'
);
select ok(
  exists(
    select 1
    from public.ai_routing_policies r
    where r.policy_key='allpha-default-openai'
      and r.enabled=true
      and r.scope_type='global'
  ),
  'enabled global Allpha routing policy exists'
);
select ok(
  exists(
    select 1
    from public.ai_routing_policies r
    join public.ai_models m on m.id=any(r.allowed_model_ids)
    join public.ai_providers p on p.id=m.provider_id
    where r.policy_key='allpha-default-openai'
      and r.enabled=true
      and m.enabled=true
      and p.enabled=true
  ),
  'default routing policy points to an enabled model/provider'
);
select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='create_ai_gateway_request'
         and has_function_privilege('anon',p.oid,'execute')=false
         and has_function_privilege('authenticated',p.oid,'execute')),
  'gateway request RPC is authenticated-only'
);
select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='record_ai_gateway_attempt'
         and has_function_privilege('anon',p.oid,'execute')=false
         and has_function_privilege('authenticated',p.oid,'execute')),
  'gateway attempt RPC is authenticated-only'
);
select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='record_ai_gateway_outcome'
         and has_function_privilege('anon',p.oid,'execute')=false
         and has_function_privilege('authenticated',p.oid,'execute')),
  'gateway outcome RPC is authenticated-only'
);
select ok(
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='record_ai_usage_event'
         and has_function_privilege('anon',p.oid,'execute')=false
         and has_function_privilege('authenticated',p.oid,'execute')),
  'gateway usage RPC is authenticated-only'
);
select ok(
  exists(select 1 from pg_policies where schemaname='public' and tablename='ai_providers' and cmd='SELECT'),
  'provider catalog has an authenticated read policy'
);
select ok(
  exists(select 1 from pg_policies where schemaname='public' and tablename='ai_models' and cmd='SELECT'),
  'model catalog has an authenticated read policy'
);
select ok(
  exists(select 1 from pg_policies where schemaname='public' and tablename='ai_routing_policies' and cmd='SELECT'),
  'routing policy catalog has an authenticated read policy'
);
select ok(
  exists(select 1 from pg_policies where schemaname='public' and tablename='ai_gateway_requests' and cmd='SELECT'),
  'gateway requests have owner-scoped read policy'
);
select ok(
  exists(select 1 from pg_policies where schemaname='public' and tablename='ai_usage_events' and cmd='SELECT'),
  'usage events have owner-scoped read policy'
);
select results_eq(
  $$select count(*)::bigint from public.ai_gateway_requests$$,
  $$values (0::bigint)$$,
  'no synthetic gateway requests were seeded'
);
select results_eq(
  $$select count(*)::bigint from public.ai_usage_events$$,
  $$values (0::bigint)$$,
  'no synthetic usage events were seeded'
);

select * from finish();
rollback;
