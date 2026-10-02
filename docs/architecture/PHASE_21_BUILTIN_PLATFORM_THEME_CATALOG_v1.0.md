# Phase 21.x — Built-in Platform Theme Catalog v1.0

## Purpose

Allpha provides an initial platform-owned catalog of 25 Theme + 3D World Template pairs. These records are developer-provided product configuration, not creator marketplace submissions.

## Ownership lanes

### Platform built-in

- `source = platform`
- `creator_user_id = null`
- `creator_organization_id = null`
- `created_by_user_id = null`
- `status = published`
- `moderation_status = approved`
- version validation/performance/moderation are already passed/approved
- `catalog_key` and `catalog_order` identify the stable initial catalog

Platform records do not use a fake System User and do not enter creator marketplace review.

### Creator marketplace

- `source = creator`
- creator/user or organization ownership remains authoritative
- creator lifecycle remains Draft → Version Draft → Validation → Review → Moderation → Published
- commercial/free/paid marketplace behavior remains a creator-economy concern

The platform source lane is not a permission shortcut and never grants Agent authority.

## 3D World contract

Every built-in pair contains:

- Theme v1 presentation tokens restricted to `theme.*`
- component configuration
- declarative World Scene Schema
- character hero + companion + NPC definitions
- zones
- spawn points
- portals
- interaction points
- camera
- animation
- performance budget
- accessibility constraints
- renderer compatibility

No arbitrary JavaScript, script, executable scene logic, identity, ownership, permission, policy, risk, reputation or audit authority is encoded in the scene schema.

## Initial 25 catalog

1. Heroic Nexus
2. Nusantara Raya
3. Neo Jakarta 2099
4. Celestial Samurai
5. Skyforge Empire
6. Emerald Rainforest
7. Aurora Kingdom
8. Desert Starfall
9. Oceanic Atlantis
10. Lunar Frontier
11. Mars Frontier
12. Neon Tokyo
13. Pharaoh Eternal
14. Viking Fjord
15. Kingdom of Aether
16. Coral Metropolis
17. Savanna Spirit
18. Floating Garden
19. Dragon Dominion
20. Quantum City
21. Crystal AI City
22. Galactic Frontier
23. Chronos Realm
24. Mystic Academy
25. Dream Carnival

`Heroic Nexus` is an original superhero ensemble concept and does not reproduce third-party Avengers characters or assets.

## Runtime boundary

Phase 21.x supplies catalog/configuration. It does not implement Phase 22 live camera streaming, TTS, realtime audience state, AI Character execution, or live Human↔Agent collaboration.

Preview imagery is intentionally not fabricated as Storage assets. The Web App uses the existing Allpha design-token surface as a catalog preview until authoritative media assets exist.
