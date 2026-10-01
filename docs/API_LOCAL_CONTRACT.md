# Local API Contract Boundary

Base URL: http://localhost:8000

FastAPI interactive contract:
- /docs
- /redoc
- /health

All domain endpoints live under /api/v1.

## Authentication contract

Supabase Auth is the identity provider. The browser sends the Supabase access token as:

`Authorization: Bearer <access_token>`

The FastAPI boundary verifies:
1. JWT signature against the project's Supabase JWKS.
2. issuer = Supabase Auth issuer.
3. audience = `authenticated`.
4. expiration and required JWT claims.
5. JWT role = `authenticated`.
6. UUID subject.

After cryptographic verification, the API resolves the authoritative Allpha identity from Supabase PostgreSQL using the caller's bearer token and RLS.

Endpoints:
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/permissions`
- `GET /api/v1/auth/organizations`

Unauthenticated access returns HTTP 401. An authenticated JWT without an active/provisioned Allpha identity returns HTTP 403. Missing permissions return HTTP 403.

## Authorization contract

Authorization is server authoritative.

Canonical platform roles:
- `user`
- `platform_admin`
- `super_admin`

Canonical permissions are stored in PostgreSQL and mapped through role-permission relationships. Browser roles have SELECT-only access to authorization configuration. Role assignment/mutation is backend/server authoritative.

No authorization decision relies on `raw_user_meta_data`.

## Supabase RLS contract

The API forwards the verified user's bearer token to Supabase PostgREST for user-scoped reads, preserving PostgreSQL RLS. The API never places a service-role/secret credential in browser code.

## Web/Admin authentication

Both Next.js applications use `@supabase/ssr`:
- browser client for sign-in/sign-up
- server client for cookie-based sessions
- Next.js 16 `proxy.ts` calls `auth.getClaims()` for session verification/refresh
- Admin proxy additionally asks the Backend API for authoritative admin permissions before allowing protected routes

Required browser environment:
`NEXT_PUBLIC_SUPABASE_URL`
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
`NEXT_PUBLIC_API_URL`

Required FastAPI environment:
`SUPABASE_URL`
`SUPABASE_PUBLISHABLE_KEY`
`SUPABASE_JWT_AUDIENCE` (defaults to `authenticated`)

The publishable key is not an authorization secret. No service-role/secret key is required by the current authenticated request path.

## Remaining domain contracts

The current domain registry intentionally returns HTTP 503 with code `DOMAIN_DATA_NOT_CONNECTED` until the authoritative service/repository implementation for that domain is activated. This is a real operational state, not mock data.

Agent command has a dedicated contract:
POST /api/v1/agents/{agent_id}/command

Its runtime implementation will enforce:
Authentication → Authorization → Agent Permission → Policy → Risk → Human Approval when required → Workflow/Mission → Tool → Audit → Realtime.

No frontend or admin application may call Supabase privileged operations directly.
