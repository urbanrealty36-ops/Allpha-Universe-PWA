# Allpha Universe — WEB-03 PWA Foundation

Status: CLOSED / FOUNDATION IMPLEMENTED  
Wave: CW-02.WEB  
Date: 2026-10-05

## Objective

Make the existing Allpha Web surface a Mobile-First Installable PWA foundation without introducing a second application shell, data engine, renderer, or authority layer.

## Implemented

### 1. Web App Manifest
- Next.js Metadata Route at `apps/web/app/manifest.ts`.
- Standalone display, portrait-first orientation, theme/background colors.
- Canonical start URL and scope.
- App shortcuts for Universe and Discover.
- SVG app and maskable icons.

### 2. Service Worker / Offline Shell
- `apps/web/public/sw.js` registers a single origin-scoped service worker.
- Precaches the public shell, offline route, manifest and icon assets.
- Navigation uses network-first behavior and falls back to the cached request or `/offline`.
- Next static assets use cache-first with background refresh.
- API/auth/callback/token-bearing URLs are explicitly excluded.
- No POST/PUT/PATCH/DELETE request is intercepted or replayed.

### 3. Update Lifecycle
- `PwaRuntime` registers the service worker.
- Detects a waiting worker and surfaces an explicit update action.
- Update is activated through `SKIP_WAITING`, then the page reloads on controller change.
- Periodic registration update check runs every 30 minutes while the app is open.

### 4. Online / Offline / Reconnect UX
- `PwaRuntime` listens to browser online/offline events.
- Offline banner explicitly warns that server operations are not executed offline.
- Install prompt is captured but not forced; the user controls installation.
- Offline route provides a deterministic retry action.

### 5. Authority / Safety Boundary

Offline mode is presentation/reachability enhancement only.

The service worker must never:
- manufacture business data;
- replay mutations;
- cache authentication tokens;
- decide ownership, permissions, policy, risk, approval, billing, payment, entitlement or execution results.

The browser remains non-authoritative.

## Icon note

The foundation uses scalable SVG icons because the repository currently has no raster app-icon assets. SVG supports scalable PWA iconography, but broad OS compatibility should be completed with generated 192x192 and 512x512 PNG variants during WEB-29 PWA Install QA.

## Verification contract

WEB-03 is considered foundation-complete when:
- manifest route exists and is linked by Next metadata;
- service worker registers from the root scope;
- offline fallback is deterministic;
- authenticated/API mutations are not cached or replayed;
- update lifecycle is explicit;
- online/offline state is visible;
- build/typecheck pass;
- installability is verified later in WEB-29 on real target browsers/devices.

WEB-03 does not claim final PWA install GREEN.
