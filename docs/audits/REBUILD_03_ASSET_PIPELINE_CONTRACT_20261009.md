# REBUILD-03 — Production 3D Asset Pipeline Contract

**Status at creation:** IMPLEMENTATION IN PROGRESS — validator and ingestion guardrails being added. No golden production asset is claimed.
**Canonical repo:** `urbanrealty36-ops/Allpha-Universe-PWA` (`main`)
**Canonical Storage:** Supabase `AllphaDb-Universe` / bucket `allpha-world-assets`

## Canonical flow

1. **Tripo generation:** generation API remains server-authoritative; retain provider task ID, request/prompt provenance, provider status and output metadata in existing generation package/item records.
2. **Download gate:** only HTTPS provider output is accepted; enforce a 100 MiB maximum and binary GLB checks before upload.
3. **Blender production processing:** inspect/open source, correct scale/origin/normals, check topology, materials, UVs/textures, scene composition, optional LOD/compression and render a human-review preview. Blender QA is a separate required gate; the Node validator is not a substitute.
4. **Structural GLB validation:** run `pnpm validate:theme-glb -- <path-to-file.glb>`. The validator checks GLB v2 header and length, chunk layout/order, JSON glTF 2.0 metadata, scenes/nodes/meshes, size ceiling and computes SHA-256.
5. **Manifest and registration:** preserve the existing World Runtime manifest and `theme_assets` lifecycle. The asset is pending/moderation-pending until the existing approval and publication path changes its state. Never create a second registry.
6. **Supabase Storage:** upload only through the existing FastAPI server-side ingestion path to `allpha-world-assets`; store bucket/path, byte size and SHA-256 in the existing asset row; signed URLs remain server-authoritative.
7. **Runtime verification:** resolve manifest entry → database row → physical Storage object → signed URL → renderer. Verify with a real asset and browser/device visual QA before declaring the golden gate green.

## Acceptance evidence

- [ ] A genuine Tripo output task is complete and provenance is retained.
- [ ] Blender processing report and rendered preview reviewed by a human.
- [ ] GLB structural validator passes on the actual production file.
- [ ] SHA-256 and byte size agree across validation report, uploaded object and `theme_assets`.
- [ ] Existing manifest references the exact registered path; no orphan row/object.
- [ ] Signed URL resolves to the exact object and respects expiry/access rules.
- [ ] `AllphaWorldRenderer` renders the asset without placeholder fallback.
- [ ] Mobile/desktop visual and performance QA recorded.

## Guardrails

- No fake GLB, placeholder geometry, invented generation result, or fabricated green status.
- Do not manually upload browser-side with service-role credentials.
- Do not publish/activate an asset just because structural validation passed.
- Keep assets versioned and content-addressable; never overwrite a production object with different bytes.
- The structural validator checks file/container and basic scene content only. It cannot certify realism, correct UVs, texture quality, animation/rigging, Blender scene quality or runtime performance.
