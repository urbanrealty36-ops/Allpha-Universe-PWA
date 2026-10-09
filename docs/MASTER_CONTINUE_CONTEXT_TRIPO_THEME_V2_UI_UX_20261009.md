# ALLPHA UNIVERSE — MASTER CONTINUE CONTEXT (NEW CHAT / AI CODING AGENT)
## Canonical handoff • Updated 2026-10-09
## Full UI/UX refactor • Theme V2 350 assets • TRIPO 3D → Blender → Supabase → Runtime • RED QA remediation

> **Use this document as the first prompt in a new Allpha Universe conversation.** This is a continuation, not a restart. Read the linked repository documents and inspect the current repository, live Supabase state, GitHub Actions and Railway deployment before making changes. This document records the last confirmed state; it does not replace live verification.

---

## 1. COPY-READY MASTER PROMPT

You are the lead implementation engineer and continuation agent for **Allpha Universe**, the Social Network for Humans & AI Agents. Continue from the existing canonical repository and live services. Do not restart the architecture, do not make up completion status, and do not mark any RED gate GREEN without actual evidence.

### Mandatory execution sequence
**READ → UNDERSTAND → INSPECT REPO → INSPECT SUPABASE → MAP TO MASTER PRD → PLAN → IMPLEMENT → MIGRATE (only if needed) → TEST → SECURITY CHECK → API VERIFICATION → PWA/ADMIN VERIFICATION → INTEGRATION CHECK → BROWSER/VISUAL QA → UPDATE DOCUMENTS → REPORT.**

Start with the active RED production 3D/browser QA and latest commit. Capture evidence before changing code. Find the actual runtime failure; do not silence console errors, weaken tests, reduce thresholds, skip tests, or replace real GLBs with procedural/mock assets just to get green. After the runtime blocker is genuinely resolved, resume the single-model TRIPO asset package pipeline and the wider 350-asset Theme V2 matrix.

---

## 2. CANONICAL BINDINGS — DO NOT SWITCH ACCOUNTS/PROJECTS

### GitHub
- Account/connector: **Urban Realty Github / urbanrealty36-ops**
- Repository: [urbanrealty36-ops/Allpha-Universe-PWA](https://github.com/urbanrealty36-ops/Allpha-Universe-PWA)
- Branch: `main`
- Repository ID: `1400534480`

### Supabase
- Project: **AllphaDb-Universe**
- Project ref: `qltbacemtvnuzqkterly`
- Region: `ap-south-1`
- PostgreSQL 17
- Required capabilities: PostgreSQL, pgvector, Supabase Auth, Storage, Realtime.

### Railway
- Project: `serene-youth`
- Project ID: `aef572c0-9d9e-4843-9bd4-5d498e81dae8`
- Production environment ID: `7055a4ea-dfa3-47da-8fc1-435e579dbf4d`
- Web service `@allpha/web`, service ID `ec936cce-d2fe-4202-83dd-e9646400f28f`
- API service `allpha-api`, service ID `c6a934fe-81b4-4020-850f-ebfee56d41a6`
- Web URL: https://allphaweb-production.up.railway.app
- API URL: https://allpha-api-production.up.railway.app

### Canonical monorepo and stack
- `apps/web`: Next.js / React / TypeScript / Tailwind / PWA
- `apps/admin`: Super Admin
- `apps/api`: Python FastAPI
- `packages/`: shared contracts, design tokens and engines
- 3D: Three.js, React Three Fiber, drei, **AllphaWorldRenderer**, Blender asset pipeline
- Data/authority: Supabase PostgreSQL and FastAPI; no direct privileged frontend mutations.

Never create a parallel renderer, agent runtime, feed engine, theme engine, database, or API boundary if a canonical implementation exists.

---

## 3. CURRENT EXECUTION STATUS (LAST CONFIRMED; RECHECK LIVE)

### Current primary workstream
**Full Web UI/UX refactor + Theme V2 production 3D runtime + 350 asset matrix.** The visual language must read as a living spatial universe (Universe → Galaxy → World → District → Booth/Agent/Content/Live), not a conventional admin dashboard. Use the repository's actual reference screenshots and design documentation.

### Immediate blocker: GitHub Actions RED
Last confirmed main commit when this handoff was assembled:
- `1ad9a6bcf0cf114733c99a7ea76f535652cc0d1b` — `test(3d): capture production WebGL failure diagnostics`
- Parent: `e99a6770ee2225ea2107731b907573f239c2db2c` — `fix(3d): prevent DOM fallback from crashing R3F canvas`

The diagnostic test change adds structured evidence when the WebGL gate fails. It is diagnostic instrumentation, not proof that runtime is fixed.

Last confirmed result from the previous investigation:
- Base CI gates: API syntax, Super Admin build, security/supply-chain, User PWA build had passed on the previously observed run; refresh the current run.
- D6.2 Browser Runtime: **RED**
- D6.3 Production 3D Visual Render: **RED**
- D6.4 Production Visual Fidelity: **RED**
- D6.5 Desktop + Mobile: **RED**
- D6.7 World → District → Booth: **RED**
- Railway web deployment for the earlier runtime patch was reported successful, but deployment of the *latest commit* and the currently served client bundle must be reverified.

Known observed error in an earlier Playwright trace:
`R3F: Div is not part of the THREE namespace! Did you forget to extend?`
followed by `THREE.WebGLRenderer: Context Lost.`
This proves a DOM node entered an R3F scene in that trace. A prior patch changed a fallback in `apps/web/components/world/theme-v2-spatial-scene.tsx` to `fallback={null}`, but the failure was not thereby proven resolved. Do not assume this is the final root cause or that the same bundle is running now.

Relevant recent runtime code:
- `apps/web/components/world/theme-v2-spatial-scene.tsx`
- `apps/web/components/world/theme-v2-production-asset-scene.tsx`
- `apps/web/components/world/allpha-world-renderer.tsx`
- `apps/web/components/world/cinematic-production-hero.tsx`
- `apps/web/components/world/world-experience.tsx`
- `apps/web/components/universe/immersive-universe-shell.tsx`
- `tests/d6-2-production-browser-runtime.spec.ts`
- `tests/d6-3-production-3d-visual-render.spec.ts`
- `tests/d6-4-production-visual-fidelity.spec.ts`
- `tests/d6-5-desktop-mobile-production-visual-qa.spec.ts`
- related D6.7 test and `.github/workflows/v2-13d*` workflows.

### Mandatory next actions for RED
1. Fetch latest `main` SHA and all latest workflow run/job statuses. Identify exact tested SHA and deployed SHA.
2. Inspect the newest D6.2/D6.3/D6.4/D6.5/D6.7 artifacts, Playwright traces, screenshots, console errors, page errors, failed requests and response codes. Preserve artifacts.
3. Inspect the exact currently served JS chunks on Railway; compare embedded/build commit metadata or build ID to the expected SHA. Confirm cache/service-worker effects. Do not infer deployment identity from a deployment label alone.
4. Search all components rendered below `<Canvas>` / R3F `<group>` for DOM elements (`div`, `span`, `p`, HTML wrappers). DOM overlays must be wrapped using drei `<Html>` or rendered outside Canvas. DOM fallback passed as an R3F child is invalid.
5. Capture the actual asset-manifest HTTP status/body (redacting signed secrets), selected `storage_path`, signed URL response status/content-type/content-length, GLB download completion and parsing errors.
6. Verify live Supabase rows for the exact theme and all 4 asset records; confirm active/approved/safety/performance states and object existence. Verify URL signature/expiry without leaking token-bearing URLs in logs.
7. Capture runtime marker values: asset state, mesh/object/material counts, bounds, camera metrics, GL errors, WebGL context-loss events. Inspect scene graph and screenshot pixel/visual evidence.
8. Fix only the evidenced root cause, add/adjust a regression test only when it tests real behavior (never weaken existing acceptance), deploy, then repeat all relevant browser checks.
9. If no WebGL context is available in CI, report that as environment capability only after proving it with diagnostics; do not turn a real production-render gate into a skipped test.
10. Report pass/fail and artifact URLs. Do not call RED closed until every required runtime gate has passed on the expected commit.

Known relevant runs from the earlier investigation (may now be superseded; always inspect latest):
- D6.2: https://github.com/urbanrealty36-ops/Allpha-Universe-PWA/actions/runs/37923331984
- D6.3: https://github.com/urbanrealty36-ops/Allpha-Universe-PWA/actions/runs/37923331863
- D6.4: https://github.com/urbanrealty36-ops/Allpha-Universe-PWA/actions/runs/37923331832
- D6.5: https://github.com/urbanrealty36-ops/Allpha-Universe-PWA/actions/runs/37923331814
- D6.7: https://github.com/urbanrealty36-ops/Allpha-Universe-PWA/actions/runs/37923331705
- CI: https://github.com/urbanrealty36-ops/Allpha-Universe-PWA/actions/runs/37923331702

---

## 4. THEME V2 — CANONICAL CONTRACT: 25 THEMES × 14 CATEGORIES = 350

The target matrix is **25 Theme profiles × 14 asset categories = 350 Theme V2 assets/templates**. This is a product/asset contract, not a claim that all 350 assets have been generated, registered, rendered, or approved. Track each matrix cell separately as planned / generated / Blender-QA / staged / registered / runtime-verified / visual-approved / production-active.

### Categories to preserve in the asset registry and matrix
1. Universe
2. Galaxy
3. World
4. District
5. Booth
6. Content / Feed Universe / Content Capsule
7. Portal / Navigation
8. Live Theme / Live Experience Stage
9. Human Live / Uniform
10. AI Agent Character
11. AI Character animation / Animation signal contracts
12. Sticker / Social 3D / Cosmetics
13. AI Credits / AI Content / AI Agent Generate / Ask on Message and Content
14. Marketplace / Collaboration / Negotiation / Theme Builder / Human Control Center / Universe Map and supporting domain experience assets

The canonical detailed category schema may subdivide the above into the repo's official 14 categories. **Read the canonical Theme V2 matrix and existing DB enum/contracts before editing category keys.** Do not silently rename or invent category identifiers to fit this summary.

### Theme family coverage
- Galaxy, World, District, Booth
- Agent/AI Agent Character and human/user character
- Feed Universe, Content Capsule, Content, Sticker, Portal
- Live Theme / Live Experience Stage / Human Live / uniform
- AI Credits / generation / ask-message-content / social / marketplace / collaboration
- Theme Builder / Universe map / spatial navigation / other domain surfaces
- Required Live stage types include Podcast, Talkshow, Presentation, Pitching, News, Product Marketing, Classroom, Mentor Room, Tutor Room.
- Uniform concepts include formal, Nusantara and superhero-inspired themes, subject to brand/IP review and actual asset rights.

### Theme V2 acceptance criteria per asset
- Real authored GLB; not a tiny placeholder GLB passed off as final.
- Source provenance and license/usage rights recorded.
- Blender import/open, transforms/origin, normals, material and texture validation, scale, camera framing and render preview recorded.
- Polygon/triangle count and file size fit documented performance budgets; use LOD/decimation only without destroying visual quality.
- PBR materials/textures are valid and packaged; no missing external textures.
- GLB parses in the browser, mesh count > 0, non-degenerate bounds, camera/frustum visibility proven.
- Correct signed manifest → exact storage path → renderer path.
- Desktop and mobile screenshots; no R3F page errors, WebGL context-loss, broken textures or off-screen object.
- Accessibility/reduced-motion and low-power behavior validated.
- Asset lifecycle state and visual approval evidence stored and documented.
- The runtime should load production assets through the canonical FastAPI manifest and `AllphaWorldRenderer`; procedural geometry can be a deliberate scene layer but cannot be reported as a real production GLB.

---

## 5. TRIPO 3D → BLENDER → ALLPHA WEB: ONE MODEL + ONE PACKAGE FIRST

**Current requested work order:** continue generating with TRIPO 3D as **one model and one complete package at a time**. Do not start a mass 350-asset generation batch before the golden package is validated end-to-end.

### Golden package
Start with one named Theme and one representative spatial package (recommended first package: **Crystal AI City — Golden Spatial Package**), including the target hierarchy as separate, identifiable objects where needed:
- Universe/Galaxy/World scene shell
- District
- Booth
- Portal/navigation element
- AI Agent / AI Character model
- required animation-ready skeleton or explicit animation contract, if the chosen TRIPO output supports it
- Live Experience Stage / uniform variants only if included in this first package contract
- associated PBR materials/textures and source files

Do not claim TRIPO creates rigging/animation perfectly by default. Verify what the selected generation/export mode actually provides. If a model is static, mark it static and define the required rigging/animation work separately in Blender or the approved animation pipeline.

### Pipeline — every gate is evidence-based
1. **Define package contract**: theme key, category keys, target object list, target platform/device budgets, license/provenance, intended scale, naming convention, visual reference and acceptance rubric.
2. **Generate in TRIPO 3D**: create one model at a time. Save prompt, generation/job ID, version, settings, source/download URL or export record, license and generation date. Do not fabricate job IDs or claim an asset exists before download.
3. **Export**: obtain the actual GLB (and source format if available). Confirm download is complete; record byte size and SHA-256.
4. **Blender QA**: open the real file in Blender; inspect scene tree, transforms, origin, scale, normals, topology, materials, UVs, textures, transparency, animation/skeleton, camera and lighting. Fix defects in a reproducible Blender project/script. Produce at least a clean beauty render and a technical validation report.
5. **Optimize**: use defensible poly/texture/file-size budgets, LODs where necessary, no destructive quality shortcut. Confirm mobile performance.
6. **GLB validation**: re-export glTF 2.0 GLB; validate with available glTF tooling; reopen the exported GLB; check mesh/material/texture counts, animation clips, bounds and dependencies.
7. **Staging upload**: upload only to the canonical Supabase Storage bucket `allpha-world-assets` using a versioned path consistent with existing conventions, e.g. `theme-v2-real-3d/v2.13/<theme-key>/<category>.glb`. Do not upload secrets to the repo.
8. **Database registration**: register metadata in the existing `theme_assets`/canonical asset schema using the existing migrations/API conventions. Start as staged/pending; include theme/version/category/path/checksum/size/provenance/QA state. Do not create another asset table.
9. **Manifest validation**: use the public FastAPI manifest endpoint `/api/v1/themes/world-runtime/public/themes/{theme_key}/asset-manifest`. Verify exact storage path and signed URL returned for the intended category. Record HTTP status and sanitized metadata; never expose live signed URLs/tokens in a public report.
10. **Renderer activation**: make the asset reachable through the existing `AllphaWorldRenderer` / `ThemeV2ProductionAssetScene` contract. No direct service-role access from the browser; no alternate renderer.
11. **Production browser validation**: run D6.2/D6.3/D6.4/D6.5 and relevant D6.7 checks. Capture desktop/mobile screenshots, Playwright trace, page/console errors, GLB network responses, runtime marker and scene graph.
12. **Approval and promotion**: promote from staged/pending only after technical, security, performance and visual evidence passes. Follow explicit approval gates in `docs/3d/`; do not automatically promote assets merely because upload or CI succeeded.
13. **Documentation/report**: update the asset matrix, Blender pipeline record, implementation report and current continuation context with exact hashes, paths, gate results and next package.
14. **Repeat**: only after the golden package passes end-to-end, repeat the same controlled process for the next model/package; then scale toward 350 matrix cells.

### Current known Crystal AI City asset state (last inspected; recheck live)
Theme ID: `6ad58f40-9bdd-4ffb-88fe-7a8fc6ab44dd`, slug `crystal-ai-city`, reported published/moderation approved.
Four production V2 GLBs were recorded in bucket `allpha-world-assets`:
- `theme-v2-real-3d/v2.13/crystal-ai-city/district.glb` — 17,497,872 bytes — SHA-256 `cb634d131e5235f3f5666f7509bf6e0a71f407cb2b5ea8a7928383a0a2c7d001`
- `theme-v2-real-3d/v2.13/crystal-ai-city/galaxy.glb` — 39,526,800 bytes — SHA-256 `65821e883c29c73b52f6fc85537e7cae5474c32ba1d55ae3c1a5b6e157b27b5d`
- `theme-v2-real-3d/v2.13/crystal-ai-city/universe.glb` — 39,329,428 bytes — SHA-256 `05fa46fa134eb42e2447c846e50b25b735f0ce1aad0a8e3369c0df784cf98ad4`
- `theme-v2-real-3d/v2.13/crystal-ai-city/world.glb` — 17,609,584 bytes — SHA-256 `3651d3de4f86b86d0da2f2f043201cc87458fec1067011ad2c112b8e274da67b`
Previously inspected rows were active, moderation-approved, safety-passed and performance-passed. **These database flags do not prove the production browser rendered the GLB.** Reconfirm rows and object existence in live Supabase. Older tiny GLBs were observed; retire them from runtime resolution only after verifying no canonical references depend on them. Never delete storage objects without dependency/provenance checks and an explicit migration/rollback plan.

### Explicit production promotion guard
Existing project instructions require the exact confirmation phrase for the V2.13D.4 100-macro-asset production promotion:
`V2.13D REFERENCE REAL APPROVE 100 MACRO ASSETS`
Do not initiate that mass promotion when the user’s current plan is one model/package and the runtime is still RED.

---

## 6. BLENDER + RUNTIME RENDERER CONTRACT

- Blender is the authoring, cleanup, validation and render-evidence stage; it is not the application authority layer.
- The browser's canonical renderer is `AllphaWorldRenderer` (Three.js + React Three Fiber).
- FastAPI resolves published theme/version and approved asset metadata, then issues time-limited signed URLs from Supabase Storage.
- Browser fetches the public manifest, downloads GLB, parses it with the established GLTF loader, normalizes only presentation transforms as contractually allowed, and emits runtime evidence.
- Keep the theme's visual language, real mesh/materials, scale, camera framing, lighting and composition consistent with the reference image.
- DOM must not be rendered as a raw child in the Three.js scene graph. Use drei `<Html>` for DOM inside Canvas, or move DOM outside Canvas.
- Ensure only the intended production asset is resolved for the intended theme/category; prevent legacy fallback from silently hiding a failed manifest/GLB.
- Verify `API_BASE`, deployed public environment variables, response headers, signed URL lifetime, storage CORS and correct content type.
- A successful manifest HTTP 200 is not proof that the signed URL works; a successful GLB download is not proof that it parses; parsing is not proof that the object is in frame; an in-frame object is not proof of visual fidelity. Evidence every stage independently.
- On WebGL context loss, capture the browser event, preceding errors, GPU/browser capability, renderer creation, canvas dimensions and actual deployment SHA before deciding whether the cause is application or runner environment.

---

## 7. FULL WEB UI/UX REFACTOR — REFERENCE IMAGE IS THE DESIGN AUTHORITY

This is a product experience, not a dashboard redesign. Inspect the actual uploaded reference screenshots and current repo UI inventory. Do not substitute generic SaaS cards or claim parity based on styling alone.

### UX vision
- Premium, cinematic, responsive spatial universe.
- Mobile-first PWA; touch-first Galaxy/orbit navigation; accessible desktop interaction.
- Universe → Galaxy → World → District → Booth transitions, with Agent presence, content capsules, portals and live experiences integrated spatially.
- Light/dark theme behavior per canonical design system; user preference says premium UI and Indonesian default with optional English where applicable.
- Strong visual hierarchy, legible labels, safe-area handling, loading/error/empty states, reduced-motion and low-power modes.
- 3D assets enhance the product but must not block core navigation, auth, accessible fallbacks or runtime diagnostics.

### Existing WEB workstream names to reconcile with repository plan
- WEB-01 Baseline & Frontend Reconciliation
- WEB-02 Design System Foundation
- WEB-03 PWA Foundation
- WEB-04 Mobile Navigation
- WEB-06 Splash + Identity
- WEB-07 Universe Home
- WEB-08 Galaxy Navigator
- WEB-09 World Experience
- WEB-10 District Experience
- WEB-11 Booth/Tenant
- WEB-05 or other omitted numbering must be read from the canonical phase plan; do not invent the missing phase. Continue any later WEB phases present in `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`.

For each UI phase: map screenshot → screen/route → component → data/API contract → responsive states → interactions → accessibility → visual regression. Verify real API data, never fake placeholders. Record screenshot before/after and mobile/desktop evidence.

---

## 8. COMPLETE PHASE / SUBPHASE REGISTER — MASTER ROADMAP

**Important status semantics**
- **Implemented foundation** = code/schema exists, but end-to-end product behavior may be incomplete.
- **Partial / hardening** = some implementation exists, acceptance criteria remain open.
- **OPEN / RED** = active work; not complete.
- **Pending / next** = do not begin until dependencies/gates are satisfied.
- A phase number in code/docs is not proof of completion. Use `docs/IMPLEMENTATION_PHASES.md`, commit history, tests, live schema, workflow runs and browser evidence to update this register.

### A. Product/platform foundations — Phases 00–21
Project history reports foundational implementations across Phases 00–21. Re-audit against the canonical phase document rather than treating the range as production complete:
- **Phase 00** — baseline, repository/product alignment and operating contracts.
- **Phase 01** — design-system foundation and shared UI tokens.
- **Phase 02** — Supabase/database foundation and canonical data boundaries.
- **Phase 03** — authentication and identity foundations.
- **Phase 04** — user/human profile and identity.
- **Phase 05** — AI Agent identity and ownership.
- **Phase 06** — Agent Memory / knowledge foundation.
- **Phase 07** — AI Gateway and model routing.
- **Phase 08** — Agent Runtime foundation.
- **Phase 09** — workflow/orchestration foundation.
- **Phase 10** — content platform foundations.
- **Phase 11** — Feed/Discovery foundations.
- **Phase 12** — social graph/community/messaging foundations (confirm subphase split in canonical document).
- **Phase 13** — AI Universe / Galaxy / World foundations.
- **Phase 14** — District/Zone/Booth spatial domain foundations.
- **Phase 15** — Theme Builder / Theme Version / Theme Assets.
- **Phase 16** — Spatial Runtime / renderer foundations.
- **Phase 17** — Admin/control-plane foundations.
- **Phase 18** — core product/engine foundations; owner previously requested revisiting Phase 18 to close gaps.
- **Phase 18.5** — UI realization follow-up.
- **Phase 18.6** — UI realization follow-up.
- **Phase 18.7** — UI realization follow-up.
- **Phase 18.8** — UI realization and QA follow-up.
- **Phase 19** — reconcile exact title/subphases from `docs/IMPLEMENTATION_PHASES.md`.
- **Phase 20** — reconcile exact title/subphases from `docs/IMPLEMENTATION_PHASES.md`.
- **Phase 21** — spatial/theme foundations and reconciliation (confirm exact subphases from the canonical phase plan).
- **Phase 21.5** — ALLPHA 25 Theme 3D Asset Pack; 25-theme scope must align with the later 25 × 14 = 350 Theme V2 matrix.

> The titles for phases where the current continuation memory does not preserve canonical exact names are deliberately marked “reconcile exact title from source”, not guessed. The agent must extract the official numbered title and every subphase from `docs/IMPLEMENTATION_PHASES.md` and merge it into this document as the first documentation task. Do not treat this compact register as a replacement for the 113KB source of truth.

### B. Live experience and domain completion — Phases 22–27
- **Phase 22 — Live Stories / Streaming / Experiences**
  - 22 subphases: Live Session Core; Human Owner → Owned AI Agent Collaboration; Live Agent Runtime; Realtime Live Conversation. Extract every exact subphase from canonical phase plan.
  - **Phase 22I — AI Character + Realtime Voice + Animation Contract**: verify actual character assets, runtime signal schema, voice/realtime boundary, permissions and browser evidence.
- **Phase 23 — Review / Reputation / History**
  - **23E — Review + Reputation + History**: verify audit/history, moderation/reputation, owner controls and E2E.
- **Phase 24 — Marketplace & Commerce**: real catalog, offers/listings, ownership, order/transaction state, payment boundary, moderation and idempotency.
- **Phase 25 — Economy, Credits & Billing**: credit ledger, AI usage metering, entitlements, purchase/refund/settlement contracts and Midtrans integration where configured; no fake balance/transaction.
- **Phase 26 — Security, Governance & Trust — OPEN / HARDENING REQUIRED**: RBAC/ABAC, IDOR/BOLA, ownership/authorization, Security Advisor, SECURITY DEFINER audit, RLS/grants, security E2E, secrets and privileged mutations.
- **Phase 27 — Super Admin Control Plane / Domain Operations**
  - **27B — Super Admin Domain Operations & Governance Surfaces**
  - **27C — Super Admin Domain Operations, Transaction Explorer & Master Data Management**; previously reported as the user’s phase, but the immediate operational blocker has moved to Theme V2 D6 runtime. Do not confuse “last strategic phase mentioned” with current execution task.

### C. Theme V2 / production asset phases
The following subphases are explicitly part of the V2 workstream and must be reconciled to the exact canonical docs:
- **3D-V2.01** Art Direction & Master Visual Language.
- **3D-V2.02** Golden Theme / Golden Scene.
- **3D-V2.03** Geometry & Material Asset Factory.
- **3D-V2.04** Character / Live Character V2.
- **3D-V2.05** Universe / Galaxy / Orbit V2.
- **3D-V2.06** World / District / Booth V2.
- **3D-V2.07** Capsule / Content / Feed Universe V2.
- **3D-V2.08** Live / Human Live / Stage V2 / Human + AI Agent collaboration stage.
- **3D-V2.09** Production 3D Art & Asset Pipeline.
- **3D-V2.09-B** Cinematic 3D Rendering, Lighting & Material Realism.
- **3D-V2.09-C** Advanced Environment Detail, Shaders, Atmosphere & Theme-Specific Visual Polish.
- **3D-V2.09-D** Real-Time Spatial Motion, Camera & Interaction Polish.
- **3D-V2.11** Production 3D Asset Activation & Canonical Renderer Cutover.
- **3D-V2.11-A** Signed URL & Production Asset Manifest Verification.
- **3D-V2.12** Full Theme V2 Runtime Visual QA.
- **V2.13A** Golden production asset/render workstream (see UI/UX 3D continuation document).
- **V2.13D.4** Explicit Production Promotion / Storage Gate.
- **V2.13D.5** Runtime Asset Activation Verification.
- **V2.13D.6 / D6.2** Production PWA Browser Runtime Verification.
- **V2.13D.6.3** Production 3D Visual Render Verification.
- **V2.13D.6.4** Production Visual Fidelity / Brand QA.
- **V2.13D.6.5** Desktop + Mobile Production Visual QA.
- **V2.13D.6.7** World → District → Booth production navigation/runtime verification.
- **V2.13D.4 promotion guard** remains explicit; do not promote mass assets while D6 gates are RED.
- **V2.13D reference-real remediation**: inspect the newest workflow run/trace before assigning the current substep. Current gate is **RED until proven otherwise**.

### D. Completion Waves — closure, not a repeat of old phases
- **CW-01 — Evidence Lock & Domain Completion:** prove all 82 domains with repository, database, API, auth/ownership, test and UI evidence.
- **CW-02 — Agent + Content Activation:** real Agent and Content lifecycle evidence; currently previously recorded OPEN.
  - **CW-02.R — Runtime Repair & Activation Stabilization**
  - **CW-02.A — Real Agent Runtime Activation**
  - **CW-02 Web App Universe Entry & Authenticated UX Activation**
  - **CW-02 Frontend Product UX Realization**
  - **CW-02 Runtime Activation & End-to-End Reconciliation**
- **CW-03 — Messaging / Agent Service / Skill Challenge**
- **CW-04 — World / Theme / 3D Activation**
- **CW-05 — Live / AI Character Runtime**
- **CW-06 — Commerce / Billing / Creator Economy**
- **CW-07 — Observability / Evaluation / Security**
- **CW-08 — E2E / CI / Staging / Production Green Gate**

### E. Phase 28 and beyond
Phase 28 and Phase 30 Full Feature Activation have been referenced in project planning, but this handoff does not have a verified canonical title/subphase breakdown for all intermediate phases. Extract all exact phases from `docs/IMPLEMENTATION_PHASES.md` and the latest Master PRD before assigning status. Do not invent Phase 29. **Phase 30 — Full Feature Activation** remains a strategic target, not a claim of completion.

### F. Immediate priority order
1. **P0: V2.13D RED runtime diagnosis** — current primary blocker.
2. **P1: WEB UI/UX refactor** — continue against reference images, keeping real backend/API contracts.
3. **P2: TRIPO → Blender golden 3D package** — one model/package at a time; do not scale until end-to-end gates pass.
4. **P3: Theme V2 matrix registry** — reconcile all 25 × 14 = 350 cells against Storage + database + manifest + renderer; do not assume generated/active.
5. **P4: Phase 26 security hardening** and relevant CW evidence gates.
6. **P5: CW-01…CW-08 domain/E2E completion and Phase 30 full activation** after prerequisites.

---

## 9. MASTER PRD — PRODUCT DOMAINS AND EXPANDED CAPABILITIES

Read the actual current PRD before modifying it. The product is **Allpha: Social Network for Humans & AI Agents**, with principle **“Human owns the Agent; Agent authority is bounded.”**

### Core existing domain families
- Human Identity / profiles / settings / identity verification.
- AI Identity / Agent Passport / persona / ownership / capability / permission / risk / approval / audit.
- Agent Memory, embeddings, hybrid retrieval, authorized context, personalization context.
- Interest graph: interests, passions, habits, goals, preferences and user control.
- Content creation, moderation, content understanding, feed, reels, discovery, recommendations, ranking, AI capsule and provenance.
- Social graph, follow/relationships, communities, messaging, notifications, presence.
- AI Gateway, model router, AI usage/token metering, generation, Ask on Message and Content.
- AI Universe hierarchy: Universe → Galaxy → World → District → Zone → Booth/Tenant.
- Theme/World Builder, Theme versions, theme assets, 3D asset factory, spatial renderer and runtime.
- Live Stories, streaming/live session, human owner ↔ owned Agent collaboration, real-time voice, WebRTC/STUN/TURN, GPT-Live/realtime boundary, animation signals/contracts.
- Marketplace, commerce, transactions, offers, negotiation, entitlements, AI credits, billing, creator economy.
- Reviews, reputation, moderation, anti-impersonation, fraud/abuse, trust, audit ledger.
- Super Admin Control Plane, domain operations, transaction explorer, master-data management, configuration lifecycle, flags and governance.
- Analytics, observability, AI evaluation, performance, accessibility, E2E/CI/staging/production gates.

### Additions/expansions to reconcile into the canonical PRD (do not create duplicate engines)
- **350 Theme V2 experience assets** across 25 themes and 14 official categories.
- TRIPO 3D generation provenance and controlled one-model/one-package pipeline.
- Blender-based source QA, production rendering, optimized GLB packaging, render previews and asset provenance.
- Signed-URL asset manifest, explicit lifecycle gates and canonical renderer cutover.
- Human/AI live stage, AI Character, GPT-Live/realtime voice, WebRTC and CharacterAnimationSignal/animation contracts.
- Ask on Message and Content, AI Agent Generate, AI Credits rewards/ledger and Skill Challenge.
- Feed Universe/Galaxy, Content Capsule, Portal/Navigation, Sticker/Social 3D/Cosmetics, uniform and character wardrobe.
- Agent Authority Completion vertical slice: Passport → Capability → Permission → Risk/Approval → Audit.
- Agent Intelligence Completion vertical slice: Embedding → Hybrid Retrieval → Authorized Context → Personalization Context.
- Authenticated E2E Asset Activation vertical slice: Booth GLB → Live Stage GLB → AI Character GLB → moderation → signed URL → Live Session → Collaboration → Agent Presence → AllphaWorldRenderer.
- Anti-Impersonation, owner control, safety, authorization and trust boundaries.
- Full Web UI/UX reference-led rebuild (not dashboard reskin).
- Completion Waves CW-01…CW-08 as evidence-closure work, not replacement architecture.
- Visual QA, asset runtime observability, WebGL context-loss diagnostics, browser traces and deployment-SHA verification.

These additions must be mapped to existing PRD sections/domains and schema; add a new domain only when the canonical PRD/schema confirms it is genuinely missing. Update the master domain map and implementation report when incorporated.

---

## 10. MASTER DOCUMENTS TO READ IN THE REPOSITORY

Read these in order, checking existence/current content on `main`:
1. `AGENTS.md` — repository-wide agent instructions.
2. `docs/MASTER_CONTINUE_CONTEXT_NEW_AI_AGENT_20261008.md` — previous agent handoff; use it for history, then prefer this 2026-10-09 handoff for current RED state.
3. `docs/MASTER_CONTINUATION_CONTEXT.md` — broad master context and PRD/architecture details.
4. `docs/IMPLEMENTATION_PHASES.md` — canonical phase/subphase source of truth; extract **every** exact phase title, subphase, dependencies and status.
5. `docs/MASTER_CONTINUATION_CONTEXT_PHASE23_ENGINE_3D.md` — Phase 23/engine/3D context.
6. `docs/MASTER_CONTINUE_CONTEXT_PHASE27C_20261004.md` — Phase 27C / admin and operations context.
7. `docs/MASTER_CONTINUE_CONTEXT_UI_UX_3D_V213A_20261006.md` — UI/UX + Theme V2/V2.13A continuation.
8. `docs/AI_AGENT_CODE_CONTINUATION_HANDOFF_20261002.md` — handoff constraints.
9. `docs/AI_AGENT_IMPLEMENTATION_REPORT.md` — append-only implementation evidence history; read latest entries before working.
10. `docs/3D/V2.13D_REFERENCE_REAL_EXECUTION.md` — 3D reference-real execution.
11. `docs/3d/V2.13D.4-EXPLICIT-PRODUCTION-PROMOTION-STORAGE-GATE.md`
12. `docs/3d/V2.13D.5-RUNTIME-ASSET-ACTIVATION-VERIFICATION.md`
13. `docs/3d/V2.13D.6-PRODUCTION-PWA-BROWSER-RUNTIME-VERIFICATION.md`
14. `docs/3d/V2.13D.6.3-PRODUCTION-3D-VISUAL-RENDER-VERIFICATION.md`
15. `docs/3d/V2.13D.6.4-PRODUCTION-VISUAL-FIDELITY-BRAND-QA.md`
16. UI phase plan, if present: `docs/architecture/ALLPHA_WEB_UI_UX_REFACTORING_PHASE_PLAN.md`, `docs/continue-context/ALLPHA_WEB_CONTINUE_CONTEXT_WEB01.md`, `docs/UI_UX_SURFACE_INVENTORY.md`.
17. Master PRD, if present: `docs/PRD/ALLPHA_Master_PRD_Design_System_Architecture_v1.0.md`; also locate the actual canonical PRD if the path differs.
18. Relevant source components, tests, workflow YAML, migrations, live Supabase schema/RLS/policies and current Railway deployment.

The repository may contain other artifacts (screenshots, reference images, GLB manifests, Blender files, scripts, QA JSON, Playwright traces/reports, GitHub workflow artifacts). Discover them with repository tree/search and workflow artifacts. **Do not assume an artifact path or contents without inspecting it.** User-uploaded reference images should be treated as design evidence; connect each to the intended screen/phase in the UI surface inventory.

### First documentation task for the next agent
Parse `docs/IMPLEMENTATION_PHASES.md` and all continuation docs, then update this handoff with the **exact full official list** of numbered phases/subphases. This compact handoff preserves the phase families and known names, but intentionally does not invent names for missing/unknown numbered phases. Add status only when supported by code/test/live evidence.

---

## 11. REQUIRED REPORTING BY EVERY AI CODING AGENT

**Every agent must update the repository docs before reporting completion.** At minimum:
- Append one dated entry to `docs/AI_AGENT_IMPLEMENTATION_REPORT.md`.
- Update this master continuation document's current phase/status/next action when work changes the active state.
- Update the relevant phase plan, asset matrix, PRD/domain map or runtime QA record.
- Commit the documentation change with the implementation where possible.

Use this report template:

```markdown
### YYYY-MM-DD — <PHASE / SUBPHASE / CW / 3D GATE>
- **Agent/task:**
- **Objective:**
- **Starting SHA / target SHA:**
- **Commit SHA:**
- **Files changed:**
- **DB migrations / schema / RLS / grants:**
- **Supabase live-state verification:**
- **API contract + status:**
- **Web/Admin UI changes:**
- **Theme / category / asset package:**
- **TRIPO job/provenance/license:**
- **Blender project/script + QA/render evidence:**
- **GLB size/hash/mesh/material/texture/animation counts:**
- **Storage bucket/path + lifecycle state:**
- **Manifest HTTP status + selected asset path:**
- **Signed URL / GLB download / GLTF parse evidence (URL secrets redacted):**
- **Renderer / scene graph / camera / bounds / visible-state evidence:**
- **Desktop/mobile screenshots + Playwright trace/artifacts:**
- **GitHub Actions run IDs and per-gate status:**
- **Railway deployed SHA/build ID + runtime confirmation:**
- **Security / performance / accessibility checks:**
- **Status: GREEN / RED / BLOCKED / PARTIAL (with evidence):**
- **Known gaps / risks:**
- **Next exact phase/subphase and why:**
```

No report may use “done”, “implemented”, “production-ready” or “GREEN” without naming the evidence and commit SHA. Clearly distinguish code exists, tests pass, live integration works, production deployment matches, and visual approval.

---

## 12. ACCEPTANCE GATES — NEVER SHORT-CIRCUIT

A feature is complete only after relevant gates pass:
1. PRD/architecture mapping.
2. Repository implementation and code review.
3. Migration/schema/RLS/grants reviewed (if applicable).
4. Unit + integration + contract tests.
5. API authorization and error-path verification.
6. Web PWA and Admin verification as applicable.
7. Real live database/storage/manifest checks.
8. Browser E2E against deployed expected commit.
9. Security, IDOR/BOLA, ownership and secrets checks.
10. Desktop + mobile visual QA with reference screenshots.
11. Performance, accessibility, reduced-motion/low-power checks.
12. Docs, phase status and AI implementation report updated.
13. Rollback plan for risky asset promotion/deletion.
14. Verified final report with next action.

A CI green build is not proof of production runtime. Manifest 200 is not proof of GLB download. Download is not proof of GLTF parsing. Parsing is not proof of visibility. Visibility is not proof of reference-level fidelity. A database status flag is not proof of browser behavior.

---

## 13. NON-NEGOTIABLE ARCHITECTURE / SECURITY RULES

- No new architecture/database, no duplicate engines, no SQLite.
- No fake/mock/dummy business data, fake API responses, fabricated IDs or invented evidence.
- Do not bypass FastAPI for privileged business operations.
- Never expose Supabase service-role secrets to web/admin clients.
- Human owns Agent; Agent authority is bounded by explicit permission/consent/risk/approval.
- Server-authoritative ownership, permissions, moderation, credits, billing, transactions, entitlements and audit.
- Keep RLS/grants and backend authorization aligned; frontend is not a security boundary.
- No mass production promotion/deletion without explicit gate, evidence and rollback.
- Preserve canonical account/project bindings above.
- Never mark a phase closed solely because code was committed or a workflow was triggered.
- Do not remove older assets until dependency mapping proves safe retirement; prefer manifest/runtime cutover and reversible deactivation before storage deletion.

---

## 14. WHAT THE NEXT AGENT MUST DO FIRST

1. Read this handoff and the documents in Section 10.
2. Inspect `main` SHA and latest Actions runs; use the latest actual evidence rather than stale run IDs.
3. Diagnose RED from current Playwright trace/screenshots/network responses/console errors and runtime marker.
4. Confirm the exact Railway-served build SHA and actual browser bundle; address cache/service-worker mismatch if proven.
5. Verify manifest → signed URL → GLB bytes → GLTF parse → scene graph → in-frame visible mesh → visual fidelity.
6. Fix the proven issue with a regression test; retain strict thresholds.
7. Run D6.2, D6.3, D6.4, D6.5 and D6.7 plus base CI as applicable.
8. Update `docs/AI_AGENT_IMPLEMENTATION_REPORT.md` and this context with exact evidence.
9. Only when the runtime is stable, continue **one TRIPO model + one golden package** through Blender, storage, DB registration, manifest, renderer, desktop/mobile visual QA and explicit approval.
10. Then continue the 350 matrix and WEB UI/UX refactor phase by phase, reporting each completion.
11. Reconcile every official phase/subphase from `docs/IMPLEMENTATION_PHASES.md` into the phase register; never fabricate unknown phase titles/status.
12. Report blockers honestly and leave RED open when evidence says RED.

**End state sought:** an authenticated, production-safe Allpha Universe PWA whose visual experience matches the supplied references, whose real Theme V2 assets are traceable from TRIPO/Blender through Supabase and FastAPI into AllphaWorldRenderer, and whose 82-domain product is activated and verified with real end-to-end evidence—not just green builds.
