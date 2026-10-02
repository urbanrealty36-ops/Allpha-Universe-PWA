-- Phase 11A.14 activates the first real OpenAI provider/model configuration.
-- Secret material remains outside PostgreSQL and must be bound to the FastAPI runtime
-- through OPENAI_API_KEY.
insert into public.ai_providers (
  provider_key,
  display_name,
  adapter,
  base_url,
  credential_env_var,
  enabled,
  metadata
)
values (
  'openai',
  'OpenAI',
  'openai_compatible',
  'https://api.openai.com/v1',
  'OPENAI_API_KEY',
  true,
  jsonb_build_object(
    'activation_phase', '11A.14',
    'secret_storage', 'server_environment_only'
  )
)
on conflict (provider_key) do update
set
  display_name = excluded.display_name,
  adapter = excluded.adapter,
  base_url = excluded.base_url,
  credential_env_var = excluded.credential_env_var,
  enabled = excluded.enabled,
  metadata = public.ai_providers.metadata || excluded.metadata,
  updated_at = timezone('utc', now());

insert into public.ai_models (
  provider_id,
  model_key,
  model_identifier,
  display_name,
  enabled,
  context_window_tokens,
  max_output_tokens,
  input_cost_per_1m,
  output_cost_per_1m,
  capabilities,
  metadata
)
select
  p.id,
  'gpt-6-luna',
  'gpt-6-luna',
  'GPT-6 Luna',
  true,
  128000,
  4096,
  0.05,
  0.25,
  '["ai.generate","text"]'::jsonb,
  jsonb_build_object(
    'activation_phase', '11A.14',
    'pricing_source', 'OpenAI API pricing',
    'selection_note', 'Initial Allpha text-generation runtime model'
  )
from public.ai_providers p
where p.provider_key = 'openai'
on conflict (provider_id, model_key) do update
set
  model_identifier = excluded.model_identifier,
  display_name = excluded.display_name,
  enabled = excluded.enabled,
  context_window_tokens = excluded.context_window_tokens,
  max_output_tokens = excluded.max_output_tokens,
  input_cost_per_1m = excluded.input_cost_per_1m,
  output_cost_per_1m = excluded.output_cost_per_1m,
  capabilities = excluded.capabilities,
  metadata = public.ai_models.metadata || excluded.metadata,
  updated_at = timezone('utc', now());

insert into public.ai_routing_policies (
  policy_key,
  scope_type,
  scope_id,
  priority,
  enabled,
  required_capabilities,
  allowed_model_ids,
  fallback_model_ids,
  max_context_tokens,
  max_output_tokens,
  max_cost_usd,
  timeout_ms,
  max_retries,
  safety_policy,
  metadata
)
select
  'allpha-default-openai',
  'global',
  null,
  100,
  true,
  '{}'::text[],
  array[m.id],
  '{}'::uuid[],
  120000,
  4096,
  0.10,
  30000,
  1,
  jsonb_build_object(
    'mode', 'optional',
    'enabled', false,
    'max_input_chars', 100000
  ),
  jsonb_build_object(
    'activation_phase', '11A.14'
  )
from public.ai_models m
join public.ai_providers p on p.id = m.provider_id
where p.provider_key = 'openai'
  and m.model_key = 'gpt-6-luna'
on conflict (policy_key) do update
set
  scope_type = excluded.scope_type,
  scope_id = excluded.scope_id,
  priority = excluded.priority,
  enabled = excluded.enabled,
  required_capabilities = excluded.required_capabilities,
  allowed_model_ids = excluded.allowed_model_ids,
  fallback_model_ids = excluded.fallback_model_ids,
  max_context_tokens = excluded.max_context_tokens,
  max_output_tokens = excluded.max_output_tokens,
  max_cost_usd = excluded.max_cost_usd,
  timeout_ms = excluded.timeout_ms,
  max_retries = excluded.max_retries,
  safety_policy = excluded.safety_policy,
  metadata = public.ai_routing_policies.metadata || excluded.metadata,
  updated_at = timezone('utc', now());