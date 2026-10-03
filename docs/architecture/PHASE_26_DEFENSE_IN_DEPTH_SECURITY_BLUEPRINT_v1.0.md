# PHASE 26 — DEFENSE-IN-DEPTH SECURITY BLUEPRINT v1.0
## Objective
Minimize exploitable attack surface across Frontend, API, Backend, Auth, Database, Storage, AI, Commerce, Admin and connected devices. Security is layered; no single control is treated as sufficient.

## Security boundary
Browser → Next.js security headers → FastAPI → Auth/JWT verification → Domain authorization → Policy/Permission/Risk/Approval → Supabase RLS/RPC → external providers.
The browser never becomes an authority boundary and never receives service-role or payment secrets.

## 1. Frontend
- CSP, frame denial, MIME sniffing protection, strict referrer policy, Permissions Policy, COOP/CORP.
- Avoid dangerous HTML injection; sanitize any rich content before rendering.
- Never place secrets in NEXT_PUBLIC_* variables.
- Validate route parameters and API response shapes.
- Do not trust hidden UI controls for authorization.
- Treat all client state as untrusted.
- HTTPS-only production deployment with HSTS at edge.

## 2. API / Backend
- Strict CORS; no wildcard methods/headers.
- Origin checks on state-changing browser requests.
- Request body size ceiling.
- Request ID propagation.
- Authentication before protected domain work.
- Pydantic validation at API boundary.
- Rate limiting with stricter limits for auth/payment/payout/agent/AI routes.
- Service-role access only inside backend service functions.
- Generic external error messages; never leak stack traces/secrets.
- Idempotency for payment/commerce/agent actions where the domain already supports it.

## 3. Auth / Session
- JWT signature, issuer, audience, algorithm and required-claim validation.
- Only authenticated Supabase role accepted by API.
- Never use editable user metadata as authorization source.
- Authorization comes from canonical role/permission/policy records.
- Sensitive operations should additionally validate current session/revocation state before final production gate.
- Short access-token lifetime and refresh/session revocation policy must be configured in Supabase Auth.

## 4. Database / RLS
- RLS on exposed user-data tables.
- Owner predicates plus WITH CHECK on updates.
- Privileged SECURITY DEFINER functions require explicit auth/permission checks and restricted EXECUTE.
- No direct frontend privileged DB access.
- No SQLite.
- Audit all high-risk state transitions.
- Use existing canonical ledger/commerce/economy sources; never duplicate financial authority.

## 5. Prompt Injection / AI
- AI Gateway is the single AI boundary.
- User prompt content is untrusted data.
- Current Phase 26 adds a lightweight injection-risk gate for obvious jailbreak/system-prompt extraction patterns.
- The gate is not a proof of safety. Retrieval/tool outputs must also be treated as untrusted and isolated from authority instructions.
- Model output can never grant permission, approval, entitlement, payment authority, policy override or identity authority.
- Tool calls require existing Agent Runtime + capability + policy + risk + approval controls.
- High-risk AI actions remain human-approved.

## 6. CSRF / XSRF
- Bearer-token API calls are not protected by cookie authentication alone and should not be silently converted to cookie-authenticated state changes.
- Browser state-changing requests receive Origin validation.
- If future browser session cookies are introduced for API authentication, add synchronizer-token or signed double-submit CSRF protection before enabling mutation routes.

## 7. URL / SSRF
Central helper blocks:
- non-HTTPS schemes by default
- embedded credentials
- private/link-local/loopback IP targets
- oversized URLs
- hosts outside explicit allowlists
DNS rebinding protection must be enforced by the actual outbound HTTP client at connection time; URL parsing alone is insufficient.

## 8. File Upload
Every upload domain must enforce:
- byte-size limit
- allowlisted MIME types
- extension allowlist
- filename normalization
- active-content blocking
- server-side content/magic-byte verification
- malware scanning where required
- storage bucket RLS/policy
- randomized object keys
- no executable serving path
- download/content-disposition isolation for untrusted files

## 9. Rate Limit / Abuse
Phase 26 API middleware adds an in-process baseline limiter. This is not sufficient for multi-instance production by itself.
Production must add an edge/WAF or distributed limiter keyed by IP + authenticated user/device + route class, with separate buckets for login, OTP, AI generation, messaging, commerce, payout, uploads and admin.

## 10. Connected IP / Devices
Added `security_devices` with:
- owner
- hashed IP
- hashed user-agent
- device label
- first/last seen
- revocation state
Raw IP/user-agent are not persisted by this registry.
Existing `security_events` remains the canonical security-event surface; no duplicate security-event engine is created.

## 11. Commerce / Payout
- All marketplace payments use centralized Allpha Commerce Payment boundary and Midtrans.
- Seller payout is high-risk.
- Payout request → Risk → Approval → Super Admin → Disbursement record.
- No automatic transfer is fabricated.
- Payment secrets remain backend-only.
- Webhook signature verification and idempotent settlement remain authoritative.

## 12. Admin
- Super Admin operations are permission-gated.
- Never trust admin UI route visibility.
- Sensitive admin actions require backend authorization.
- Audit every approval, moderation, configuration, entitlement, payment and payout transition.

## 13. Security operations
Required production controls:
- WAF / DDoS protection
- TLS/HSTS
- centralized logs/SIEM
- alerting for auth anomalies, rate-limit spikes, privilege changes, payout anomalies, webhook failures and repeated prompt-injection attempts
- dependency/SBOM scanning
- secret rotation
- backup/restore tests
- incident response and kill-switch procedures
- periodic RLS/security-advisor review
- penetration testing before production release

## 14. Remaining hardening gates
Phase 26 is not GREEN until:
1. production edge/WAF rate limiting is configured
2. trusted proxy/IP model is fixed and tested
3. session revocation checks are wired for sensitive operations
4. file magic-byte/AV scanning is wired to each upload domain
5. SSRF-safe outbound client is used for every server-side URL fetch
6. AI injection/evaluation tests cover retrieval/tool-output attacks, not only regex patterns
7. dependency and secret scanning are green
8. authenticated security E2E is executed
9. device registration/revocation E2E is executed
10. final Security Advisor + RLS + API security review is clean or explicitly accepted with documented exceptions
