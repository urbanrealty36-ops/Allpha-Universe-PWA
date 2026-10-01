from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import require_auth

router = APIRouter(prefix="/api/v1")


def not_connected(domain: str) -> None:
    raise HTTPException(
        status_code=503,
        detail={
            "code": "DOMAIN_DATA_NOT_CONNECTED",
            "domain": domain,
            "message": "Authoritative backend and Supabase persistence are not connected for this domain yet.",
        },
    )


def domain_router(path: str, domain: str) -> APIRouter:
    child = APIRouter(prefix=path, tags=[domain], dependencies=[Depends(require_auth)])

    @child.get("")
    async def list_resource() -> None:
        not_connected(domain)

    return child


for _path, _domain in [
    ("/content", "Content"),
    ("/feed", "Feed"),
    ("/reels", "Reels"),
    ("/explore", "Explore"),
    ("/live", "Live"),
    ("/interests", "Interests"),
    ("/passions", "Passions"),
    ("/habits", "Habits"),
    ("/goals", "Goals"),
    ("/contexts", "Contexts"),
    ("/social-graph", "Social Graph"),
    ("/relationships", "Relationships"),
    ("/messages", "Messaging"),
    ("/notifications", "Notifications"),
    ("/communities", "Communities"),
    ("/universe", "Universe"),
    ("/galaxies", "Galaxies"),
    ("/worlds", "Worlds"),
    ("/worlds/presence", "World Presence"),
    ("/districts", "Districts"),
    ("/booths", "Booths"),
    ("/themes", "Themes"),
    ("/world-builder", "World Builder"),
    ("/theme-builder", "Theme Builder"),
    ("/missions", "Missions"),
    ("/workflows", "Workflow Engine"),
    ("/events", "Events"),
    ("/collaboration", "AI Collaboration"),
    ("/marketplace", "Marketplace"),
    ("/commerce", "Commerce"),
    ("/orders", "Orders"),
    ("/transactions", "Transactions"),
    ("/payouts", "Payouts"),
    ("/plans", "Plans"),
    ("/features", "Features"),
    ("/entitlements", "Entitlements"),
    ("/billing", "Billing"),
    ("/credits", "Credits"),
    ("/ai/providers", "AI Providers"),
    ("/ai/model-router", "Model Router"),
    ("/ai/policies", "AI Policies"),
    ("/security", "Security"),
    ("/risk", "Risk"),
    ("/moderation", "Moderation"),
    ("/reports", "Reports"),
    ("/audit-logs", "Audit Logs"),
    ("/feature-flags", "Feature Flags"),
    ("/system-settings", "System Settings"),
    ("/localization", "Localization"),
    ("/analytics", "Analytics"),
    ("/observability", "Observability"),
    ("/e2e-qa", "E2E QA"),
]:
    router.include_router(domain_router(_path, _domain))
