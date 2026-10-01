# PHASE 05 — Identity, Authentication & Authorization

## Status

**Implemented on main.**

Phase 05 establishes real identity, authentication and authorization boundaries on top of the Phase 04 PostgreSQL foundation.

## Implemented database foundation

- Platform roles: `user`, `platform_admin`, `super_admin`
- Permission registry (8 canonical permissions)
- Role → permission mapping
- User → platform role assignment
- Organization-member role assignment foundation
- Default `user` role provisioning for every newly created Supabase Auth user
- Auth user → `public.users` / `public.profiles` provisioning trigger
- RLS on authorization tables
- Browser-role least-privilege grants
- Private permission-check function with pinned `search_path`
- No authorization based on `raw_user_meta_data`
- No service-role/secret credential exposed to browser
- Account status enforcement in the API

Supabase recommends application-owned public user tables referencing `auth.users`, protected with RLS, and documents the trigger pattern for provisioning user records.

## FastAPI authentication

Implemented:

- JWT Bearer authentication dependency
- JWKS-based signature verification
- issuer validation
- audience validation
- expiry validation
- required claim validation
- authenticated-role validation
- UUID subject validation
- active/provisioned account validation
- standardized 401/403 error contracts

Supabase currently recommends asymmetric JWT signing keys and JWKS-based verification for backend services.

## Supabase data access

The FastAPI server forwards the verified caller's bearer token to Supabase PostgREST using the project's publishable key. This keeps the caller's RLS context instead of bypassing RLS with a service-role credential.

## Authorization

Backend permission resolution is based on:

User → User Role → Platform Role → Role Permission → Permission

The browser can read its own authorization context but cannot mutate role/permission configuration.

## Next.js authentication

User PWA and Super Admin both now contain:

- `@supabase/ssr`
- `@supabase/supabase-js`
- browser Supabase client
- server Supabase client
- Next.js 16 `proxy.ts`
- Auth sign-in UI
- Web sign-up flow
- PKCE callback exchange route
- sign-out route
- authenticated API client that sends the Supabase access token

Supabase's current Next.js guidance recommends `@supabase/ssr`, cookie-based server clients, and `getClaims()` in Proxy for token verification/refresh.

The Admin proxy additionally calls the Backend API and requires `platform_admin` or `super_admin`. Client-side state is not trusted for administrative authorization.

## No business seed data

No users, organizations, Agents, transactions, content or other business records were created for this phase.

The canonical role and permission rows are security configuration required to operate the authorization system, not demo/business records.

## Verification

Executed against AllphaDb-Universe:

- Phase 05 pgTAP foundation assertions: 9 planned / 9 passed.
- Auth user count remains zero because no synthetic user was created.
- App user count remains zero.
- Auth provisioning trigger exists.
- Anonymous execute on the private permission function: false.
- Authenticated execute on the private permission function: true.
- Authorization tables expose only SELECT to authenticated browser role.
- No anonymous grants are present on authorization tables.
- Supabase security advisor retains only the six intentional INFO findings for backend-authoritative Phase 04 security tables.
- Performance advisor has no Phase 05 WARN; remaining INFO findings are unused indexes in the empty database plus the pre-existing Phase 04 foundation observations.

## Required environment

Web/Admin:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

FastAPI:

```text
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_JWT_AUDIENCE=authenticated
```

No service-role key belongs in browser environment variables.

## Admin bootstrap

No administrator account is fabricated by this phase. The first real platform administrator must be assigned through a controlled backend/database bootstrap using a real Supabase Auth user ID. This is intentionally not automated with a guessed or synthetic identity.

## Not yet claimed

Phase 05 does not claim:
- full product-domain authorization
- Agent authorization/runtime
- complete Admin CRUD
- MFA enforcement
- marketplace/commerce authorization
- workflow authorization
- final E2E
- CI/CD
- production deployment
- Runtime Green
