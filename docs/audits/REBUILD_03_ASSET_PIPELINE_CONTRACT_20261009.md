# REBUILD-03 — Production 3D Asset Pipeline Contract

**Current status:** PIPELINE CODE IMPLEMENTED; deployment and real-asset acceptance still pending. No golden production asset is claimed until a real Tripo task completes end-to-end and browser/device QA passes.
**Canonical repo:** `urbanrealty36-ops/Allpha-Universe-PWA` (`main`)
**Canonical Storage:** Supabase `AllphaDb-Universe` / bucket `allpha-world-assets`

## Canonical flow

1. **Tripo generation:** generation API remains server-authoritative; retain provider task ID, request/prompt provenance, provider status and output metadata in existing generation package/item records.
2. **Download gate:** only HTTPS provider output is accepted; enforce a 100 MiB maximum and binary GLB checks before upload.
3. **Direct GLB ingestion (default):** use Tripo's original GLB bytes without Blender import/export. `ALLPHA_THEME_BLENDER_PROCESSING=disabled` is the default. This avoids changing geometry, materials, textures, animation, or hashes merely to pass through an editor. Blender remains an explicit opt-in (`ALLPHA_THEME_BLENDER_PROCESSING=enabled`) for a documented remediation case; if enabled, the existing headless import/export report and post-process GLB validation remain mandatory. Blender is not a quality certification and must not be used to claim visual acceptance.
4. **Structural GLB validation:** run `pnpm validate:theme-glb -- <path-to-file.glb>`. The validator checks GLB v2 header and length, chunk layout/order, JSON glTF 2.0 metadata, scenes/nodes/meshes, size ceiling and computes SHA-256.
5. **Manifest and registration:** preserve the existing World Runtime manifest and `theme_assets` lifecycle. The asset is pending/moderation-pending until the existing approval and publication path changes its state. Never create a second registry.
6. **Supabase Storage:** upload only through the existing FastAPI server-side ingestion path to `allpha-world-assets` under `theme-v3-tripo/`; store bucket/path, byte size and SHA-256 in the existing asset row. The pipeline creates a signed URL and fetches a byte range to verify it resolves before reporting the item as successful; signed URLs remain server-authoritative.
7. **Runtime verification:** resolve manifest entry → database row → physical Storage object → signed URL → renderer. Verify with a real asset and browser/device visual QA before declaring the golden gate green.

## Acceptance evidence

- [ ] A genuine Tripo output task is complete and provenance is retained.
- [ ] Processing mode is recorded (`direct_glb_validation` by default, or `blender_processed` when explicitly enabled); any Blender report is persisted when used.
- [ ] GLB structural validator passes on the actual production file.
- [ ] SHA-256 and byte size agree across validation report, uploaded object and `theme_assets`.
- [ ] Existing manifest references the exact registered path; no orphan row/object.
- [ ] Signed URL resolves to the exact object via byte-range fetch and respects expiry/access rules.
- [ ] `AllphaWorldRenderer` renders the asset without placeholder fallback.
- [ ] Mobile/desktop visual and performance QA recorded.

## Guardrails

- No fake GLB, placeholder geometry, invented generation result, or fabricated green status.
- Do not manually upload browser-side with service-role credentials.
- Do not publish/activate an asset just because structural validation passed.
- Keep assets versioned and content-addressable; never overwrite a production object with different bytes.
- The structural validator checks file/container and basic scene content only. It cannot certify realism, correct UVs, texture quality, animation/rigging or runtime performance. Direct GLB validation does not replace browser/device visual QA.

---

## 2026-10-11 — V3 Public Manifest Lifecycle Gate Remediation

**Status:** IMPLEMENTED IN SOURCE / API DEPLOYMENT BUILDING / PUBLIC MANIFEST RUNTIME VERIFICATION PENDING

The live Supabase inspection confirmed that the canonical V3 theme is draft/moderation-pending, its version is review/moderation-pending, and all 17 registered theme_assets rows are pending with no active, moderation-approved, safety-passed, or performance-passed assets. The two associated generation package rows still reference older theme/version IDs.

The public World Runtime V3 manifest previously signed and returned every stored V3 object regardless of the theme/version/asset lifecycle fields. That was inconsistent with this document's guardrail that a structural validation or signed URL must not be treated as publication approval.

Commit cae84dae350769213a7ed8da411507ed74198446 changes apps/api/app/api/world_runtime.py so the public V3 manifest:
- requires a published + moderation-approved theme;
- requires a published theme version with passed validation, approved moderation and passed performance status;
- selects only active assets with approved moderation, passed safety and passed performance;
- creates expiring signed URLs only for those eligible assets;
- returns only runtime-required asset metadata instead of exposing internal moderation/lifecycle metadata.

**Expected current behavior:** while V3 remains draft/review/pending, the public manifest should not expose signed URLs. The Splash should show its explicit labeled fallback until the governed publication lifecycle completes. This is intentional fail-closed behavior, not a claim that the character is published.

**Deployment:** Railway API deployment 59806f34-7e6c-4538-abca-e9b4899e487b was BUILDING at the last observation. Web deployment 0cd57998-d0fb-4ffb-9817-964271a77ada was also BUILDING. The endpoint behavior, API tests and browser fallback still require runtime verification.

**Next gate:** use the approved owner-key validation/reconciliation flow to repair package/theme/version binding; do not directly mutate status columns. After moderation, safety, performance and explicit human publication approval pass, verify manifest eligibility, signed URL expiry, actual GLB transfer, canonical renderer visibility and mobile performance.

