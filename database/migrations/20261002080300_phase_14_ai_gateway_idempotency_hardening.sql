-- Phase 14 idempotency hardening mirror.
alter table public.ai_gateway_requests add column if not exists idempotency_reused boolean not null default false;
-- create_ai_gateway_request returns an existing row with idempotency_reused=true and never starts a duplicate provider execution.
