# Local API Contract Boundary

Base URL: http://localhost:8000

FastAPI interactive contract:
- /docs
- /redoc
- /health

All domain endpoints live under /api/v1.

The current domain registry intentionally returns HTTP 503 with code DOMAIN_DATA_NOT_CONNECTED until the authoritative service/repository/Supabase implementation for that domain is activated. This is a real operational state, not mock data.

Agent command has a dedicated contract:
POST /api/v1/agents/{agent_id}/command

Its runtime implementation will enforce:
Authentication → Authorization → Agent Permission → Policy → Risk → Human Approval when required → Workflow/Mission → Tool → Audit → Realtime.

## Contract domains

Authentication, Users, Agents, Agent Memory, Agent Knowledge, Agent Skills, Agent Capabilities, Agent Passports, Agent Permissions, Agent Policies, Content, Feed, Reels, Explore, Live, Interests, Passions, Habits, Goals, Contexts, Social Graph, Relationships, Messaging, Notifications, Communities, Universe, Galaxies, Worlds, World Presence, Districts, Booths, Themes, World Builder, Theme Builder, Missions, Workflow Engine, Events, AI Collaboration, Marketplace, Commerce, Orders, Transactions, Payouts, Plans, Features, Entitlements, Billing, Credits, AI Providers, Model Router, AI Policies, Security, Risk, Moderation, Reports, Audit Logs, Feature Flags, System Settings, Localization, Analytics, Observability and E2E QA.

No frontend or admin application may call Supabase privileged operations directly.
