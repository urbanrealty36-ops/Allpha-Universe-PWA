# Phase 26 — Security Release Gate v1.1

Phase 26 remains OPEN until the live Supabase Security Advisor is clean and the external Auth leaked-password protection control is enabled and rechecked.

## Controls implemented now
- Zero-Trust authentication boundary with JWT algorithm allow-list.
- Session revocation deny-list checked at the FastAPI authentication boundary.
- Device registry with owner-scoped RLS and API-side ownership filtering.
- Centralized nested commerce order ownership guard for BOLA/IDOR defense.
- Existing RBAC permission checks retained; payout admin endpoints now enforce payout.read/review/process.
- Existing ABAC/policy/risk/approval architecture remains authoritative; no duplicate authorization engine introduced.
- RLS coverage check: every public table with RLS has at least one policy.
- Sensitive security/audit/payout policies no longer target the anonymous public role.
- Public SECURITY DEFINER functions: zero callable by anon/authenticated.
- Anonymous EXECUTE default-deny applied to mutation/admin/internal RPCs; only explicitly public discovery/read RPCs remain exposed.
- Distributed rate limiting added behind the existing in-process limiter. Service-only database state is transient security infrastructure, not business source of truth.
- SSRF URL validation now resolves DNS and rejects private/link-local addresses before outbound use.
- CSP baseline added to API/Web; unsafe-eval removed.
- CI now fails closed for API tests and adds secret scan, Python dependency audit, JavaScript dependency audit, and PR dependency review.
- Midtrans settlement remains centralized and service-only.
- No fake business/security fixture data is persisted; live IDOR tests use transaction rollback fixtures.

## Live evidence
- Security Advisor actionable findings: 1 remaining — auth_leaked_password_protection.
- Public SECURITY DEFINER executable by anon/authenticated: 0.
- RLS-enabled public tables without policies: 0.
- Sensitive public-role security policies: 0.
- Distributed limiter live behavior: true, true, false for a 2-request window.
- Horizontal IDOR read/update/delete against an owner-scoped Agent fixture: denied.
- Owner read against the same fixture: allowed.
- Session-revocation RLS cross-principal read: denied.

## Remaining external gate
Supabase Auth leaked-password protection must be enabled in the project's Auth security settings. The current connector exposes Security Advisor and database operations, but does not expose a mutation for this Auth setting. After enabling it, rerun Security Advisor and the Phase 26 release gate.

## Explicit non-claims
Phase 26 must not be called GREEN merely because code and tests exist. WAF/DDoS edge enforcement, antivirus/malware scanning for uploaded bytes, penetration testing, and nonce-based CSP require infrastructure/runtime validation beyond the repository/database controls and remain release-hardening checks unless their actual execution environment is connected and verified.