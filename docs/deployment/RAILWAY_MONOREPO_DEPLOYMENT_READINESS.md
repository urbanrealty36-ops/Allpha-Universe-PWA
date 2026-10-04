# Allpha Universe — Railway Monorepo Deployment Readiness

Date: 2026-10-04

## Purpose
Prepare the canonical urbanrealty36-ops/Allpha-Universe-PWA monorepo for Railway runtime observation and CW-02 activation evidence. This is not a production-green declaration.

## Services
Deploy the same repository and main branch as three Railway services:

1. allpha-api — railway/api.Dockerfile — port 8000 — Uvicorn/FastAPI — health /health.
2. allpha-web — railway/web.Dockerfile — port 3000 — existing Next.js Web PWA.
3. allpha-admin — railway/admin.Dockerfile — port 3001 — existing Admin PWA.

Railway is only the execution environment. Supabase remains the canonical identity, data, RLS, RPC and authority boundary.

## API environment contract
Required:
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY

Required for real AI Gateway provider execution:
- OPENAI_API_KEY

Recommended:
- SUPABASE_JWT_AUDIENCE=authenticated
- ALLPHA_PUBLIC_WEB_URL=<web-service-url>
- ALLPHA_CORS_ORIGINS=<web-service-url>,<admin-service-url>

Existing optional contracts:
- SUPABASE_SERVICE_ROLE_KEY
- MIDTRANS_SERVER_KEY
- MIDTRANS_CLIENT_KEY
- MIDTRANS_ENVIRONMENT=sandbox
- ALLPHA_SECURITY_PEPPER
- TRUSTED_PROXY_IPS

Never commit secrets.

## Deployment sequence
1. Deploy API first.
2. Verify /health = HTTP 200.
3. Verify unauthenticated /api/v1/runtime/activation = HTTP 401.
4. Verify authenticated /api/v1/runtime/activation using a real Supabase session.
5. Only then deploy Web and Admin.
6. Run apps/api/tests/cw02_authenticated_runtime_evidence.py against the real API.
7. Continue AI Gateway, Feed/Discovery and Storage/Moderation evidence.

## CW-02 rule
Railway reachability does not make CW-02 GREEN. Required evidence remains:
- authenticated FastAPI runtime;
- real Agent Runtime planner/execution;
- actual AI Gateway provider call and telemetry;
- Feed/Discovery HTTP/browser evidence;
- Storage upload → registration → moderation → approved read;
- authorized admin moderation;
- build/test evidence.

Do not seed fake Agent, Content, credits, provider results, verification evidence, or mock runtime state.

## Production boundary
This preparation does not change the canonical deployment order:
feature/domain/engine/Memory/RAG/orchestration completion → QA → runtime verification → GREEN → CI/CD → staging/production readiness → Railway/Vercel production → final Production GREEN.

Only CW-08 / Phase 35 may produce final GREEN.
