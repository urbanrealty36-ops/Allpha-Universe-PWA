# Allpha Universe — Workflow & Mission Engine v1.0

## Purpose
Phase 16 is the reusable orchestration layer above the Phase 15 Agent Runtime. It defines durable workflows and user-facing missions without creating a second Agent executor.

## Boundaries
- Workflow definition is authoritative in PostgreSQL.
- Workflow execution is delegated to Phase 15 Agent Command / Task / Step runtime.
- Phase 14 AI Gateway remains the only model-provider execution boundary.
- Human approval, policy, risk, capability, spend, rate-limit and kill-switch controls remain authoritative in Phase 15.
- Frontend uses FastAPI; it never mutates workflow tables directly.
- No scheduler worker is fabricated in this phase. Schedule/webhook trigger types are stored as contracts and activated by later integration phases.

## Workflow model
Workflow → Version → Steps → Run → Run Steps → Events.

A published version is immutable from the API contract. A new version is created for changes.

Each step references an enabled Agent Tool Definition and carries arguments, input schema, condition contract, retry policy, risk level and approval requirement.

Publishing fails when there are no enabled steps or a referenced tool is unavailable.

## Execution contract
1. Human selects a published Workflow Version and an owned Agent.
2. create_workflow_run creates the authoritative run and run-step records.
3. prepare_workflow_run converts the workflow definition into a deterministic Phase 15 Agent plan.
4. Phase 15 materialize_agent_plan validates tools and Agent capabilities.
5. Phase 15 begin_agent_execution evaluates policy/risk/approval.
6. Phase 15 executes tools through its existing executor and Phase 14 AI Gateway.
7. sync_workflow_run projects command/task state into workflow run state.

This keeps Workflow/Mission orchestration separate from execution authority.

## Mission model
Mission → Participants → Mission Runs → Workflow Runs.

Missions provide a goal-oriented collaboration surface around a reusable Workflow. Participation is Human/Agent ownership-bound. Open missions can be joined; approval/invite policies are stored and enforced by the database contract.

A Mission Run references a participant and a Workflow Run. It never executes tools directly.

## Security
- All nine Phase 16 tables use RLS.
- Direct table mutation is revoked from authenticated/anonymous roles.
- Mutations use authenticated SECURITY DEFINER RPCs with pinned empty search_path.
- Workflow and Agent ownership are checked server-side.
- No client-provided flag can grant ownership or bypass Agent Runtime policy.
- Events are telemetry/audit inputs, never authorization.
- Empty state is valid; no workflow, mission, participant or run records are seeded.

## API
FastAPI prefix: /api/v1/workflows

Includes workflow/version/step authoring, publishing, run creation/preparation/execution, mission creation/joining and mission-run execution/synchronization.

## UI
User PWA route: /workflows.

The surface provides real workflow authoring, version/step creation, publishing, Agent UUID selection for execution, Mission creation and authoritative run state. The initial UI exposes the currently registered ai.generate tool rather than inventing unavailable tools.

## Not yet Green
Authenticated E2E with real Agents, real AI provider configuration, approval/resume runtime, retry execution, schedule/event/webhook triggers, multi-participant mission runtime, CI/build and final runtime verification remain later gates.
