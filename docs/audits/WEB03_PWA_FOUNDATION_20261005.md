# WEB-03 — PWA Foundation Audit

Date: 2026-10-05  
Wave: CW-02.WEB  
Status: CLOSED / FOUNDATION IMPLEMENTED  
Overall CW-02: OPEN / ACTIVATING / NOT GREEN

## Scope

WEB-03 establishes the installable PWA/runtime foundation for the existing Allpha Web product. It does not introduce a second product shell or duplicate any business engine.

## Evidence

| Area | Evidence |
|---|---|
| Manifest | `apps/web/app/manifest.ts` |
| Root integration | `apps/web/app/layout.tsx` |
| Service worker | `apps/web/public/sw.js` |
| Offline route | `apps/web/app/offline/page.tsx` |
| PWA runtime | `apps/web/components/pwa/pwa-runtime.tsx` |
| Icons | `apps/web/public/icons/allpha.svg`, `allpha-maskable.svg` |
| Runtime styling | `apps/web/app/globals.css` |
| Architecture contract | `docs/architecture/ALLPHA_WEB_PWA_FOUNDATION.md` |

## Safety checks

- Only GET requests are handled by the service worker.
- API, auth, OAuth/callback and token-bearing URLs are excluded.
- No mutation queue or offline replay was introduced.
- No business data is synthesized.
- Offline state is explicitly presented as a reachability condition.
- Server authority remains unchanged.

## Installability boundary

The manifest contains the canonical app metadata, start URL, scope, standalone display mode and scalable icons. The repository currently has no raster app-icon assets; SVG is therefore used for the foundation. Broad OS/device compatibility with generated 192x192 and 512x512 PNG icons remains a WEB-29 PWA Install QA item.

## Not claimed

WEB-03 does not claim:
- final browser/device installability GREEN;
- final Lighthouse/PWA GREEN;
- offline support for authenticated server data;
- offline mutation execution;
- Production GREEN.

Those validations belong to later QA/runtime phases.
