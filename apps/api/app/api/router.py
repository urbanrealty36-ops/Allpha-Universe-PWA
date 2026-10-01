from fastapi import APIRouter, HTTPException

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
    child = APIRouter(prefix=path, tags=[domain])

    @child.get("")
    async def list_resource() -> None:
        not_connected(domain)

    return child


for _path, _domain in [
    ("/users", "Users"),
    ("/agents", "Agents"),
    ("/content", "Content"),
    ("/communities", "Communities"),
    ("/universe", "Universe"),
    ("/galaxies", "Galaxies"),
    ("/worlds", "Worlds"),
    ("/districts", "Districts"),
    ("/booths", "Booths"),
    ("/themes", "Themes"),
    ("/marketplace", "Marketplace"),
    ("/missions", "Missions"),
    ("/events", "Events"),
    ("/plans", "Plans"),
    ("/features", "Features"),
    ("/entitlements", "Entitlements"),
    ("/billing", "Billing"),
    ("/credits", "Credits"),
    ("/ai/providers", "AI Providers"),
    ("/ai/model-router", "Model Router"),
    ("/ai/policies", "AI Policies"),
    ("/agent-policies", "Agent Policies"),
    ("/security", "Security"),
    ("/risk", "Risk"),
    ("/moderation", "Moderation"),
    ("/reports", "Reports"),
    ("/audit-logs", "Audit Logs"),
    ("/feature-flags", "Feature Flags"),
    ("/system-settings", "System Settings"),
    ("/localization", "Localization"),
    ("/notifications", "Notifications"),
    ("/analytics", "Analytics"),
    ("/observability", "Observability"),
    ("/e2e-qa", "E2E QA"),
]:
    router.include_router(domain_router(_path, _domain))
