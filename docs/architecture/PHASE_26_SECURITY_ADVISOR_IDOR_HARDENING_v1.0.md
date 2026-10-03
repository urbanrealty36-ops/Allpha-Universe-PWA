# Phase 26 — Security Advisor, SECURITY DEFINER & IDOR Hardening

## Implemented

- Client-callable public SECURITY DEFINER implementations are moved into the unexposed private schema.
- Public RPC names remain stable as SECURITY INVOKER wrappers.
- Public wrappers and private privileged implementations use pinned search_path.
- Public SECURITY DEFINER functions executable by anon/authenticated are zero.
- Internal RLS-only tables have explicit fail-closed policies for anon/authenticated.
- Added private.security_idor_audit() to inspect object-identifier surfaces against RLS and existing RBAC/ABAC/private authorization signals.
- Added regression invariants for SECURITY DEFINER exposure, search_path, RLS, write checks, and IDOR.

## Live result

Security Advisor database/function findings are cleared. The only remaining Advisor finding is Supabase Auth leaked-password protection.

The available Supabase connector does not expose the Management API Auth-config write action required to set password_hibp_enabled. This is an external project configuration gate, not an application code gap.

## IDOR model

Authentication alone never proves object ownership. Object access is expected to pass through the existing RBAC + ABAC + policy + RLS layers.

The security chain is:

Authentication → Resource Scope/Ownership → RBAC → ABAC → RLS → Policy → Risk → Approval → Execution → Audit

The IDOR audit is a detection/release gate and does not replace existing authorization engines.

## Release gate

Do not mark Phase 26 GREEN until password_hibp_enabled=true and the Security Advisor is re-run with zero findings.
