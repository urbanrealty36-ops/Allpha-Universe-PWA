# WEB Identity + Onboarding Spatial Refactor — 2026-10-05

## Status
IMPLEMENTED / RAILWAY BUILD + DEPLOYMENT VERIFIED / BROWSER QA PENDING

## Identity Gateway
The human identity gateway was redesigned around the Allpha spatial visual language:
- Cosmic/orbital background
- Human Identity → Agent → Memory → Universe visual hierarchy
- Distinct Sign In and Create Identity form structures
- Google OAuth action for both modes through the existing Supabase Auth boundary
- Sign In: email + password
- Create Identity: human name + email + password + confirm password
- Signup stores the provided human name in Supabase auth user metadata
- Signup redirects to /onboarding after authenticated/email verification flow
- Sign In preserves the requested destination

## Onboarding Orbit
Added /onboarding with an interactive orbit-style sequence:
1. Identity Orbit
2. World Orbit
3. Goal Galaxy
4. Communication Orbit
5. Agent Core
6. Memory Capsule

The onboarding captures human identity, interests, passion, goals, communication preferences, initial Agent role/name, important context and boundaries.

The completed onboarding context is stored in Supabase Auth user metadata as an explicit onboarding draft. It is not treated as authorization or business authority.

## Agent Intelligence Bridge
When the user enters Agent Factory from onboarding, the existing canonical Agent creation flow remains authoritative. After the user explicitly creates the Agent, the onboarding context is written through the existing canonical Agent endpoints:
- /api/v1/agents/{agent_id}/memory
- /api/v1/agents/{agent_id}/knowledge

The generated records are marked as user-explicit/private onboarding context and do not bypass ownership or Agent Runtime authority.

## Railway
Final deployment:
- Deployment: 09a3c9c1-1295-48ae-9789-09e45d137816
- Status: SUCCESS
- Commit: acef617c538d3c8d92c05518a2e1a96eb0e9533c
- Region: asia-southeast1-eqsg3a

A transient failed build was diagnosed and corrected: the onboarding component had an incorrect relative Supabase client import. The final deployment succeeded after correcting it.

## Browser QA
Real-device/browser visual QA remains pending because direct browser access to the Railway public surface is not available in the current execution environment.

Production GREEN is not claimed until visual/authenticated E2E validation is completed.