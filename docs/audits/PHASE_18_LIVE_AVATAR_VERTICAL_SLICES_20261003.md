# PHASE 18 COMPLETION — LIVE EXPERIENCE + AVATAR DOMAINS

Date: 2026-10-03
Status: IMPLEMENTED VERTICAL WORKFLOW / AUTHENTICATED RUNTIME E2E PENDING

## Live Experience vertical slice

Implemented in `apps/web/components/live-experience-vertical-slice.tsx`.

Flow:
Theme → District → Booth → Live Template → Approved Template Version → Live Session → AI Agent → Collaboration Consent → Collaboration Activation → World Agent Presence → Agent Runtime Command Plan.

The implementation uses the existing FastAPI live endpoints and existing Agent Runtime. It does not create a parallel live engine or bypass capability/policy/consent/risk/approval controls.

Session lifecycle exposed:
draft → scheduled → live → ended.

Collaboration lifecycle exposed:
request → consent → activate.

Runtime command:
create → plan.
Execution is intentionally not automatic from the UI step; Agent Runtime remains authoritative.

## User Character / Uniform / Sticker / Cosmetics domains

Added database domains:
- `user_characters`
- `uniform_catalog`
- `user_uniforms`
- `sticker_catalog`
- `user_stickers`
- `cosmetic_catalog`
- `user_cosmetics`

All seven tables have RLS enabled.
Ownership tables are restricted to the authenticated owner.
Catalog tables expose only published + approved records to authenticated users.
Equipped state is constrained with partial unique indexes.
Uniform/cosmetic records contain entitlement references and asset/checksum/theme-compatibility metadata.
Character creation is constrained to the existing platform `agent_character_catalog`.

API surface:
`/api/v1/avatar/*`

UI:
- `/avatar-studio`
- linked from Theme Studio workflow.

## Important boundary

No fake Uniform, Sticker or Cosmetic catalog rows were inserted.
At verification time these catalogs remain empty until a real catalog/asset/entitlement lifecycle publishes approved records.

## Supabase verification

RLS is enabled on all seven new tables.
The existing security advisor findings remain primarily the project's pre-existing six RLS-without-policy tables and broad SECURITY DEFINER inventory. The new tables did not introduce an RLS-without-policy finding.

Supabase documentation was checked before the schema work; current guidance continues to require RLS for exposed public tables and owner-scoped policies for authenticated data.

## Verification limitation

GitHub reports no status checks/workflow runs for the latest implementation commit at verification time.
No authenticated browser E2E was executed in this increment.
Therefore this audit does not claim CI GREEN, runtime GREEN, or production GREEN.

## Next gates

1. Authenticated E2E the Live session lifecycle.
2. Activate real Theme/Live Stage GLBs through Storage.
3. Bind real Booth GLBs into Live Stage.
4. Activate AI Character 3D asset lifecycle.
5. Build real Uniform/Sticker/Cosmetic catalog moderation + Storage upload lifecycle in Admin.
6. Connect entitlement/acquisition to billing/economy instead of direct ownership writes.
7. Render equipped User Character/Uniform/Cosmetics/Stickers through the canonical 3D renderer.
