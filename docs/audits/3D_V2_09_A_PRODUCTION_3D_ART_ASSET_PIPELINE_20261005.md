# 3D-V2.09-A — PRODUCTION 3D ART & ASSET PIPELINE
## Allpha Universe — 2026-10-05

## Objective

3D-V2.09-A establishes the production boundary between **3D generation** and **production asset activation**.

The goal is not to add another renderer. The canonical renderer remains:

**AllphaWorldRenderer → Theme V2 spatial presentation**

The phase introduces a deterministic production asset contract for:

**25 themes × 14 categories = 350 production asset slots**

## Implemented

### 1. Production asset contract

Added:

- `apps/web/lib/world-engine/production-3d-asset-pipeline.ts`

The contract defines:

- production schema;
- canonical storage root;
- quality tiers;
- byte / triangle / node / material budgets;
- 350-asset matrix;
- deterministic storage paths;
- production lifecycle;
- optimization requirements;
- staged-first cutover;
- legacy rollback path;
- runtime-QA-before-legacy-delete rule.

### 2. Binary validation CLI

Added:

- `scripts/3d/production-asset-pipeline.mjs`

Commands:

- `pnpm validate:3d:assets <asset-root>`
- `pnpm manifest:3d:assets <asset-root>`
- `node scripts/3d/production-asset-pipeline.mjs inspect <file.glb>`

The validator checks GLB binary integrity, SHA-256, theme/category completeness, geometry presence, triangle/node/material budgets, and promotion warnings for LOD and texture readiness.

### 3. Production material pass

The previously generated 350 real GLBs were re-exported into a production candidate pack with **three PBR material slots per asset**, using the canonical Allpha theme accent language.

Candidate pack:

`allpha-theme-v2-production-3d-350-pack.zip`

Measured output:

- 350 GLBs;
- 25 themes;
- 14 categories;
- total binary size: ~16.13 MB;
- average asset size: ~46 KB;
- each asset has 3 PBR materials;
- geometry budgets pass.

This is a **candidate**, not yet production-active.

## Promotion lifecycle

The intended production cutover is now:

```
Generate
   ↓
Binary Validate
   ↓
Material / Geometry QA
   ↓
LOD + Texture Optimization
   ↓
Moderation / Safety / Performance
   ↓
Supabase Storage
   ↓
theme_assets manifest
   ↓
STAGED
   ↓
AllphaWorldRenderer
   ↓
Runtime / Device QA
   ↓
ACTIVE
   ↓
Legacy GLB archive/delete
```

### Critical deletion rule

The legacy 25 root GLBs must **not** be deleted before:

1. new assets are stored;
2. theme_assets records are activated;
3. signed URLs resolve;
4. canonical renderer resolves the new paths;
5. browser/device visual QA passes;
6. rollback window closes.

Therefore this phase does **not** delete the legacy Supabase files.

## Optimization contract

Hero categories:

- Universe
- Galaxy
- World
- District
- Live Stage

require:

- Meshopt geometry compression;
- KTX2 texture path when textures are used;
- LOD readiness;
- mobile-aware budgets.

Interactive categories use standard budgets and recommended LOD/instancing.

## Validation status

### Source pipeline
**IMPLEMENTED**

### 350 matrix
**PASS — 25 × 14 = 350**

### Candidate binary pack
**PASS — binary integrity / geometry / material budget**

### LOD
**WARNING — not yet embedded in candidate binaries**

### KTX2 textures
**WARNING — candidate pack uses PBR materials without external texture maps**

### Supabase activation
**PENDING**

### Renderer cutover
**PENDING**

### Runtime visual QA
**PENDING**

### Production GREEN
**NOT CLAIMED**

## Acceptance rule

3D-V2.09-A is implementation-complete only when the pipeline exists and the candidate assets can be validated deterministically.

Production activation remains a separate gate and must preserve rollback and authority boundaries.
