# Phase 23C — Human Approval + Collaboration Agreement

## Purpose

23C converts an accepted Agent-to-Agent negotiation into a declarative collaboration agreement and binds it to the existing Human Approval and Risk boundaries.

## Rules

- No second Approval engine.
- No second Risk engine.
- No capability grant.
- No Agent Policy mutation.
- No executable code/script in agreement data.
- Agreement scope/terms/constraints are declarative JSON only.
- Approval is required from each distinct Human Owner participating in the agreement. If both Agents have the same owner, one approval is sufficient.
- 23D must re-check current Agent ownership, active state, capability, policy, kill switch and risk before execution.
- Agreement snapshots are evidence/history, not authority.

## Flow

Human Owner / Agent
→ accepted collaboration request
→ existing Agent DM negotiation
→ agreement proposal
→ existing Risk Assessment record
→ existing Approval Request record(s)
→ Human approval
→ approved declarative agreement
→ Phase 23D execution boundary

## Agreement state

- pending_approval
- approved
- rejected
- expired
- cancelled

Negotiation is moved to agreed when the agreement is created.

## Snapshot model

The agreement records:
- requester/target Agent
- distinct Human owners
- requested capabilities
- current enabled capability snapshots
- current policy versions
- purpose
- agreed scope
- constraints
- terms
- risk level
- expiry

Snapshots are immutable evidence for the collaboration record. They never grant authority.

## Risk / approval binding

23C records risk_assessments using:
- action: agent.collaboration.commit
- resource_type: agent_collaboration_agreement
- resource_id: agreement id
- decision: approval_required

Risk level is derived from the declarative agreement:
- low: empty capability/scope/constraints/terms
- medium: any non-empty capability/scope/constraints/terms
- high: explicit financial commitment, sensitive data, or irreversible action term

The risk record explicitly marks execution_recheck_required=true.

Human approval is stored in the existing approval_requests table with the agreement as resource. One request is created per distinct Human Owner.

## Security

- Agreement/event tables: RLS + FORCE RLS.
- Browser has SELECT only.
- All mutations go through authenticated RPCs.
- RPCs use SECURITY DEFINER, pinned search_path='', schema-qualified relations and authenticated-only EXECUTE.
- No service-role or secret reaches the browser.

## Verification target

23C foundation verification:
- tables/RLS/policies/functions exist
- authenticated EXECUTE only
- no anonymous EXECUTE
- no orphan agreement records
- no synthetic business data
- security/performance advisors reviewed

23C is not final GREEN. Final E2E, real runtime, workflow execution, CI/CD and production gates remain later.

## Next

23D — Execution: translate only an approved agreement into existing Agent Runtime / AI Gateway / Workflow/Mission primitives.
