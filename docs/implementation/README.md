# Implementation Continuation Index

## Active rebuild direction

The active visual rebuild plan is [REBUILD_FULL_THEME_3D_UIUX_PHASES.md](./REBUILD_FULL_THEME_3D_UIUX_PHASES.md). It defines the new Theme 3D and mobile PWA UI/UX replacement phases based on the supplied Allpha Universe and Tripo-inspired 3D references.

This plan supersedes prior visual implementation plans for Theme 3D and PWA UI/UX where they conflict. It does **not** authorize replacing the canonical application architecture, backend boundaries, database, authorization model, or canonical renderer. Legacy asset deletion must use Supabase Storage API and a verified object-path allowlist; do not delete Storage metadata directly with SQL.

## Canonical references

- Repository governance: [`AGENTS.md`](../../AGENTS.md)
- Full platform implementation sequence: [`docs/IMPLEMENTATION_PHASES.md`](../IMPLEMENTATION_PHASES.md)
- Architecture baseline: [`docs/architecture/ALLPHA_CANONICAL_ARCHITECTURE_BASELINE_LOCK_v1.0.0.md`](../architecture/ALLPHA_CANONICAL_ARCHITECTURE_BASELINE_LOCK_v1.0.0.md)


## Active execution evidence

- [REBUILD-00 live inventory and evidence lock](../audits/REBUILD_00_EVIDENCE_LOCK_INVENTORY_20261009.md)
- [REBUILD-01 legacy retirement log](../audits/REBUILD_01_LEGACY_RETIREMENT_LOG_20261009.md)
