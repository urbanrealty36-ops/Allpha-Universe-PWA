# Phase 19 — Districts Schema Contract v1.0

## Tables
- districts
- district_memberships
- district_entitlements
- district_zones
- district_access_requests
- district_activity_events
- existing district_access_policies and district_access_grants are now FK-bound to districts.

## Security
All Phase 19 tables have RLS. Direct anonymous/authenticated table writes are revoked. Authenticated reads are policy-filtered. Mutations use SECURITY DEFINER RPCs with an empty search_path.

## RPCs
- create_district
- publish_district
- join_district
- request_district_access
- decide_district_access
- grant_district_entitlement
- revoke_district_entitlement
- create_district_zone
- activate_district_zone

## Enterprise invariants
- Enterprise access cannot be granted by a browser flag.
- Active enterprise entitlement is required.
- Organization-only policy requires organization membership.
- Allowlisted enterprise access requires an explicit active District grant.
- Inaccessible Districts are absent from RLS-filtered reads.
- Access evaluation fails closed when no active policy exists.

## Verification
Live Phase 19 invariant suite: 26/26 passed.
Business data remains empty by design.
Authenticated multi-user E2E is still a later Green gate.
