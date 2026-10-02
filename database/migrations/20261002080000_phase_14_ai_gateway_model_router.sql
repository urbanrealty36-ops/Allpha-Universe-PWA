-- Phase 14 — AI Gateway & Model Router
-- No provider/model/business seed data is inserted.

create table if not exists public.ai_providers (
 id uuid primary key default gen_random_uuid(), provider_key text not null unique,
 display_name text not null, adapter text not null check (adapter in ('openai_compatible','anthropic')),
 base_url text not null, credential_env_var text,
 enabled boolean not null default false, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default timezone('utc',now()),
 updated_at timestamptz not null default timezone('utc',now()),
 check (credential_env_var is null or credential_env_var ~ '^[A-Z][A-Z0-9_]{1,127}$')
);

create table if not exists public.ai_models (
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.ai_providers(id) on delete restrict,
 model_key text not null, model_identifier text not null, display_name text not null,
 enabled boolean not null default false, context_window_tokens integer not null check (context_window_tokens > 0),
 max_output_tokens integer check (max_output_tokens is null or max_output_tokens > 0),
 input_cost_per_1m numeric(18,8) check (input_cost_per_1m is null or input_cost_per_1m >= 0),
 output_cost_per_1m numeric(18,8) check (output_cost_per_1m is null or output_cost_per_1m >= 0),
 capabilities jsonb not null default '[]'::jsonb, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()),
 unique(provider_id,model_key)
);

create table if not exists public.ai_model_capabilities (
 model_id uuid not null references public.ai_models(id) on delete cascade,
 capability text not null check (length(trim(capability)) between 1 and 120),
 created_at timestamptz not null default timezone('utc',now()),
 primary key(model_id,capability)
);

create table if not exists public.ai_routing_policies (
 id uuid primary key default gen_random_uuid(), policy_key text not null unique,
 scope_type text not null check (scope_type in ('global','user','agent')), scope_id uuid,
 priority integer not null default 100, enabled boolean not null default false,
 required_capabilities text[] not null default '{}', allowed_model_ids uuid[] not null default '{}',
 fallback_model_ids uuid[] not null default '{}',
 max_context_tokens integer check (max_context_tokens is null or max_context_tokens > 0),
 max_output_tokens integer check (max_output_tokens is null or max_output_tokens > 0),
 max_cost_usd numeric(18,8) check (max_cost_usd is null or max_cost_usd >= 0),
 timeout_ms integer not null default 30000 check (timeout_ms between 1000 and 120000),
 max_retries integer not null default 1 check (max_retries between 0 and 5),
 safety_policy jsonb not null default '{}'::jsonb, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()),
 check ((scope_type='global' and scope_id is null) or (scope_type<>'global' and scope_id is not null))
);

create table if not exists public.ai_gateway_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
 agent_id uuid references public.agents(id) on delete set null, idempotency_key text,
 requested_capabilities text[] not null default '{}', selected_model_id uuid references public.ai_models(id) on delete set null,
 selected_policy_id uuid references public.ai_routing_policies(id) on delete set null,
 status text not null default 'received' check (status in ('received','routing','running','completed','failed','denied','not_configured')),
 safety_status text not null default 'not_evaluated' check (safety_status in ('not_evaluated','allowed','denied','not_configured')),
 input_tokens integer, output_tokens integer, total_tokens integer, estimated_cost_usd numeric(18,8), latency_ms integer,
 response_text_hash text, input_fingerprint text, error_code text, error_message text, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default timezone('utc',now()), completed_at timestamptz
);
create unique index if not exists ai_gateway_requests_user_idempotency_uidx on public.ai_gateway_requests(user_id,idempotency_key) where idempotency_key is not null;
create index if not exists ai_gateway_requests_user_created_idx on public.ai_gateway_requests(user_id,created_at desc);

create table if not exists public.ai_gateway_attempts (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.ai_gateway_requests(id) on delete cascade,
 attempt_no integer not null check (attempt_no >= 1), provider_id uuid not null references public.ai_providers(id) on delete restrict,
 model_id uuid not null references public.ai_models(id) on delete restrict,
 status text not null check (status in ('started','completed','failed','timeout','rate_limited')),
 latency_ms integer, input_tokens integer, output_tokens integer, total_tokens integer, estimated_cost_usd numeric(18,8),
 http_status integer, error_code text, error_message text, created_at timestamptz not null default timezone('utc',now()),
 completed_at timestamptz, unique(request_id,attempt_no)
);
create index if not exists ai_gateway_attempts_request_idx on public.ai_gateway_attempts(request_id,attempt_no);

create table if not exists public.ai_usage_events (
 id uuid primary key default gen_random_uuid(), request_id uuid references public.ai_gateway_requests(id) on delete set null,
 user_id uuid not null references public.users(id) on delete cascade, agent_id uuid references public.agents(id) on delete set null,
 provider_id uuid references public.ai_providers(id) on delete set null, model_id uuid references public.ai_models(id) on delete set null,
 event_type text not null check (event_type in ('request','success','failure','denied','retry')),
 input_tokens integer, output_tokens integer, total_tokens integer, estimated_cost_usd numeric(18,8), latency_ms integer,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default timezone('utc',now())
);
create index if not exists ai_usage_events_user_created_idx on public.ai_usage_events(user_id,created_at desc);

alter table public.ai_providers enable row level security;
alter table public.ai_models enable row level security;
alter table public.ai_model_capabilities enable row level security;
alter table public.ai_routing_policies enable row level security;
alter table public.ai_gateway_requests enable row level security;
alter table public.ai_gateway_attempts enable row level security;
alter table public.ai_usage_events enable row level security;

drop policy if exists ai_providers_authenticated_read on public.ai_providers;
create policy ai_providers_authenticated_read on public.ai_providers for select to authenticated using (enabled=true);
drop policy if exists ai_models_authenticated_read on public.ai_models;
create policy ai_models_authenticated_read on public.ai_models for select to authenticated using (enabled=true and exists(select 1 from public.ai_providers p where p.id=provider_id and p.enabled=true));
drop policy if exists ai_model_capabilities_authenticated_read on public.ai_model_capabilities;
create policy ai_model_capabilities_authenticated_read on public.ai_model_capabilities for select to authenticated using (exists(select 1 from public.ai_models m join public.ai_providers p on p.id=m.provider_id where m.id=model_id and m.enabled=true and p.enabled=true));
drop policy if exists ai_routing_policies_authenticated_read on public.ai_routing_policies;
create policy ai_routing_policies_authenticated_read on public.ai_routing_policies for select to authenticated using (enabled=true and (scope_type='global' or (scope_type='user' and scope_id=auth.uid()) or (scope_type='agent' and exists(select 1 from public.agents a where a.id=scope_id and a.owner_user_id=auth.uid()))));
drop policy if exists ai_gateway_requests_owner_read on public.ai_gateway_requests;
create policy ai_gateway_requests_owner_read on public.ai_gateway_requests for select to authenticated using (user_id=auth.uid());
drop policy if exists ai_gateway_attempts_owner_read on public.ai_gateway_attempts;
create policy ai_gateway_attempts_owner_read on public.ai_gateway_attempts for select to authenticated using (exists(select 1 from public.ai_gateway_requests r where r.id=request_id and r.user_id=auth.uid()));
drop policy if exists ai_usage_events_owner_read on public.ai_usage_events;
create policy ai_usage_events_owner_read on public.ai_usage_events for select to authenticated using (user_id=auth.uid());

revoke all on public.ai_providers,public.ai_models,public.ai_model_capabilities,public.ai_routing_policies,public.ai_gateway_requests,public.ai_gateway_attempts,public.ai_usage_events from anon,authenticated;
grant select on public.ai_providers,public.ai_models,public.ai_model_capabilities,public.ai_routing_policies,public.ai_gateway_requests,public.ai_gateway_attempts,public.ai_usage_events to authenticated;

-- RPC definitions are kept in the authoritative Supabase migration history.
-- This repository migration is the declarative schema mirror used by local/staging migration workflows.
