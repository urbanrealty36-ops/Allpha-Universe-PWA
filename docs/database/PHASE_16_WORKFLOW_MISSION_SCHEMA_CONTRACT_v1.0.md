# Phase 16 — Workflow & Mission Schema Contract v1.0

## Tables
- workflows
- workflow_versions
- workflow_steps
- workflow_runs
- workflow_run_steps
- workflow_events
- missions
- mission_participants
- mission_runs

## Relationships
- workflows 1→N workflow_versions
- workflow_versions 1→N workflow_steps
- workflow_runs reference workflow + immutable workflow_version + Agent Command
- workflow_run_steps project workflow steps onto Phase 15 Agent tasks/steps
- missions reference reusable workflows
- mission_participants belong to missions
- mission_runs reference participants and workflow_runs

## State
Workflow definitions: draft → active → archived.
Versions: draft → published → archived.
Workflow runs: created → preparing → ready → running → waiting_approval → completed/failed/cancelled/killed.
Missions: draft → open → active → completed/cancelled/archived.
Mission participants: pending → active → completed/left/removed/rejected.

## Authority
PostgreSQL/RLS is authoritative for ownership and visibility. Phase 15 is authoritative for Agent command execution and risk/approval. Phase 16 must never bypass those controls.

## Data integrity
No Phase 16 business seed records are inserted. The only pre-existing Agent Runtime tool is the canonical ai.generate system tool.
