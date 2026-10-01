# PHASE 08 — Interest, Passion, Habit & Goal Graph / Personalization Intelligence

## Status

**IMPLEMENTED on main and AllphaDb-Universe.**

This phase establishes the authoritative personalization graph. It does not implement recommendation ranking; later Feed/Discovery phases consume this graph.

## Product alignment

The Master PRD defines:

- Interest Ontology
- Interest Graph
- Passion Graph
- Habit Graph
- Goal Graph
- Contextual/personalization controls
- Learning loop: behavior signal → interest affinity → passion → habit → goal/context → recommendation
- Interest, Passion and Habit must be learned from patterns, not a single action
- Sensitive inferred attributes must not be exposed as definitive facts

## Database

Implemented tables:

- `public.interest_nodes`
  - Dynamic, versioned ontology nodes
  - Parent hierarchy
  - Canonical key
  - Localization and metadata
  - Lifecycle status
- `public.interest_edges`
  - Related, synonym, parent, branch, merge, split and localized relationships
- `public.personalization_signals`
  - Real observations with subject, signal type, optional interest/entity, strength, timestamp and context
- `public.subject_interest_affinities`
  - User/Agent affinity score, confidence, positive/negative evidence and observation timestamps
- `public.passion_clusters`
  - Derived recurring clusters
- `public.passion_cluster_interests`
  - Passion-to-interest membership
- `public.habit_patterns`
  - Derived recurring time/day patterns with evidence and confidence
- `public.personalization_goals`
  - Explicit user/Agent intent
- `public.goal_interest_links`
  - Goal-to-interest graph edges

All exposed Phase 08 tables have deliberate grants and RLS.

## Backend RPCs

Server-authoritative functions:

- `set_subject_interest`
- `remove_subject_interest`
- `record_personalization_signal`
- `refresh_subject_personalization`
- `create_personalization_goal`
- `update_personalization_goal`

Ownership is checked inside the database and again at the API boundary. User subjects can only address the authenticated user. Agent subjects require ownership through `public.agents.owner_user_id`.

## Personalization learning behavior

### Interest affinity

Affinity is updated only when a real signal is recorded or an explicit interest is set. Evidence count and positive/negative evidence are persisted.

### Passion

A passion cluster is derived only when multiple positive, repeated interest affinities share a real parent ontology node. A single interaction does not create a passion.

### Habit

Habit patterns are derived only after repeated observations. Current Phase 08 derived dimensions are time-of-day and ISO day-of-week.

### Goal

Goals are explicit intent. The system does not invent goals from behavior.

## API

Base: `/api/v1/personalization`

- `GET /ontology/interests`
- `GET /me`
- `GET /agents/{agent_id}`
- `POST /interests`
- `DELETE /interests/{interest_id}`
- `POST /signals`
- `POST /refresh`
- `POST /goals`
- `PATCH /goals/{goal_id}`

All routes require authenticated context.

## User PWA

Real API-connected routes:

- `/personalization`
- `/interests`
- `/passions`
- `/habits`
- `/goals`

UI behavior is honest:

- loading state
- backend error state
- empty graph state
- empty ontology state
- real interest selection only
- real interest removal
- real goal creation
- no synthetic passion/habit records

## Security

- No frontend direct Supabase access for Phase 08 mutations.
- No service-role credentials in browser.
- No raw user metadata authorization.
- RLS is enabled on every Phase 08 public table.
- Browser roles receive ontology SELECT only.
- Personalization mutation tables are not directly writable by browser roles; mutations go through authenticated RPCs behind FastAPI.
- Agent subject operations enforce Agent ownership.
- Sensitive attributes are not inferred by this phase.

## Data policy

The current database contains:

- 0 interest nodes
- 0 personalization signals
- 0 affinities
- 0 passion clusters
- 0 habit patterns
- 0 personalization goals

No seed/demo/mock/scenario taxonomy or user data was inserted.

## Supabase migrations applied

- `20261002032000_phase_08_personalization_intelligence`
- `20261002032100_phase_08_personalization_derived_intelligence`
- `20261002032200_phase_08_fk_indexes`

Supabase records these migrations with their project migration versions.

## Verification

Database existence/RLS/count verification was executed against project `qltbacemtvnuzqkterly`.

Security advisor: no new Phase 08 security warning. The remaining six INFO findings are the existing intentional backend-authoritative tables from the earlier foundation.

Performance advisor: Phase 08 foreign-key index findings were remediated. Remaining INFO findings are unused indexes in the currently empty development database and are not treated as production performance failures.

## Tests

- `apps/api/tests/test_auth_contract.py` contains Phase 08 unauthenticated endpoint assertions.
- `database/tests/phase_08_personalization_invariants.sql` defines pgTAP schema/RLS/function/no-seed assertions.

Full authenticated E2E is intentionally pending because the project currently has no real Auth user/Agent records. Do not create fake users or Agents merely to make tests appear green.

## Next logical phase

**PHASE 09 — Social Graph**

Do not skip the UI/API/database/security gates. Recommendation ranking remains later than the graph foundation.
