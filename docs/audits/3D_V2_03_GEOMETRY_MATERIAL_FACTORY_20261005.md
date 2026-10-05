# Allpha Universe — 3D-V2.03 Geometry & Material Asset Factory Audit

Date: 2026-10-05
Status: IMPLEMENTED / FACTORY FOUNDATION / RUNTIME VISUAL QA PENDING
Track: 3D-V2
Phase: 3D-V2.03 — Geometry & Material Asset Factory

## Scope

3D-V2.03 establishes the deterministic, theme-aware asset recipe factory that converts the locked 3D-V2.01 art direction and 25 theme profiles into reusable geometry/material recipes.

This is a build/design asset factory, not a second renderer, Theme engine, Spatial engine, asset authority layer, or runtime.

## Implemented

- apps/web/lib/world-engine/asset-factory.ts
- @allpha/design-tokens/3d-visual-language is now an explicit package export.
- 14 canonical asset categories are represented.
- 25 existing theme profiles are consumed; no new theme catalog is introduced.
- Deterministic recipe generation is keyed by themeKey + category.
- Geometry recipes include mobile-aware part budgets and recognizable spatial forms.
- Material recipes use the V2.01 semantic material family.
- Motion vocabulary is declared for downstream canonical runtime integration.
- Every generated recipe is explicitly presentationOnly: true.
- Factory validation checks schema, geometry presence, part budget, transparency budget and required core/signal materials.
- createThemeAssetMatrix() produces the baseline 25 × 14 = 350 recipe set without seeding database records.

## Canonical boundaries

The factory does not:
- create or modify Supabase records;
- issue signed URLs;
- decide permissions, ownership, policy, risk, approval, billing or entitlement;
- replace the asset lifecycle;
- replace AllphaWorldRenderer;
- create a second renderer;
- create final production GLBs by itself.

The intended lifecycle remains:

Art Direction → Factory Recipe → Geometry/GLB Export → Validate → Moderate → Store → Manifest → Signed URL → AllphaWorldRenderer → Runtime QA

## V2 geometry/material contract

Each recipe contains:
- theme identity;
- canonical category;
- deterministic asset key;
- theme geometry/material/atmosphere language;
- geometry parts and dimensions;
- semantic material roles;
- animation vocabulary;
- mobile performance budget;
- presentation-only boundary;
- lifecycle state.

## Quality gate

A recipe is valid only when:
- schema is supported;
- presentation-only boundary is intact;
- geometry is non-empty;
- part count stays within mobile-oriented budget;
- transparent material count stays within budget;
- luminous core and signal FX material roles exist.

This is a factory-level gate, not production asset approval.

## Golden Theme

Crystal AI City remains the 3D-V2.02 Golden Theme. The factory can generate all 14 category recipes for it immediately and can generate the full 350-recipe matrix for the existing 25 themes.

## Explicit non-goals

- final 350 GLB files;
- automatic database activation;
- V1 asset deletion;
- renderer cutover;
- browser/device visual QA;
- WEB-16 V2 completion;
- Production GREEN.

Next: 3D-V2.04 — Character / Live Character V2.
