# 3D-V2.12 — Full Theme V2 Runtime Visual QA

**Date:** 2026-10-06  
**Phase:** 3D-V2.12  
**Status:** OPEN — machine-verifiable harness implemented; browser/device visual evidence remains required.

## Purpose

This phase closes the missing QA infrastructure before any 3D-V2.13 production promotion. Railway is **not** the QA execution target for this phase. The QA harness lives in the canonical repository and can run locally/CI, with an optional live Supabase mode.

## Canonical bindings

- GitHub: `urbanrealty36-ops/Allpha-Universe-PWA`
- Branch: `main`
- Supabase: `AllphaDb-Universe` / `qltbacemtvnuzqkterly`
- Storage bucket: `allpha-world-assets`
- Storage root: `theme-v2-real-3d`
- Canonical renderer: `AllphaWorldRenderer`

## QA infrastructure implemented

### Harness

`scripts/3d/qa-harness-v2-12.mjs`

The harness is dependency-light and deterministic. It verifies:

1. 25 themes.
2. 14 categories.
3. 350 unique theme/category paths.
4. Canonical production activation schema.
5. Production storage bucket/root.
6. Production-manifest-first renderer cutover.
7. Exclusive procedural fallback contract.
8. `AllphaWorldRenderer` integration.
9. Signed-URL/manifest client contract.
10. GLB loading through `useGLTF`.
11. Cinematic, spatial-motion and portal integration contracts.
12. Mobile/low-power/reduced-motion code paths through the production scene contract.
13. Client-side service-role secret exclusion.
14. Renderer authority-boundary exclusion.
15. Optional live Supabase verification of `theme_assets` counts and lifecycle.

### Package command

```bash
pnpm qa:3d:v2.12
```

Live Supabase mode:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm qa:3d:v2.12 -- --live
```

The service-role key is only accepted by the server-side/CLI harness and is never part of the web bundle.

## Supabase evidence

Live Supabase verification performed during this phase:

- V2 `theme_assets`: **350**
- `pending`: **350**
- `active`: **0**
- V2 storage-backed registrations: **350**

Storage also contains 3 non-GLB auxiliary objects under the V2 root:

- `manifest.json`
- `production-manifest.json`
- `allpha-theme-v2-production-3d-350-pack.zip`

These are not theme/category assets and are therefore excluded from the 350 GLB matrix. They were **not deleted** because they are auxiliary artifacts, not missing/duplicate production assets.

## Promotion safety

No asset was promoted by this phase.

Expected current lifecycle:

```
350 staged/pending
350 active
0
```

This is intentional. 3D-V2.13 must remain blocked until V2.12 acceptance is complete.

## Machine-verifiable acceptance

| Gate | Result |
|---|---|
| 25 themes | PASS — contract |
| 14 categories | PASS — contract |
| 350 unique matrix entries | PASS — contract |
| Canonical renderer | PASS — source contract |
| Production manifest first | PASS — source contract |
| Signed URL client contract | PASS — source contract |
| GLB `useGLTF` path | PASS — source contract |
| Procedural fallback boundary | PASS — source contract |
| Service-role not in client scene | PASS — source contract |
| Supabase 350 staged registrations | PASS — live DB evidence |
| Supabase active count remains 0 | PASS |
| Browser/device visual capture | OPEN |
| Real 25-theme visual differentiation | OPEN |
| Mobile visual inspection | OPEN |
| Final GREEN | **NOT CLAIMED** |

## Why the phase is not GREEN yet

The harness can prove code/data contracts, but it cannot truthfully prove rendered visual quality. Browser/device evidence is still required for:

- real 3D depth and occlusion;
- theme-specific geometry identity;
- lighting/material realism;
- atmosphere/shader quality;
- spatial motion/camera behavior;
- portal/navigation FX;
- mobile visual quality/performance.

No screenshot or browser result is fabricated in this report.

## Next gate

Only after the browser/device evidence is collected and accepted:

**3D-V2.13 — Production Asset Promotion**

Promotion remains prohibited while this phase is OPEN.
