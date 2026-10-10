from uuid import UUID

from app.api.theme_generation import (
    V3_EXISTING_ASSET_IDS,
    V3_PLATFORM_CATALOG_SLUG,
    V3_PLATFORM_THEME_SLUG,
    router,
)


def test_v3_reconciliation_scope_is_exactly_17_existing_assets() -> None:
    assert len(V3_EXISTING_ASSET_IDS) == 17
    assert len(set(V3_EXISTING_ASSET_IDS.values())) == 17
    for asset_id in V3_EXISTING_ASSET_IDS:
        assert str(UUID(asset_id)) == asset_id


def test_v3_reconciliation_uses_canonical_platform_identity() -> None:
    assert V3_PLATFORM_THEME_SLUG == "allpha-universe-v3"
    assert V3_PLATFORM_CATALOG_SLUG == "allpha-universe-v3"
    endpoint = next(
        route for route in router.routes
        if getattr(route, "path", "").endswith("/internal/v3-tripo-assets/reconcile")
    )
    assert "POST" in endpoint.methods
    assert endpoint.path == "/api/v1/theme-generation/internal/v3-tripo-assets/reconcile"
