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
