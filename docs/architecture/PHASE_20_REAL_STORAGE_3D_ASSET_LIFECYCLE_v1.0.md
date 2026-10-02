# Phase 20 — Real Storage 3D Asset Lifecycle & Booth 3D Composition

## Scope
This increment activates the existing Booth/Tenant display-asset contract with real Supabase Storage lifecycle semantics. It does not seed Booths, assets, Storage objects, GLB files, or fake business records.

## Authoritative flow
1. Authenticated Booth owner calls FastAPI \`POST /api/v1/booths/{booth_id}/assets/3d/upload-url\`.
2. Backend RPC \`prepare_booth_3d_asset\` creates a \`pending\` metadata row with a server-generated Storage path.
3. Backend creates a time-limited Supabase Storage signed upload URL for that exact path.
4. Browser uploads the user-provided real \`.glb\` object to the private \`allpha-world-assets\` bucket.
5. Browser calls \`POST /api/v1/booths/{booth_id}/assets/{asset_id}/3d/finalize\`.
6. Backend RPC \`finalize_booth_3d_asset\` verifies the real Storage object, owner, non-zero size, and path before moving metadata to \`active\`.
7. World Runtime reads only active 3D assets and returns time-limited signed read URLs.
8. World Preview projects the real signed URL into the existing React Three Fiber/Three.js renderer. If no real asset exists, the existing procedural Booth representation remains; it is not a stored/fabricated asset.

## Security
- \`allpha-world-assets\` remains private.
- Upload path is generated server-side; clients cannot choose arbitrary Storage paths.
- Storage read policy exposes only active Booth 3D assets for active Booths (or the Booth owner).
- Lifecycle RPCs are authenticated-only.
- No service-role/secret key is exposed to the browser.
- Presentation asset data does not grant Agent/Booth authority.

## Supported asset increment
- \`.glb\`
- MIME: \`model/gltf-binary\` (server accepts compatible GLTF MIME values at preparation boundary)
- External \`.gltf\` dependency bundles are intentionally not activated in this increment; no incomplete dependency manifests are fabricated.

## API surface
- \`POST /api/v1/booths/{booth_id}/assets/3d/upload-url\`
- \`POST /api/v1/booths/{booth_id}/assets/{asset_id}/3d/finalize\`
- \`GET /api/v1/booths/{booth_id}/assets/3d\`
- \`DELETE /api/v1/booths/{booth_id}/assets/{asset_id}/3d\` (archives metadata and unbinds display slots; physical Storage deletion remains an explicit Storage API operation)

## Runtime composition
\`District → Zone → Booth → active 3D Storage asset → signed read URL → World Preview → React Three Fiber/Three.js\`.

The renderer never treats a missing asset as an authoritative business record and never fabricates a Storage URL.

## Verification
At implementation time:
- Booth records: \`0\`
- Booth display assets: \`0\`
- Booth display slots: \`0\`
- \`allpha-world-assets\` Storage objects: \`0\`
- Lifecycle RPCs: present
- Authenticated execute: present
- Anonymous execute: denied
- Storage read policy: present
- Supabase security/performance advisors reviewed; existing project-wide findings remain and are not reclassified as GREEN.

## Status
**IMPLEMENTED FOUNDATION / NOT GREEN**

Not yet proven:
- authenticated real-user upload E2E
- actual user-provided GLB upload
- signed URL browser upload under live auth
- real District → Zone → Booth runtime composition with populated data
- device/mobile 3D performance
- CI/build/runtime/production gates
