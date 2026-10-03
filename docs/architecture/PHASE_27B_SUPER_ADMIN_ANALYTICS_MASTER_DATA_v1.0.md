# PHASE 27B — Super Admin Domain Operations & Governance Surfaces

Status: IMPLEMENTED FOUNDATION / NOT GREEN

## 27B scope
Phase 27B activates the Super Admin control plane over existing domain source-of-truth data and adds a server-authoritative Executive Analytics + Master Data surface.

## Executive Analytics
Canonical RPC: public.get_admin_analytics(p_from,p_to).

KPI domains:
- Users: total/new
- Agents: total/created
- Content: published/created/events
- Engagement: feed impressions, interactions, watch hours, engagement rate
- Commerce: orders, paid orders, gross captured IDR, Marketplace GMV, payment attempts, captured payments, payment success rate, AOV, unique buyers, repeat buyers and repeat-buyer rate
- Billing: active/new subscriptions, paid invoices and invoice value
- Economy: credit purchases and credits purchased
- Payouts: requests, paid, paid value and pending
- AI: requests, completed, tokens, estimated cost and latency
- Governance: pending approvals, risk assessments, audit events and moderation cases
- Universe: galaxies, worlds, memberships, active presences, districts, zones and booths

Interactive analytics:
- 7 / 30 / 90 day range
- daily revenue/order/user/engagement/AI-token series
- commerce order-kind breakdown
- commerce funnel
- AI operational metrics
- governance + Universe operational metrics
- daily activity table

All values are computed from existing PostgreSQL source-of-truth tables. No synthetic transactions, revenue, users, orders or analytics records are inserted.

## Master Data
Canonical RPC: public.get_admin_master_data().

Read surfaces:
- Platform Roles
- Permissions
- Agent Types
- Agent Skills
- Agent Characters
- Themes
- Theme Versions
- World Templates
- Billing Plans
- Credit Products
- AI Providers
- AI Models
- Feature Flags
- Configuration Versions

Provider credentials/secrets are intentionally excluded.

## Architecture
Admin Browser -> FastAPI -> existing RBAC permission -> authenticated RPC wrapper -> private SECURITY DEFINER analytics/master-data function -> PostgreSQL source-of-truth.
No direct privileged database access from Admin UI. No duplicate transaction, billing, economy, AI, feed, moderation, approval, risk or domain engine is introduced.

## Live verification
- Analytics RPC executed using a temporary Super Admin role inside a rollback transaction.
- Analytics returned real current source-of-truth values and daily series.
- Master Data RPC returned authoritative catalog sections.
- Test role assignment was rolled back; no production authorization state was changed.
- Phase 27B security invariants: PASS.
- Public EXECUTE on analytics/master-data wrappers: revoked.
- Authenticated EXECUTE: present.
- Private functions: SECURITY DEFINER with fixed search_path.

## Current live data reality
At verification time, the database contained real platform infrastructure/catalog data (including published Universe/Theme topology and AI catalog records), while commerce, payments, content, agents and most user activity tables were empty. Therefore the dashboard correctly renders zero/empty metrics where no real events exist.

## Remaining gates
- authenticated browser E2E with actual Super Admin session
- API/Admin typecheck/build/CI
- full domain-operation surfaces for every listed domain
- runtime validation against real Marketplace transactions, subscriptions, payouts and AI usage
- Phase 26 production security gate remains separate and pending by user decision
- final E2E/CI/runtime/production Green remains deferred

## Next
PHASE 27C — Super Admin Domain Operations, Transaction Explorer & Master Data Management
Focus: searchable/paginated transaction explorer, order/payment/payout drill-down, user/Agent/content moderation operations, Universe/Theme/Booth operations, and controlled Master Data management with approval/audit where required.