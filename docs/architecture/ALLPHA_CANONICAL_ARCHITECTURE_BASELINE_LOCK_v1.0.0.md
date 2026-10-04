# Allpha Universe — Canonical Architecture Baseline Lock v1.0.0

**Lock ID:** ALLPHA-CANONICAL-ARCHITECTURE-BASELINE-LOCK-2026-10-04  
**Snapshot:** 2026-10-04  
**Repo:** urbanrealty36-ops/Allpha-Universe-PWA / main  
**HEAD at lock:** cf5676eabb815ea1ec87e76e08f6a71bb990f4cb  
**Supabase:** AllphaDb-Universe / qltbacemtvnuzqkterly / ap-south-1

## Purpose
This is the canonical source-controlled architecture planning lock. Future implementation begins with targeted inspection of the affected row(s) and canonical engine(s), not a full architecture reconciliation from zero.

This lock is **not** a runtime Green certificate. Runtime/provider credentials, authenticated E2E, CI, staging and production remain explicit gates.

## Truth hierarchy
1. Live Supabase schema/data/policies/functions/Realtime/Storage
2. main source code
3. migrations
4. architecture documents
5. historical matrices/checkpoints

## Non-negotiable invariants
- 82 domains are capabilities mapped onto a smaller set of canonical engines; they are not 82 independent engines.
- FastAPI is the authoritative Web/Admin application boundary.
- Supabase PostgreSQL is the business-data source of truth; empty business state is valid and synthetic fixtures are prohibited.
- Agent execution remains Agent Runtime -> Policy/Permission -> Risk -> Approval -> execution.
- Model/provider execution remains behind the existing AI Gateway/Model Router.
- Memory/RAG remains on the existing Agent Memory/Knowledge boundary.
- Universe/Spatial remains on the existing spatial runtime and AllphaWorldRenderer.
- Theme/World Builder is presentation/configuration lifecycle, not authority, billing, risk or approval.
- Live WebRTC is transport only and consumes existing Live authorization gates.
- Commerce/Billing/Economy remains server-authoritative.

## Current live snapshot
| Metric | Value |
|---|---:|
| Public tables | 200 |
| Public tables with RLS | 200 |
| Public routines | 275 |
| Realtime publication tables | 26 |
| Applied migrations | 181 |
| Latest migration | 20261004033939 / phase_22_live_webrtc_authorized_participant_transport |
| Topology | 1 Galaxy / 25 Worlds / 100 Districts / 400 Zones / 100 Booths |
| Theme catalog | 25 Themes / 25 Theme Versions / 25 active approved safe performance-passed binary assets |
| Business state | Agents 0 / Memory 0 / Workflows 0 / Live Sessions 0 / Commerce Orders 0 / Billing Subscriptions 0 |

## Gate legend
- G1 = evidence/activation closure
- G2 = credential/provider/storage activation + runtime verification
- G3 = authenticated runtime E2E + dependency validation, then G4 Green
- G4 = final CI/staging/production Green gate

## 82-domain canonical cross-layer map
Columns: **Domain → Canonical Engine → DB → RPC/Functions → FastAPI → Web → Admin → Realtime → Telemetry → Runtime Gate**

|#|Domain|Canonical Engine|DB|RPC / Functions|FastAPI|Web|Admin|Realtime|Telemetry|Gate|
|---:|---|---|---|---|---|---|---|---|---|---:|
|1|Human Identity|Identity & Authorization|users/profiles/identities/user_roles|identity/user RPCs|/api/v1 identity|Identity/Profile|Admin security/users|users/profile RT|auth/security telemetry|G3|
|2|AI Agent Identity|Agent Identity|agents/agent_identities/agent_passports/agent_personas|create_agent_identity|/api/v1/agents|Agent|Admin agents|agents RT|agent runtime telemetry|G3|
|3|Agent Persona|Agent Intelligence|agent_personas|agent identity RPCs|agent endpoints|Agent profile|Admin agents|agent updates|agent activity|G3|
|4|Agent Memory|Memory & Knowledge|agent_memory/embeddings/access_events|retrieve_agent_memory/review_agent_memory|memory/knowledge API|Memory|Admin memory/audit|agent_memory RT|memory audit|G2|
|5|Agent Skills|Agent Skills|agent_skills/catalog/challenge_events/leaderboard|skill lifecycle/quality RPCs|agent skill APIs|Agent Skills|Admin coverage|skill RT where configured|usage/reward telemetry|G2|
|6|Agent Capability|Agent Runtime & Authority|agent_capabilities|set_agent_capability_state|/api/v1/agent-runtime|Agent runtime|Admin agent control|agent state RT|runtime telemetry|G3|
|7|Agent Passport|Agent Trust & Passport|agent_passports|refresh_agent_passport|agents API|Agent passport|Admin security|agent state RT|reputation/history|G3|
|8|Interest Ontology|Personalization Intelligence|interest_nodes|interest graph RPCs|personalization APIs|Interest|Admin analytics/coverage|personalization signals|signal telemetry|G3|
|9|Interest Graph|Personalization Intelligence|interest_nodes/interest_edges|set/remove interest|personalization API|Interest graph|Admin coverage|signals RT|personalization telemetry|G3|
|10|Passion Graph|Personalization Intelligence|passion_clusters/cluster_interests|refresh personalization|personalization API|Passion|Admin coverage|signals RT|derived telemetry|G3|
|11|Habit Graph|Personalization Intelligence|habit_patterns|refresh personalization|personalization API|Habit|Admin coverage|signals RT|behavior telemetry|G3|
|12|Goal Graph|Personalization Intelligence|personalization_goals/goal_interest_links|update goal|personalization API|Goals|Admin coverage|goal signals|personalization telemetry|G3|
|13|Context Graph|Agent Context|agent_spatial_states/personalization_signals/subject_interest_affinities|get agent context/retrieval|agent context API|Agent context|Admin coverage|agent/spatial RT|context telemetry|G3|
|14|Social Graph|Social Graph|social_relationships/blocks/mentions/activity|relationship lifecycle/discovery|/api/v1/social|Social|Admin social/security|social activity/notifications|social telemetry|G3|
|15|Relationship Graph|Social Graph|social_relationships|follow/friend/etc RPCs|social API|Social relationships|Admin coverage|social activity RT|relationship telemetry|G3|
|16|Community Graph|Community|communities/memberships/posts/comments|membership RPCs|community endpoints|Community|Admin community/moderation|community RT|community events|G3|
|17|Content Graph|Content|content_items/content_topic_links/universe_world_content|content/link lifecycle RPCs|/api/v1/content|Content|Admin content/moderation|content events|content telemetry|G3|
|18|Knowledge Graph|Memory & Knowledge|knowledge_items/chunks/access_events|retrieve_agent_knowledge|memory knowledge API|Knowledge|Admin audit|knowledge RT|retrieval/audit telemetry|G2|
|19|Reputation Graph|Reputation & Trust|agent_reputation_events/collaboration_reviews/skill_challenges|review/result/quality RPCs|collaboration/reputation APIs|Reputation|Admin reputation/analytics|reputation events|quality/review telemetry|G3|
|20|Agent Discovery|Discovery|agents/social_relationships|discover_public_agent_accounts|agent/discovery APIs|Agent discovery|Admin coverage|agent catalog/activity|discovery telemetry|G3|
|21|Content Ingestion|Content|content_items/media/media_assets/revisions|create media/attach|content API|Content create/library|Admin content|media/content events|ingestion telemetry|G2|
|22|Feed Engine|Feed & Discovery|feed_impressions/interaction_events/feedback|get_feed/record interaction|/api/v1/feed|Home/Following/For You/Reels|Admin analytics|feed events|feed telemetry|G3|
|23|Reels Engine|Feed & Discovery|content_items/feed_impressions/feed_interaction_events|feed/reel ranking boundary|feed API|Reels|Admin analytics|feed/media RT|reel telemetry|G3|
|24|Stories Engine|Content / Live Experience|stories/content_items/content_media|create_story/publish_story/expire_stories|/api/v1/stories|Stories|Admin coverage/control plane|content/live RT where applicable|content/feed interaction telemetry|G3|
|25|Live Engine|Live Experience|live_sessions/viewers/messages|start/join/end/bind/select character|/api/v1/live|Live|Admin live/operations|live session RT|live telemetry|G2|
|26|AI Live Engine|Live Experience|live_sessions/character_bindings/voice_bindings/agent_runtime_events|live voice/character functions|live API|Live Experience|Admin live/coverage|live/character RT|voice/runtime telemetry|G2|
|27|AI Capsule Engine|AI Capsule / Content Intelligence|ai_capsules|reviewed capsule lifecycle|content/discovery API|AI Capsule|Admin content/analytics|content events|capsule telemetry|G2|
|28|Recommendation Engine|Feed & Discovery|feed_impressions/feedback/subject_interest_affinities|get_feed + Content Gravity|feed/discovery API|Discovery/Feed|Admin analytics|feed signals|ranking telemetry|G3|
|29|Personalization Engine|Personalization Intelligence|personalization_signals/goals/subject_interest_affinities|refresh_subject_personalization|personalization API|Personalization|Admin analytics|signals RT|signal telemetry|G3|
|30|Search / Explore Engine|Discovery|content_items/agents/universe_worlds/marketplace_listings|discovery search/home|/api/v1/discovery/home|Explore/Discovery|Admin analytics/coverage|source RT as applicable|search/discovery telemetry|G3|
|31|Trend Engine|Analytics / Observability|feed_interaction_events/content_events/social_activity_events|no dedicated RPC confirmed|discovery/feed analytics|Discovery/Feed|Admin analytics|source activity|analytics telemetry|G1|
|32|Social Interaction|Social Interaction|social_activity_events/mentions/message_reactions|send/react/report/block|social/messaging APIs|Social/Messaging|Admin moderation|social/message RT|interaction telemetry|G3|
|33|Messaging / DM|Messaging|conversations/participants/messages/delivery_receipts|send/edit/delete/react/block/takeover/service|messaging/social API|Messages/DM|Admin moderation|Supabase Realtime|delivery/interaction telemetry|G3|
|34|Community Engine|Community|communities/posts/comments/events/memberships|create/join/moderate|community API|Community|Admin community/moderation|community RT|community telemetry|G3|
|35|Collaboration Engine|Agent Collaboration|collaboration_requests/negotiations/agreements/results/reviews|discover/request/negotiate/approve/execute/review|/api/v1/agent-collaboration|Agent Collaboration|Admin collaboration|collaboration RT|review/reputation telemetry|G3|
|36|Mission Engine|Workflow / Mission|missions/participants/runs|create/start/sync/cancel|workflow/mission API|Missions|Admin coverage|mission RT|mission telemetry|G3|
|37|Agent Catalog|Agent Catalog|agent_skill_catalog/agent_type_catalog/agent_character_catalog|catalog lifecycle|catalog API|Agent Catalog|Admin catalog|catalog changes|usage/quality telemetry|G3|
|38|Marketplace|Marketplace|marketplace_listings/offers/commerce_orders/items|listing/offer/publish|marketplace API|Marketplace|Admin marketplace/transactions|commerce events|listing telemetry|G2|
|39|Commerce Engine|Commerce|commerce_orders/items/payments/entitlements/events|order/payment/settlement|economy/marketplace API|Commerce/Checkout|Admin transactions|commerce events|payment telemetry|G2|
|40|Economy|Economy|ai_credit_ledger/credit_products/purchases/settlement_events|purchase/balance/reserve/reward|economy API|Credits|Admin billing/transactions|ledger RT if configured|credit telemetry|G2|
|41|Creator Economy|Creator Economy / Payout|payout_accounts/requests/events + commerce/ledger|canonical payout/commerce boundaries|marketplace/content/economy|Creator/Payout|Admin payouts/revenue|commerce events|revenue telemetry|G2|
|42|Event Engine|Community / Live Events|community_events/attendees/live_sessions|create/RSVP via Community boundary|/api/v1/communities/{community_id}/events|Community Events|Admin events/coverage|community RT|event telemetry|G3|
|43|Agent World|Universe / Spatial|universe_worlds/world_agents/agent_presences|spatial state/presence|world runtime API|Universe/World|Admin universe|agent spatial RT|spatial telemetry|G3|
|44|Universe Engine|Universe / Spatial|universe_galaxies/worlds/world_portals|create/join/link world|/api/v1/universe|Universe|Admin universe|world topology RT|world analytics|G3|
|45|District Engine|Universe / Spatial|districts/zones/spatial_objects/memberships|create/access/publish/join|district API|Districts|Admin districts|district RT|district activity|G3|
|46|Booth / Tenant Engine|Booth / Tenant|booths/leases/display_assets/display_slots|create/update/submit/publish/lease|booth API|Booths|Admin booths/operations|booth events|booth telemetry|G2|
|47|Tenant Leasing & Billing|Booth / Tenant + Billing|booth_leases/billing_subscriptions/invoices|request/activate lease + billing|booth/economy APIs|Booth/Billing|Admin billing/operations|booth/billing state|billing telemetry|G2|
|48|World / Scene Schema|Theme / World|world_templates/versions + theme_versions/assets|validation functions|world runtime|World/Scene|Admin themes/worlds|spatial runtime|render telemetry|G2|
|49|Theme Engine|Theme / World|themes/theme_versions/theme_assets|submit/validate/publish/moderate|themes API|Theme Catalog/Builder|Admin Themes|theme asset state|theme publish telemetry|G2|
|50|World Builder|Theme / World|world_builder_states/world_templates/versions|save/submit/validate|world-builder API|World Builder|Admin Worlds|builder state|builder telemetry|G2|
|51|Theme Marketplace|Theme / World + Marketplace|themes/theme_assets/marketplace_listings|Theme + Marketplace lifecycle; no duplicate engine|themes/marketplace APIs|Theme Catalog/Marketplace|Admin themes/marketplace|theme/commerce events|theme analytics|G2|
|52|Agent Simulation Engine|Spatial Runtime|simulation_sessions/ticks/agent_spatial_states|start/pause/resume/tick|/api/v1/spatial-runtime|World/Simulation|Admin spatial/coverage|simulation RT|simulation telemetry|G3|
|53|Encounter Engine|Spatial Runtime|spatial_interactions/agent_spatial_states|create/resolve interaction|world runtime API|World/Spatial|Admin coverage|spatial interactions|interaction telemetry|G3|
|54|Presence Engine|Presence / Realtime|universe_agent_presences/agent_spatial_states/live_session_viewers|enter/exit/update|world/live APIs|Universe/World/Live|Admin presence/security|presence RT|presence telemetry|G3|
|55|Realtime World Engine|Realtime World|spatial_runtime_events/district_activity_events/booth_activity_events/agent_spatial_states|simulation/presence events|world runtime API|World/Live|Admin observability|Supabase Realtime|runtime events|G3|
|56|World Stream|World Stream / Discovery|universe_world_content/spatial_runtime_events/content_events|world placement/discovery reads|discovery API|Universe/Discovery|Admin coverage|world/content events|discovery telemetry|G3|
|57|Notification Engine|Notification|social_notifications/communication_activity_events|mark/read + triggers|social/messaging API|Notifications|Admin notifications/coverage|message/social RT|notification telemetry|G3|
|58|Analytics|Analytics / Observability|ai_usage_events/feed_impressions/feed_interaction_events/content_events/commerce_events/social_activity_events|admin analytics RPC|/api/v1/admin/control-plane/analytics|Product/Admin analytics|Admin Observability|source RT|daily operational series|G3|
|59|Policy Engine|Policy & Governance|agent_policies/policy_rules|set/revoke policy/capability|agent runtime/admin APIs|Agent control|Admin Agent Policies|policy state|security/runtime telemetry|G3|
|60|Permission Engine|Permission & Authorization|permissions/agent_permissions/platform_role_permissions|authorization helpers|all protected APIs|all protected surfaces|Admin security|domain RT where applicable|audit/security telemetry|G3|
|61|Risk Engine|Risk|risk_assessments|risk workflow/RPCs|admin/control-plane + domain APIs|Risk-aware actions|Admin Risk|risk evidence|risk telemetry|G3|
|62|Human Approval Engine|Human Approval|approval_requests|decide approval|admin/collaboration APIs|Approval flows|Admin Approvals|approval RT where configured|audit telemetry|G3|
|63|Audit Ledger|Audit Ledger|audit_logs/agent_memory_access_events/knowledge_access_events|audit + mutation triggers|admin APIs|Audit/history|Admin Audit|audit events|governance telemetry|G3|
|64|Trust & Safety|Trust & Safety|security_events/content_moderation_cases/community_moderation_cases/risk_assessments|security/risk/report workflows|security/admin APIs|Safety/Reports|Admin Security/Moderation|reports/events|safety telemetry|G3|
|65|Moderation|Moderation|content_moderation_cases/community_moderation_cases/message_reports|submit/decide moderation|moderation API|Content/Community moderation|Admin Moderation|moderation events|moderation telemetry|G3|
|66|Privacy|Privacy|communication_preferences/social_blocks/agent_memory_access_events|communication/privacy helpers|identity/social/messaging APIs|Privacy/Security|Admin Security|message/social RT|privacy/security telemetry|G3|
|67|Security|Security|security_devices/security_events/security_rate_limit_buckets/security_session_revocations|security checks/rate limits|security boundary|Security surfaces|Admin Security|security/session events|security telemetry|G2|
|68|Identity Verification|Identity Verification|identities/live_human_presence_verifications|verification functions|identity/live APIs|Identity/Security/Live|Admin security/users|identity/presence events|verification telemetry|G2|
|69|Anti-Impersonation|Anti-Impersonation|anti_impersonation_evidence + identity/passport/presence evidence|get_anti_impersonation_evidence + verified public Agent boundary|identity/security/public-Agent APIs|Identity/Security/Agent|Admin security/identity|identity/presence events|security/audit telemetry|G2|
|70|Anti-Fraud|Anti-Fraud|risk_assessments/security_events/idempotency_keys/commerce_payments|risk/settlement controls|economy/admin APIs|Checkout/Security|Admin Risk/Transactions|commerce events|fraud/risk telemetry|G2|
|71|Agent Interoperability|Agent Interoperability|collaboration_requests/agreements/agent_service_requests|collaboration request/agreement|collaboration/messaging APIs|Agent Collaboration|Admin coverage|collaboration events|interop telemetry|G2|
|72|Agent API / Protocol|Agent API / Protocol|agent_service_requests/agent_commands/tool_definitions/tool_runs|agent runtime/collaboration|FastAPI Agent Runtime/AI Gateway|Agent/Runtime|Admin developer/runtime|domain RT|API telemetry|G2|
|73|Subscription / Billing|Billing|billing_plans/subscriptions/invoices|create/cancel subscription + invoices|economy API|/billing|Admin Billing/Plans/Pricing|billing state|billing/payment telemetry|G2|
|74|Revenue Engine|Revenue / Payout|commerce_payments/payout_events/payout_requests/economy_settlement_events|transaction/revenue views|economy/payout/admin APIs|Billing/Payouts|Admin Revenue/Transactions|commerce events|revenue telemetry|G2|
|75|Entitlement Engine|Entitlement|commerce_entitlements/district_entitlements|grant/revoke|domain APIs|Billing/District/Access|Admin Entitlements|entitlement state|usage telemetry|G3|
|76|Feature Flag Engine|Feature Flags|platform_feature_flags|upsert/get flags|admin control-plane API|flag-aware surfaces|Admin Feature Flags|flag state|control-plane audit|G3|
|77|Configuration Engine|Configuration|platform_config_versions|create/publish/rollback|admin control-plane API|config-dependent surfaces|Admin Configuration|config lifecycle|audit|G3|
|78|Super Admin Control Plane|Super Admin Control Plane|platform_roles/platform_role_permissions/audit_logs/approval_requests/risk_assessments|domain explorer/operations/master-data/transactions/context|admin control-plane API|Admin Overview/Transactions/Operations/Master Data|Admin control plane|not realtime-dependent|analytics/audit|G3|
|79|Developer Platform|Developer Platform|agent_tool_definitions/agent_credentials/ai_models/ai_providers|FastAPI contracts; no complete public portal|Agent Runtime/AI Gateway|Agent/Runtime|Admin API/provider|API telemetry|provider/API telemetry|G2|
|80|Observability|Observability|ai_usage_events/ai_gateway_requests/attempts/agent_runtime_events/workflow_events/spatial_runtime_events|get_admin_analytics + security summary|admin analytics/security APIs|Admin Observability|Admin Observability|source telemetry/RT|operational series/security posture|G3|
|81|Evaluation Engine|Evaluation|skill_challenge_events/leaderboard/collaboration_reviews/ai_usage_events|quality/review + analytics inputs|agent skills/collaboration/admin analytics|Skills/Collaboration|Admin Analytics/QA|telemetry inputs|evaluation telemetry|G2|
|82|E2E Test / QA Engine|E2E / QA|audit_logs/security_events/workflow_events|test SQL suites|health + canonical routers|PWA/Admin|Admin E2E/QA|realtime tests|test/telemetry evidence|G4|

## Reconciliation corrections captured by this lock
- Stories Engine is now canonical through public.stories + create_story/publish_story/expire_stories + /api/v1/stories. Historical matrix evidence saying no story persistence existed is stale.
- Anti-Impersonation is now canonical through anti_impersonation_evidence + get_anti_impersonation_evidence and verified Agent identity/passport exposure. Historical registry evidence saying no dedicated evidence contract existed is stale.
- Current live Theme 3D state is 25 active approved/safety-passed/performance-passed assets; older zero-asset snapshots are historical.
- WebRTC remains a transport layer; it does not create or bypass Live authorization.

## Future change protocol
1. Read this lock first.
2. Inspect only affected domain rows, canonical engines and declared dependencies.
3. If a new table/RPC/API/UI/Realtime/telemetry/authority boundary is introduced, update this lock in the same change set.
4. If a domain composes an existing engine, update the mapping instead of creating a duplicate engine.
5. Runtime success updates runtime evidence separately; source/schema completion never becomes Green by implication.
6. Historical workbooks do not override this lock.
7. A material architecture change requires a new lock version.

**LOCK STATE: CANONICAL FOR IMPLEMENTATION PLANNING — v1.0.0**
