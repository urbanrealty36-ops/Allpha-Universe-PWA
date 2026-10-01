# PHASE 08 — Migration Manifest

Supabase project: `AllphaDb-Universe`
Project ref: `qltbacemtvnuzqkterly`

## Applied migrations

| Repository logical migration | Supabase applied migration |
| --- | --- |
| `20261002032000_phase_08_personalization_intelligence` | `20261001192855 / 20261002032000_phase_08_personalization_intelligence` |
| `20261002032100_phase_08_personalization_derived_intelligence` | `20261001192926 / 20261002032100_phase_08_personalization_derived_intelligence` |
| `20261002032200_phase_08_fk_indexes` | `20261002032200_phase_08_fk_indexes` |
| `20261002032300_phase_08_passion_source_hardening` | `20261002032300_phase_08_passion_source_hardening` |

## Canonical responsibilities

### 20261002032000
Creates the Phase 08 ontology, graph, signal, affinity, passion, habit and goal tables; indexes; RLS; grants; ownership-safe mutation RPCs.

### 20261002032100
Hardens affinity/signal first-observation accounting and adds the derived personalization refresh RPC.

### 20261002032200
Adds covering indexes for Phase 08 foreign keys identified by the Supabase performance advisor.

### 20261002032300
Binds derived passion clusters to their source ontology parent ID so Dynamic Interest Ontology name collisions cannot merge unrelated passion clusters.

## Important repository rule

The live Supabase migration history is authoritative for what has already been applied to `AllphaDb-Universe`. If local migration files are reconstructed or moved later, preserve these logical migration boundaries and do not create a shadow schema or second database implementation.

No Phase 08 seed/demo records exist.
