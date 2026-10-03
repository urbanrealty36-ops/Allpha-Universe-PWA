# PHASE 15 — Agent Runtime & Command System Completion Audit

Date: 2026-10-03
Repository: urbanrealty36-ops/Allpha-Universe-PWA
Branch: main
Supabase: AllphaDb-Universe / qltbacemtvnuzqkterly

## Completion boundary

Phase 15 is the single authoritative Agent execution engine.

**Human Owner → Agent Passport/Policy → Command → Plan → Risk → Approval → Execution → Tool / AI Gateway → Result → Audit/Telemetry**

No second Agent executor is introduced.

## Implemented

### Command system
- Authenticated command creation.
- Human-owner authorization.
- Active Agent validation.
- Kill-switch check.
- Idempotency.
- Policy/autonomy snapshot.
- Command rate limiting.
- Correlation ID.

### Planning
- Planner delegates only to Phase 14 AI Gateway.
- Declarative JSON plan contract.
- Plan materialization through the authoritative Tool Definition registry.
- Capability validation before step creation.
- Tool risk level becomes command risk.
- No invented tools/capabilities are executable.

### Runtime context
Added `get_agent_runtime_context(command_id)`.

It supports:
- Agent owner commands.
- Authorized Phase 13 cross-owner Agent Service requests.
- Live command context.

Cross-owner planning receives only:
- Agent identity needed for service execution.
- Published/active capabilities.
- Enabled compatible tools.
- Sanitized policy/autonomy information.

It does not expose:
- private policy rules;
- private capability constraints;
- private Agent persona.

### Approval
- High/critical/rule-required commands enter `waiting_approval`.
- Agent Owner is the approver for cross-owner Agent Service commands.
- Approval expiry is now a real 15-minute future window.
- Approval decision is revalidated.
- Resume rechecks Agent status, kill switch, current policy and current capabilities.
- Expired approvals cannot resume execution.

### Execution
- Canonical built-in `ai.generate` executor delegates to Phase 14 AI Gateway.
- Gateway request ID is preserved in Agent tool result telemetry.
- Agent spend is recorded through the existing spend ledger.
- Failure transitions command to failed and records tool failure.
- Completion/failure/cancel/kill reconcile command, execution context, tasks, steps and Agent runtime state.
- Kill switch moves active runtime state to killed/sleeping and blocks further execution.

### Observability
- Agent runtime events.
- Tool runs.
- Step result/error/latency.
- Spend events.
- Risk assessments.
- Approval lifecycle.
- Correlation IDs.

## Critical reconciliations made

1. **Approval expiry bug**
   - Previous implementation wrote `expires_at = now()`.
   - This made newly-created approvals effectively expired.
   - Fixed to `now() + 15 minutes`.

2. **Cross-owner planner RLS mismatch**
   - Agent/policy/capability tables are owner-readable.
   - A legitimate Agent Service requester therefore could not retrieve sufficient planner context through ordinary REST/RLS.
   - Fixed through a narrowly scoped SECURITY DEFINER Runtime Context RPC with explicit command/requester authorization and privacy filtering.

3. **Runtime transition telemetry**
   - Previous transition code inserted the post-update command status as `from_state`.
   - Fixed by capturing `previous_status` before mutation.

4. **Runtime state reconciliation**
   - Command transitions now synchronize Agent runtime state and task/step terminal state.
   - Approval state uses `awaiting_approval`.

## Live state

At implementation time:
- Agents: 0
- Commands: 0
- Tasks: 0
- Task Steps: 0
- Tool Definitions: 1
- Tool Runs: 0
- Runtime Events: 0
- Execution Contexts: 0
- Spend Events: 0
- Approval Requests: 0
- Risk Assessments: 0

Zero counts are legitimate and intentional. No synthetic runtime business data was inserted.

## Security

- Runtime tables remain RLS protected.
- Command/task/event reads are owner/requester scoped.
- Runtime Context RPC is authenticated-only.
- SECURITY DEFINER runtime RPCs pin `search_path`.
- Cross-owner context is limited to a valid Agent Service command.
- No browser-side secret or direct provider execution path exists.
- Existing project-wide Supabase Advisor findings outside Phase 15 remain deferred to the dedicated security hardening phase.

## Status

**PHASE 15 — IMPLEMENTED / NOT GREEN**

Feature/domain/engine integration is complete at repository + live-schema level.

Still deferred by the project's current execution policy:
- authenticated real Agent creation;
- real planner/provider execution;
- approval/resume E2E;
- kill-switch/rate-limit/budget runtime evidence;
- broader tool executor activation;
- realtime/browser verification;
- API/PWA/Admin build and CI;
- Vercel/Railway deployment;
- production Green.

The current single built-in executable tool is `ai.generate`; additional tools must be activated through the authoritative Tool Definition + capability + policy + risk + executor boundary rather than bypassing Agent Runtime.
