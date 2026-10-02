# Allpha Universe — Agent Runtime & Command System v1.0

## Purpose

Phase 15 is the canonical server-side runtime for executing actions on behalf of a Human-owned AI Agent.

## Runtime pipeline

Human → Agent Command → Planner → Tool/Capability Validation → Policy → Risk → Approval → Execution → Result → Spend/Audit

## State machine

Command states: planning, ready, running, waiting_approval, completed, failed, cancelled, killed, denied.

Task and Step states are independently persisted and remain linked to the command.

## Components

- agent_commands
- agent_execution_contexts
- agent_tasks
- agent_task_steps
- agent_tool_definitions
- agent_tool_runs
- agent_kill_switches
- agent_runtime_events
- agent_spend_events

## Planner

Planner execution uses the Phase 14 AI Gateway. The model receives only the Agent configuration/context required for planning and the enabled Tool Definition registry. It must return a constrained JSON plan.

The server does not trust planner claims about tool availability, Agent capability, risk, authority, ownership, approval or budget. Those are re-evaluated server-side.

## Tool boundary

The initial built-in tool is ai.generate, delegated to the Phase 14 AI Gateway.

A tool is executable only when it exists and is enabled, the Agent owns the required capability, authoritative risk metadata is accepted, Agent Policy permits execution, approval requirements are satisfied, and the kill switch is disabled.

No implicit arbitrary shell/network/SQL/secret access exists.

## Risk and approval

Tool risk is authoritative. Command risk is derived from materialized tools and cannot be lowered by planner output.

Approval is requested through the existing approval_requests domain for high/critical and autonomy/policy-sensitive actions. Approval decision is server-side and audited through runtime events.

## Kill switch

The Human owner can immediately enable an Agent kill switch. Pending/running/waiting commands, execution contexts, tasks and steps are moved to killed state.

## Spending and rate limits

Agent Policy may define command rate limits. Agent Budgets enforce action, daily and monthly spend ceilings. Actual tool spend is recorded in agent_spend_events.

## Security

- RLS enabled on every Phase 15 table.
- Direct runtime table mutation is not the application path.
- Mutations use authenticated SECURITY DEFINER RPCs.
- Runtime RPCs pin search_path to an empty value.
- Every command and step is owner-bound.
- No synthetic Agent/command/task data is seeded.
- Planner chain-of-thought is not persisted or exposed.

## Current runtime capability

ai.generate is implemented at the executor boundary and delegates to Phase 14.

Additional tools require explicit Tool Definition, capability, risk, server executor implementation and audit contract.

## GREEN gate

Phase 15 remains IMPLEMENTED / FOUNDATION COMPLETE until authenticated Agent E2E, real AI provider/model configuration, planner generation, command execution, approval/resume, kill switch, rate/spend limits, CI/build and runtime verification all pass.
