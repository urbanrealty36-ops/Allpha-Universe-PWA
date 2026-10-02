## Phase 23D — Execution

### Purpose
Bind an approved Phase 23C collaboration agreement to the existing Agent Runtime execution boundary.

### Execution flow
Approved Collaboration Agreement → create collaboration execution command → Agreement/Agent/Capability binding → existing Agent Runtime planning → existing begin_agent_execution() → current Policy + Capability + Kill Switch + Risk re-check → existing AI Gateway / Workflow / Mission primitives.

### Security rules
- Agreement must be approved at command creation and execution time.
- Agreement expiry is enforced.
- Execution Agent must be one of the Agreement participants and owned by the authenticated Human.
- Requested execution capabilities must remain within Agreement capabilities.
- Current Agent capabilities are re-checked; revoked capabilities fail closed.
- Current Agent Policy is re-read at execution.
- Kill switch is re-checked.
- A fresh risk_assessments row is created for execution with execution_recheck=true.
- Existing command-level approval can still be required by autonomy/risk/tool policy.
- No Agreement grants capability, permission, policy or bypasses command approval.
- No new Agent Runtime, AI Gateway, Workflow or Mission engine is introduced.

### Implementation
- agent_commands.collaboration_agreement_id binds command to Agreement.
- create_collaboration_execution_command() creates the command through existing create_agent_command() and marks command_source=collaboration.
- begin_agent_execution() now validates the Agreement and re-checks current authority.
- FastAPI endpoint: POST /api/v1/agent-collaboration/agreements/{agreement_id}/execute

### Verification
- Binding column/FK exists.
- Execution binding RPC exists.
- Authenticated EXECUTE only; anonymous EXECUTE denied.
- No synthetic collaboration commands seeded.
- Security/performance advisors reviewed.
- Full authenticated E2E remains a later gate.

### Status
IMPLEMENTED FOUNDATION — NOT GREEN

### Next
Phase 23E — Review + Reputation + History
