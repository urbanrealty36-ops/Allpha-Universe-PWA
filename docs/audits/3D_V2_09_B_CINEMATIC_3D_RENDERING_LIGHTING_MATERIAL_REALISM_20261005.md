# 3D-V2.09-B — CINEMATIC 3D RENDERING, LIGHTING & MATERIAL REALISM
## Allpha Universe — 2026-10-05

## Objective

Transform the existing real 3D geometry layer from a spatial asset presentation into a **cinematic, physically readable 3D scene** without introducing a second renderer.

Canonical renderer remains:

**AllphaWorldRenderer → Cinematic3DScene → Theme V2 real geometry**

The public hero also uses the same cinematic rig.

## Implemented

### 1. Cinematic scene rig

Added:

`apps/web/components/world/cinematic-3d-scene.tsx`

The rig provides:

- theme-aware key / fill / rim lighting;
- theme-family lighting presets;
- hemisphere/environment separation;
- dynamic accent lights;
- cinematic fog;
- starfield and layered particles;
- contact shadows;
- mobile/low-power reduction;
- reduced-motion compliance;
- subtle film/grain atmospheric layer.

### 2. Renderer integration

`AllphaWorldRenderer` now configures the WebGL renderer with:

- ACES Filmic tone mapping;
- sRGB output color space;
- controlled exposure;
- soft shadow map;
- cinematic lighting rig;
- theme-aware scene atmosphere.

No second renderer was introduced.

### 3. Material realism pass

Runtime PBR pass now traverses rendered scene materials and applies bounded production rules:

- environment reflection intensity;
- roughness clamping;
- metalness-aware response;
- transparent material depth handling;
- emissive intensity normalization;
- low-power reduction.

This prevents the scene from becoming a flat collection of emissive primitives while preserving the luminous Allpha visual language.

### 4. Public Universe activation

`public-universe-3d.tsx` now uses the same `Cinematic3DScene` and renderer configuration.

Therefore the public Universe hero and authenticated spatial renderer share the same cinematic rendering language.

## Visual target

The phase explicitly targets:

- readable foreground / midground / background separation;
- strong silhouette lighting;
- controlled bloom-like emissive response without a flat neon wash;
- metallic / glass / organic material distinction;
- atmospheric depth;
- spatial subject readability on mobile;
- theme identity through lighting as well as geometry.

## Performance rules

Low-power mode reduces:

- particle count;
- shadow resolution;
- contact shadow resolution;
- lighting intensity;
- atmospheric detail.

Reduced-motion mode removes continuous decorative motion while preserving state and composition.

## Acceptance gates

- [x] Cinematic lighting rig implemented
- [x] ACES + sRGB renderer configuration
- [x] Theme-aware lighting presets
- [x] PBR material realism pass
- [x] Contact shadows
- [x] Atmospheric depth
- [x] Mobile / low-power adaptation
- [x] Reduced-motion adaptation
- [x] Canonical renderer boundary preserved
- [ ] Railway production build verified
- [ ] Runtime browser visual QA
- [ ] Mobile device visual QA
- [ ] Final GREEN

## Status

**IMPLEMENTATION COMPLETE**

**BUILD / RUNTIME QA PENDING**

**PRODUCTION GREEN NOT CLAIMED**


## Railway execution evidence

Final deployment:

- deployment: `49156275-5ffe-4009-95e1-b024f9779186`
- commit: `4160f6d89fa90de725e6a45f547faa7ebf6a35de`
- status: **SUCCESS**
- region: `asia-southeast1-eqsg3a`

Build evidence:

- Next.js production build completed;
- TypeScript completed;
- static generation completed for all generated routes;
- deployment entered DEPLOYING and settled SUCCESS.

The earlier JSX integration failure was corrected before the final successful deployment.

## Remaining acceptance gate

Production code/build is now green, but **runtime browser/device visual QA is still required** before claiming final phase GREEN. The implementation must be visually checked for:

1. cinematic depth;
2. readable silhouettes;
3. realistic PBR response;
4. controlled emissive highlights;
5. mobile composition;
6. no flat/wireframe-only presentation;
7. no performance regression.
