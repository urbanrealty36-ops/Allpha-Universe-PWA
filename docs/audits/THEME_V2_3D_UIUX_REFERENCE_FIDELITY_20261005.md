# Theme V2 — 3D UI/UX Reference Fidelity Specification

Date: 2026-10-05
Source: user-provided current Railway screenshots + user-provided Allpha Universe UI/UX reference boards.

## 1. Source distinction

### Current product screenshots
The two current Railway screenshots represent the existing **foundation state**:
- dark space background;
- large blue spherical/globe-like central object;
- basic geometric/grid treatment;
- limited spatial depth;
- limited/absent visible orbital animation;
- minimal Universe/Galaxy/World scene composition;
- UI is present, but the 3D scene does not yet reach the supplied visual target.

These screenshots are **not the V2 acceptance target**.

### Supplied reference boards
The two supplied Allpha reference boards define the intended V2 visual language:
- premium mobile PWA UI;
- explicit Universe / Galaxy / World / District hierarchy;
- rich 3D environments;
- celestial bodies, floating worlds, cities and structures;
- orbital systems and spatial connections;
- depth, lighting, glow, atmosphere and particles;
- animated/live feeling;
- Human + AI Agent presence;
- Live / Content / Community / Marketplace surfaces integrated into the spatial universe;
- compact glass / luminous UI controls over the 3D scene.

## 2. Core conclusion

The purpose of Theme V2 is **not** to polish the existing flat foundation.

The purpose is to **realize the 3D Universe visual system** that the supplied references describe.

Therefore:

**Foundation Asset V1 / current flat renderer ≠ Theme V2 final visual product.**

Theme V2 must become the actual spatial visual layer.

## 3. 350-template requirement

Canonical matrix:

**25 Themes × 14 Categories = 350 3D Theme Templates**

The 350 templates must be treated as actual visual scene/template realizations, not merely:
- recipe IDs;
- database rows;
- color variants;
- flat backgrounds;
- identical geometry with different gradients.

Each template needs a coherent combination of:
- geometry;
- material;
- lighting;
- environment;
- atmosphere;
- camera;
- spatial composition;
- orbit/rotation where appropriate;
- particles/FX;
- animation vocabulary;
- UI overlay language;
- mobile/reduced-motion behavior.

## 4. Required spatial grammar

The visual system must communicate:

Universe
→ Galaxy
→ World
→ District
→ Booth / Space
→ Human / AI Agent
→ Content / Live / Community / Marketplace

The user should be able to visually understand that these are spatial layers, not unrelated flat pages.

## 5. Animation requirements

Animation is part of the Theme V2 specification.

Expected vocabulary includes, depending on theme:
- orbital movement;
- planet rotation;
- floating/flying worlds;
- slow camera drift;
- parallax;
- particle fields;
- energy connections;
- portal transitions;
- city/environment motion;
- AI Agent idle/presence states;
- Live Stage states;
- responsive interaction feedback.

Animation must have:
- performance budget;
- reduced-motion semantic fallback;
- deterministic behavior where appropriate;
- no authority or permission logic in the renderer.

## 6. UI/UX requirements

The UI should adopt the supplied references:
- premium dark spatial canvas;
- luminous cyan / violet / blue accents;
- glass / translucent panels;
- strong typographic hierarchy;
- compact navigation;
- spatial breadcrumbs;
- contextual bottom navigation;
- floating action controls;
- rich cards over 3D scenes;
- Human and AI Agent identity surfaces;
- Live / Content / Community surfaces.

The 3D canvas and UI are one experience.

## 7. Acceptance gate

A Theme V2 template is **not complete** merely because:
- TypeScript compiles;
- the renderer loads;
- a GLB exists;
- an asset manifest exists;
- a recipe exists.

It is complete only when the running PWA visibly demonstrates the intended 3D spatial language.

## 8. Priority correction

The project should **not** treat Portal / Navigation V2 as the next primary visual milestone while the Theme V2 scene library remains flat.

Correct priority:

1. Theme V2 visual system
2. 350 3D templates
3. 3D asset/scene activation
4. renderer/manifest activation
5. runtime visual QA
6. Portal / Navigation / Spatial FX
7. final V1 → V2 cutover

## 9. Non-negotiable architectural boundary

Theme V2 must continue using the canonical:
- AllphaWorldRenderer;
- authoritative Universe/Galaxy/World/District contracts;
- Agent Runtime;
- Live Runtime;
- WebRTC transport;
- CharacterAnimationSignal;
- existing policy/consent/risk/approval boundaries.

Do not create duplicate engines simply to achieve the visual result.
