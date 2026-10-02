do $$
declare
  provider_count integer;
  model_count integer;
  policy_count integer;
  env_var text;
  model_capabilities jsonb;
begin
  select count(*) into provider_count
  from public.ai_providers
  where provider_key = 'openai' and enabled = true;

  if provider_count <> 1 then
    raise exception 'Expected exactly one enabled OpenAI provider';
  end if;

  select credential_env_var into env_var
  from public.ai_providers
  where provider_key = 'openai'
  limit 1;

  if env_var <> 'OPENAI_API_KEY' then
    raise exception 'OpenAI provider must reference OPENAI_API_KEY and never store secret material';
  end if;

  select count(*) into model_count
  from public.ai_models m
  join public.ai_providers p on p.id = m.provider_id
  where p.provider_key = 'openai'
    and m.model_key = 'gpt-6-luna'
    and m.enabled = true;

  if model_count <> 1 then
    raise exception 'Expected exactly one enabled Allpha OpenAI runtime model';
  end if;

  select capabilities into model_capabilities
  from public.ai_models m
  join public.ai_providers p on p.id = m.provider_id
  where p.provider_key = 'openai'
    and m.model_key = 'gpt-6-luna'
  limit 1;

  if not (model_capabilities ? 'ai.generate') then
    raise exception 'Runtime model must expose ai.generate capability';
  end if;

  select count(*) into policy_count
  from public.ai_routing_policies
  where policy_key = 'allpha-default-openai'
    and enabled = true;

  if policy_count <> 1 then
    raise exception 'Expected exactly one enabled Allpha OpenAI routing policy';
  end if;
end $$;
