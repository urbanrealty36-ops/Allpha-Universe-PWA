# Allpha Universe — Full 3D Theme & UI/UX Rebuild Plan
**Status:** REBUILD-00/01 GATES REPORTED GREEN BY USER; REBUILD-02 IN PROGRESS  
**Date:** 2026-10-09  
**Canonical repository:** `urbanrealty36-ops/Allpha-Universe-PWA` — `main`  
**Canonical Supabase:** `AllphaDb-Universe` — `qltbacemtvnuzqkterly` — `ap-south-1`

## 1. Mandate
Replace the legacy Theme 3D visual system and rebuild the mobile-first PWA experience to match the supplied Allpha UI/UX concept and new 3D references. The target is a premium, immersive, navigable social universe for Humans and AI Agents—not a dashboard, not a grid of primitive geometry, and not a collection of static promotional images.

The supplied references establish two complementary visual directions:
- **Universe product UI:** deep-space/cosmic backgrounds, luminous planets and orbital structures, cinematic cities/worlds, premium glass surfaces, cyan/blue/violet lighting, legible mobile navigation, and coherent screens from onboarding through Universe, Galaxy, World, District, Booth, Agent, Content, Live, Marketplace, Community, Messaging and Theme Builder.
- **3D world/stage content:** detailed cyberpunk/neon city blocks; believable architectural materials and street props; AI newsroom/control studio; human–AI podcast studio; conference/auditorium stage; futuristic exhibition/AI booth; human and AI character assets. These scenes must be real navigable 3D assets, not merely flat images pretending to be interactive 3D.

## 2. Non-negotiable architecture and safety
- Keep the canonical monorepo and application boundaries: `apps/web` PWA, `apps/admin` Super Admin, `apps/api` FastAPI.
- Reuse Supabase Postgres, Storage, Auth, RLS, existing `theme_assets`, theme/version contracts, World Runtime manifest, and the canonical `AllphaWorldRenderer`. Do not introduce a second asset registry, renderer, theme engine, API boundary, or database.
- Browser/Admin must not perform privileged database mutations. Theme publication, signed URLs, authorization and asset activation remain server-authoritative through FastAPI/Supabase policies.
- No fake business data, mock runtime, placeholder GLBs, hardcoded business records, secrets in browser code, or procedural primitives presented as production art.
- Do not delete unrelated user media, avatars, agent assets, or documents.
- Remove dead code only after references, runtime routes, manifests, tests and imports have been reconciled. Do not keep old renderer paths as silent fallbacks.
- Use Tripo for model generation only where configured and licensed; use Blender for production-quality scene assembly, materials, lighting, UV/texture validation, optimization and exports. No claim of generated/verified assets without pipeline evidence.
- Performance and accessibility are product requirements, especially on mobile PWA: budgets, lazy loading, LOD, compressed textures/geometry, reduced-motion support, graceful WebGL fallback and keyboard/touch navigation.

## 3. Destructive legacy retirement policy
Legacy theme assets and old UI implementations are to be retired, not retained as fallback code. Before physical deletion, enumerate exact object paths and database references, distinguish legacy objects from the current production manifest, and verify that no active World, Booth, Live Stage or renderer still resolves them. Then delete only the explicitly classified legacy paths through the Supabase Storage API and remove their `theme_assets` rows in a coordinated, verified operation. Confirm object deletion and reference counts afterwards. Never delete objects by issuing raw SQL against `storage.objects` as a substitute for the Storage API.

Initial live inventory on 2026-10-09:
- `allpha-world-assets`: 100 objects under `theme-v2-real-3d/v2.13/` (~2.85 GB), plus 352 objects under other `theme-v2-real-3d/{theme}/` prefixes (~16.5 MB), plus one object outside those groups.
- `public.theme_assets`: 475 active `3d_scene` rows.
- The 100-object `v2.13` production set must not be blindly assumed to be legacy or deleted; verify manifest, DB paths, actual runtime consumers and user’s new art direction before final cutover.
- A prior Railway service named `allpha-theme-asset-migrator` has already been removed. This alone does not delete Storage objects or repository generator code.

## 4. New implementation phases

### REBUILD-00 — Canonical Baseline, Reference Lock & Inventory
Inspect current `main`, Master PRD, implementation phases, theme contracts, migrations/RPCs, `theme_assets`, Storage object paths, manifests, all renderer call sites, UI routes, deployment configuration and CI. Catalogue reference screens and scene types. Establish a path-level legacy/current asset matrix and record baseline bundle size, route coverage and mobile performance.  
**Exit gate:** evidence-backed inventory, reference board, asset dependency map, and exact deletion allowlist.

### REBUILD-01 — Legacy Theme & UI Retirement
Remove obsolete theme selection flows, V1/procedural-placeholder render paths, unused scene loaders, duplicate asset generators, stale manifest formats, obsolete CSS/components and dead feature flags. Preserve canonical business/authorization APIs and renderer integration contracts. Delete legacy Storage objects only through the Storage API after the allowlist is verified; clean corresponding metadata and validate no broken references.  
**Exit gate:** no legacy renderer fallback; no unresolved imports; old asset paths no longer resolve; database/storage counts reconciled.

### REBUILD-02 — Visual System & Mobile Design Foundation
Build the Allpha visual language from the supplied references: cosmic navy/black base, restrained cyan/blue/violet glow, readable typography, depth, premium glass panels, consistent iconography, motion principles and responsive spacing. Define design tokens, components, states and accessibility contracts.  
**Exit gate:** documented design tokens and implemented reusable PWA components; mobile and desktop responsive checks pass.

### REBUILD-03 — Production 3D Asset Pipeline
Establish the reproducible Tripo → Blender → GLB pipeline: generation inputs and provenance, scene assembly, PBR material validation, texture packing/compression, lighting, scale/origin, normals, animation contract, LOD, Draco/Meshopt where supported, texture budgets, thumbnail/previews, validation and deterministic manifests. Store outputs in a clean versioned Storage prefix and register through the existing asset lifecycle.  
**Exit gate:** golden asset passes geometry/material/scale/size/texture/manifest/signed-URL checks; no mock or placeholder asset accepted.

### REBUILD-04 — Golden Theme & Golden World
Create one complete reference-faithful theme and one navigable golden world before producing the full catalogue. Include coherent world silhouette, skyline/architecture, terrain, atmosphere, emissive lighting, streets/paths, scale references and scene landmarks. Include a real mobile camera/navigation experience.  
**Exit gate:** human visual review against the supplied cyberpunk city and Allpha universe references; actual GLB rendered by `AllphaWorldRenderer`; performance budget passes on mobile.

### REBUILD-05 — Universe, Galaxy & Orbit Experience
Rebuild the Universe landing and navigation around spatial hierarchy: Universe → Galaxy → World. Implement orbital composition, world nodes, camera transitions, selection states, discovery/navigation controls and accessible non-3D navigation. No static image may masquerade as a live scene.  
**Exit gate:** responsive Universe/Galaxy navigation works on touch, keyboard and reduced-motion settings, backed by real catalog/API state.

### REBUILD-06 — World & District Exploration
Create explorable worlds and districts with distinct environment art direction, depth, landmarks, lighting, navigation, loading/empty/error states and contextual information. Use actual published world/theme records and authorized assets.  
**Exit gate:** world/district routes render correct assets via canonical manifest and enforce access policy.

### REBUILD-07 — Booth, Marketplace & Creator Spaces
Implement 3D booth/tenant scenes inspired by the futuristic exhibition booth reference, with product/creator displays and authorized actions layered onto the scene. Reuse canonical Booth, Marketplace, Commerce and entitlement services.  
**Exit gate:** active approved assets only; server-authoritative permissions; no duplicated commerce logic.

### REBUILD-08 — Human & AI Character Production
Replace procedural placeholder characters used as production art with verified character assets and a consistent rig/scale/material/animation contract. Support human presence representation and AI character presentation without implying that appearance grants identity or authority. Optimize animation and asset delivery for mobile.  
**Exit gate:** character loading, selection, animation lifecycle and ownership/consent rules verified end-to-end.

### REBUILD-09 — Live Stage & Real-World-Inspired Environments
Build distinct production environments for AI newsroom/control studio, human–AI podcast, talkshow/interview, conference/auditorium, presentation/pitching, classroom/mentor/tutor, and creator live stage. Use environment-specific lighting, camera positions, acoustics-related visual cues and stage composition. Reuse existing Live Session, WebRTC, voice and collaboration contracts.  
**Exit gate:** each stage is a real optimized scene; live lifecycle and authorization remain on existing backend paths.

### REBUILD-10 — Core PWA Journey & Navigation
Implement the supplied mobile screen family: Splash/Onboarding, Human Identity/Auth, Universe Home, Galaxy/World Navigator, World Detail, District, Booth/Tenant, Agent interaction, Live Experience, Feed/Moments, Content Capsule, Ask, Agent Factory/Profile/Monitor, Marketplace, Communities, Messaging/Collaboration, Theme Builder, Human Control Center and mobile navigation. Keep UI connected to real APIs; provide honest loading/empty/error states.  
**Exit gate:** all agreed routes have consistent responsive UI, functional navigation, auth handling and real API integration.

### REBUILD-11 — Content, Feed, Ask & Agent Interaction
Apply the new design system to Content Capsule, Universe Feed, Ask, Agent creation/profile/command and collaboration surfaces. Preserve canonical Content, Feed, AI Gateway, Agent Runtime, policy, approval and audit boundaries.  
**Exit gate:** no mock content or fake AI execution; authenticated flows and errors are verified.

### REBUILD-12 — Asset Activation & Runtime Cutover
Bind approved assets through existing `theme_assets`, Theme/Theme Version, signed Storage URLs and production manifest. Switch all consuming routes to the new golden asset contracts; remove V1 and intermediate V2 fallbacks and duplicate loaders. Reconcile database paths with actual Storage objects.  
**Exit gate:** every active manifest entry resolves to a real object; no active path points to retired assets; no duplicate renderer/registry.

### REBUILD-13 — Performance, Accessibility & Mobile Resilience
Measure real-device performance. Set and enforce budgets for initial JS, route chunks, scene load time, GLB size, texture memory, draw calls, frame rate and interaction responsiveness. Implement lazy loading, LOD, disposal of GPU resources, scene unload, reduced-motion, low-power mode and non-WebGL fallback.  
**Exit gate:** documented benchmark results for representative mobile/desktop devices; no unbounded asset preloads or memory leaks.

### REBUILD-14 — Security, Integration & Visual QA
Verify signed URL authorization/expiry, Storage access, RLS, API boundaries, Theme publication/moderation, ownership, Booth/District access, Live consent, IDOR/BOLA and audit trails. Run visual regression, accessibility, API, integration and authenticated E2E tests.  
**Exit gate:** security and integration checks pass; visual review covers every screen family and each golden scene.

### REBUILD-15 — Production Release & Dead-Code Closure
Run clean install, lint/typecheck, PWA/Admin builds, API tests, CI, production deployment smoke tests and authenticated browser/mobile verification. Inspect bundle and dependency graphs, remove obsolete packages, unused assets, old routes, stale flags, dead CSS and unreachable code. Update architecture/asset docs and completion evidence.  
**Exit gate:** production runtime evidence, performance/accessibility/security gates passed, no legacy asset fallback, and docs match the live repository/Storage state.

## 5. Initial 3D theme catalogue and scene matrix
The new catalogue should be organized by actual use-case/category rather than generating a large number of near-identical files. At minimum, design and validate scene contracts for:
1. Universe/Galaxy/Orbit visual navigation
2. World skyline/landscape and landmark scene
3. District environment and streetscape
4. Booth/AI exhibition pavilion
5. Cyberpunk/neon city block with detailed architecture and street props
6. Newsroom / AI broadcast studio
7. Podcast / human–AI conversation studio
8. Talkshow / interview set
9. Conference / auditorium / presentation stage
10. Classroom / mentor / tutor environment
11. Human avatar / character
12. AI Agent character and animation
13. Live stage / collaboration environment
14. Content capsule / spatial media presentation

Themes may vary across distinct art directions (including futuristic/cyberpunk, crystal AI city, Nusantara, fantasy, oceanic, desert, forest, sci-fi and other existing published theme concepts), but all must pass the same quality, performance, accessibility and runtime contracts. Final counts must be based on validated unique assets—not a target number of filenames.

## 6. Required delivery report per phase
Every phase report must include:
- files changed and dead code removed;
- Storage paths created/deleted and object-count reconciliation;
- `theme_assets` / Theme Version changes;
- build/test commands and actual results;
- mobile visual evidence and performance metrics;
- security/integration evidence;
- remaining blockers and exact next phase.

**Completion policy:** a phase is not complete because source code exists. Mark GREEN only when its stated exit gate has actual verification evidence.

## Live execution status — 2026-10-09

This section is the current status record and supersedes any implication that the plan document itself means implementation is complete.

| Phase | Current status | Evidence |
|---|---|---|
| REBUILD-00 — Baseline, reference lock, inventory | **CI GREEN; EVIDENCE CLOSEOUT** | [Live inventory and evidence lock](../audits/REBUILD_00_EVIDENCE_LOCK_INVENTORY_20261009.md). User confirmed GitHub Actions green. CI success is recorded; remaining evidence must match the defined path-level inventory and reference-lock exit gate. |
| REBUILD-01 — Legacy Theme/UI retirement | **CI GREEN; RUNTIME CLOSEOUT** | [Retirement log](../audits/REBUILD_01_LEGACY_RETIREMENT_LOG_20261009.md). Legacy modules/workflows and procedural placeholders were retired; manifest-driven runtime is in place. CI success is recorded; final runtime/storage reconciliation evidence remains a distinct exit-gate concern. |
| REBUILD-02 — Visual System & Mobile Design Foundation | **IN PROGRESS** | Added reusable `GlassChip`, `SectionHeading`, `IconButton`, and `StatusBadge` primitives with semantic styles, focus states, disabled states, small-screen layout and reduced-motion support. Responsive/browser evidence and full component adoption remain open. |
| REBUILD-03 through REBUILD-15 | **NOT STARTED** | Follow the phase order above; do not mark green without the defined exit evidence. |

### Execution boundary
- The canonical renderer is still `AllphaWorldRenderer`; the new `ThemeManifestAssetScene` resolves assets from the authorized public manifest and does not require the retired `theme-v2-real-3d/v2.13/` prefix.
- No Tripo GLB assets have been generated in REBUILD-00/01. Missing/unpublished assets intentionally do not receive synthetic character, ring, sphere, or booth-box substitutes. Production art creation starts in REBUILD-03/04.
- The user will delete legacy objects from Supabase Storage manually. Until a fresh inventory confirms that deletion, do not claim Storage cleanup is complete. `theme_assets` metadata also needs reconciliation after the Storage action.
- Old V2 generation commands, scripts, workflows and V2-coupled tests have been removed from the active repository tree. The new audit script `pnpm audit:theme-rebuild` runs in CI and fails if the retired workflow/generator artifacts or fixed V2.13 runtime path are reintroduced.

### Storage retirement reconciliation update
The user's manual Storage deletion has now been verified: `allpha-world-assets` contains no real objects (only Supabase's 0-byte `.emptyFolderPlaceholder`). The 475 `theme_assets` records, 25 `themes` records and 25 `theme_versions` records were moved from published/active to archived/removed states. History and foreign-key integrity are preserved; no database rows were physically deleted. New Tripo outputs must be registered as new theme versions/assets and must pass validation before publication.

**Current phase gates remain open** until the latest GitHub Actions run confirms the repository audit and PWA build. No Tripo-generated GLB has been produced yet.

### Canonical Tripo storage contract
The new public Theme manifest now filters only `theme-v3-tripo/*` paths in `apps/api/app/api/world_runtime.py`; the old `theme-v2-real-3d/*` public-manifest filter was removed. New assets should use `theme-v3-tripo/{themeKey}/{category}.glb` (or a documented versioned subpath that retains the same theme/category suffix), be registered through the existing `theme_assets` lifecycle, and remain unpublished until validation/moderation/performance gates pass. The CI audit now checks that the API manifest does not regress to the old prefix.


### REBUILD-02 execution log — 2026-10-09
- Confirmed latest canonical GitHub Actions run `37960725635` completed with conclusion `success`; Super Admin build, User PWA build, API syntax, and Security/Supply-chain jobs all succeeded.
- Added reusable semantic UI primitives in `apps/web/components/ui/allpha-primitives.tsx`: `GlassChip`, `SectionHeading`, `IconButton` (requires an accessible label), and `StatusBadge`.
- Added matching semantic styles for responsive section headers, 36px chips, keyboard focus visibility, disabled controls, status tones, and reduced-motion behavior in `apps/web/styles/ui-visual-foundation.css`.
- **Not yet GREEN:** no claim of mobile/desktop visual QA until browser/device checks and evidence are recorded. Existing routes still need adoption of these primitives in subsequent UI phases.
