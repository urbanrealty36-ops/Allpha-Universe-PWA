# Allpha Universe — AI Gateway & Model Router v1.0

Phase 14 is the single server-side AI execution boundary for Allpha Universe. Web, Admin, Agent Runtime and future Live/Simulation systems call the Gateway; they never call a model provider directly.

## Implemented

- Provider registry with adapter, endpoint, enabled state and server credential environment-variable reference.
- Model registry with context window, output ceiling, capability metadata and cost metadata.
- Normalized model-capability table for future capability administration.
- Global/user/Agent routing policies with priority, allow-list, fallback list, context/output/cost budgets, timeout, retry and safety envelope.
- Gateway request ledger, attempt ledger and usage telemetry.
- OpenAI-compatible chat-completions adapter and Anthropic Messages adapter.
- Capability routing and policy-required capabilities.
- Context and output budgets.
- Retry/fallback across configured candidate models.
- Cost and latency telemetry.
- Input fingerprint and response hash; raw prompts/responses are not persisted.
- Legitimate not-configured behavior when no provider/model is enabled.

## Security contract

1. Browser never receives provider credentials.
2. Browser never calls a provider API.
3. Provider credential values are not stored in PostgreSQL.
4. PostgreSQL stores only the credential environment-variable name.
5. Agent requests require current Human ownership.
6. Gateway request, attempt and usage records are owner-scoped by RLS.
7. Raw prompt and response bodies are not persisted.
8. Routing safety can fail closed when a policy sets mode=required without an enabled safety configuration.
9. No provider/model seed records are inserted.

## Routing

Request → Auth → Agent ownership → Policy → Capability match → Context/Safety budget → Model candidates → Provider adapter → Retry/Fallback → Telemetry

## Configuration

Provider/model/policy records are intentionally empty. Authoritative configuration is a later Super Admin control-plane concern (Phase 27). Provider secret values are server environment configuration and are never returned by the API.

## Runtime status

Foundation is implemented. Final GREEN remains blocked until a real provider/model is configured and authenticated runtime generation, retry/fallback, cost/latency telemetry, safety behavior and end-to-end verification are executed.


## Security advisor note
Supabase Security Advisor reports the authenticated SECURITY DEFINER RPC pattern as warning 0029. This is intentional for the Phase 14 write boundary because direct table INSERT/UPDATE privileges remain revoked. The four gateway RPCs pin `search_path=''`, schema-qualify database objects, validate `auth.uid()` ownership, and are the only authenticated write path. This warning is therefore an acknowledged architecture finding, not an unreviewed secret/authorization bypass.
