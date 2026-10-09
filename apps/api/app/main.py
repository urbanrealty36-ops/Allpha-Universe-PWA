from __future__ import annotations

import os
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.security import SecurityHeadersMiddleware

from app.api.agents import router as agents_router
from app.api.agent_catalog import router as agent_catalog_router
from app.api.agent_skills import router as agent_skills_router
from app.api.ai_gateway import router as ai_gateway_router
from app.api.agent_runtime import router as agent_runtime_router
from app.api.workflows import router as workflows_router
from app.api.universe import router as universe_router
from app.api.spatial_runtime import router as spatial_runtime_router
from app.api.districts import router as districts_router
from app.api.booths import router as booths_router
from app.api.themes import router as themes_router
import importlib
three_d_generation_router = importlib.import_module("app.api.3d_generation").router
from app.api.live import router as live_router
from app.api.world_builder import router as world_builder_router
from app.api.world_runtime import router as world_runtime_router
from app.api.auth import router as auth_router
from app.api.content import router as content_router
from app.api.stories import router as stories_router
from app.api.communities import router as communities_router
from app.api.feed import router as feed_router
from app.api.discovery import router as discovery_router
from app.api.ask_content import router as ask_content_router
from app.api.content_evolution import router as content_evolution_router
from app.api.agent_intelligence import router as agent_intelligence_router
from app.api.admin_agent_authority import router as admin_agent_authority_router
from app.api.admin_content_moderation import router as admin_content_moderation_router
from app.api.admin_control_plane import router as admin_control_plane_router
from app.api.admin_domain_evidence import router as admin_domain_evidence_router
from app.api.health import router as health_router
from app.api.runtime_activation import router as runtime_activation_router
from app.api.identity import router as identity_router
from app.api.memory_knowledge import router as memory_knowledge_router
from app.api.messaging import router as messaging_router
from app.api.agent_collaboration import router as agent_collaboration_router
from app.api.marketplace import router as marketplace_router
from app.api.economy import router as economy_router
from app.api.payouts import router as payouts_router
from app.api.security import router as security_router
from app.api.personalization import router as personalization_router
from app.api.social import router as social_router
from app.api.avatar import router as avatar_router
from app.api.live_assets import router as live_assets_router
from app.api.theme_generation import router as theme_generation_router


def _cors_origins() -> list[str]:
    raw = os.getenv("ALLPHA_CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
    origins = [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
    return origins or ["http://localhost:3000"]


app = FastAPI(title="Allpha Universe API", version="0.1.0", docs_url="/docs", redoc_url="/redoc")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Request-ID", "X-CSRF-Token", "X-Allpha-Owner-Studio-Key"],
)
app.add_middleware(SecurityHeadersMiddleware)

for _router in [
    health_router,
    runtime_activation_router,
    auth_router,
    content_router,
    stories_router,
    communities_router,
    feed_router,
    discovery_router,
    ask_content_router,
    content_evolution_router,
    agent_intelligence_router,
    admin_agent_authority_router,
    admin_content_moderation_router,
    admin_control_plane_router,
    admin_domain_evidence_router,
    identity_router,
    memory_knowledge_router,
    messaging_router,
    agent_collaboration_router,
    marketplace_router,
    economy_router,
    payouts_router,
    security_router,
    personalization_router,
    social_router,
    avatar_router,
    live_assets_router,
    agents_router,
    agent_catalog_router,
    agent_skills_router,
    ai_gateway_router,
    agent_runtime_router,
    workflows_router,
    universe_router,
    spatial_runtime_router,
    districts_router,
    booths_router,
    themes_router,
    three_d_generation_router,
    theme_generation_router,
    live_router,
    world_builder_router,
    world_runtime_router,
]:
    app.include_router(_router)

async def _start_owner_theme_batch_once() -> None:
    """One-shot owner-operated Tripo kickoff; idempotency is enforced by the canonical package table."""
    if os.getenv("ALLPHA_THEME_STUDIO_AUTO_GENERATE", "").strip().lower() != "enabled":
        return
    from app.api.theme_generation import PackageAssetInput, PackageCreate, create_owner_package
    token = os.getenv("ALLPHA_THEME_STUDIO_OWNER_TOKEN", "").strip()
    direction = "Allpha Universe premium 3D visual language: cinematic high-end PBR, physically plausible geometry, clean silhouette, detailed materials, restrained cosmic cyan-violet emissive accents, realistic scale and lighting. Create a complete usable 3D asset, not a primitive placeholder; no text, logos, watermarks, or flat illustration."
    specs = [
      ("universe_core","Universe Core","A monumental crystalline universe core with layered orbital rings, volumetric depth, premium glass-metal materials and luminous energy channels."),
      ("galaxy_navigator","Galaxy Navigator","A sculptural spiral galaxy navigator with distinct arms, dense star clusters, elegant orbital paths and cinematic depth."),
      ("world_planet","World Planet","A detailed habitable world with atmospheric rim, landforms, clouds, surface relief and a premium readable silhouette."),
      ("district_city","District City","A cohesive futuristic city district with varied buildings, walkable streets, plazas, transit connections and realistic architectural detail."),
      ("booth_tenant","Booth Tenant","A premium modular tenant booth with architectural framing, display surfaces, layered materials and interactive-ready open frontage."),
      ("content_capsule","Content Capsule","A distinctive floating content capsule with layered transparent shell, internal display volume, bevels and physically based materials."),
      ("portal_gate","Portal Gate","A monumental traversable portal with concentric frames, detailed structural supports and restrained emissive accents."),
      ("navigation_orbit","Navigation Orbit","A high quality 3D navigation-orbit assembly with multiple distinct orbit bands, nodes, connectors and balanced composition."),
      ("spatial_fx","Spatial FX","A reusable spatial-effects sculpture with layered energy ribbons, particles represented as geometry and controlled luminous materials."),
      ("live_stage","Live Experience Stage","A production-ready live talk-show stage with central platform, lighting rigs, display walls, seating and acoustic design cues."),
      ("podcast_stage","Podcast Studio","A premium podcast set with desk, microphones, headphones, acoustic panels, practical lights and camera-friendly composition."),
      ("presentation_stage","Presentation Stage","A modern presentation and pitching stage with a large display, podium, layered platform and realistic event lighting."),
      ("classroom_stage","Classroom Stage","A contemporary learning room with presentation screen, instructor zone, desks, chairs and clear circulation."),
      ("mentor_room","Mentor Room","A warm premium mentoring room with paired seating, small table, practical lighting and realistic soft furnishings."),
      ("news_stage","News Studio","A broadcast news set with curved desk, wall displays, camera zones and refined studio lighting."),
      ("human_uniform_formal","Human Uniform Formal","A full-body formal human outfit asset on a neutral mannequin, tailored jacket, trousers, shoes and detailed fabric materials."),
      ("human_uniform_nusantara","Human Uniform Nusantara","A full-body contemporary Nusantara-inspired formal uniform on a neutral mannequin, refined woven textile detail and respectful original design."),
      ("human_uniform_hero","Human Uniform Hero","An original futuristic hero-style full-body uniform on a neutral mannequin, layered protective materials and no copyrighted symbols."),
      ("ai_character_companion","AI Character Companion","An original friendly premium AI companion character with expressive face, articulated limbs, coherent anatomy and production-ready materials."),
      ("ai_character_guide","AI Character Guide","An original futuristic AI guide character with distinct silhouette, expressive face, articulated body and detailed clothing."),
      ("ai_character_mentor","AI Character Mentor","An original approachable mentor character, realistic stylized proportions, thoughtful expression, articulated body and high-quality materials."),
      ("ai_sticker_social","AI Sticker Social","A dimensional social reaction sticker asset with bold readable silhouette, clean bevels, polished materials and no text."),
      ("ai_cosmetics","AI Cosmetics","A premium set-like 3D cosmetic accessory asset with refined metallic, glass and soft-touch material detail."),
      ("marketplace_portal","Marketplace Portal","A premium marketplace entrance with product plinths, modular display alcoves, navigation framing and realistic architectural detail."),
      ("community_hub","Community Hub","A welcoming 3D community gathering hub with circular seating, shared focal point, layered planting and ambient architectural lighting."),
    ]
    payload = PackageCreate(theme_name="Allpha Universe — Reference Batch 01", theme_direction=direction, assets=[PackageAssetInput(key=k,label=label,prompt=prompt + " " + direction) for k,label,prompt in specs], idempotency_key="allpha-owner-auto-reference-batch-01-v1", face_limit=50000)
    try:
        result = await create_owner_package(payload, token)
        package = result.get("data", {}).get("package", result.get("package", {}))
        package_id = package.get("id")
        print("ALLPHA_OWNER_THEME_AUTO_BATCH", {"package_id": package_id, "status": package.get("status"), "asset_count": len(specs)})
        if package_id:
            from app.core.supabase_rest import service_select
            from app.api.theme_generation import _refresh_package
            for _ in range(720):
                await asyncio.sleep(30)
                rows = await service_select("theme_generation_packages", {"select":"*", "id":"eq." + str(package_id), "limit":"1"})
                if not rows:
                    break
                refreshed = await _refresh_package(rows[0])
                current = refreshed.get("package", {})
                if current.get("status") in {"succeeded", "partial", "failed", "cancelled"}:
                    print("ALLPHA_OWNER_THEME_AUTO_BATCH_TERMINAL", {"package_id": package_id, "status": current.get("status")})
                    break
    except Exception as exc:
        print("ALLPHA_OWNER_THEME_AUTO_BATCH_FAILED", type(exc).__name__, str(exc)[:300])

@app.on_event("startup")
async def schedule_owner_theme_batch() -> None:
    if os.getenv("ALLPHA_THEME_STUDIO_AUTO_GENERATE", "").strip().lower() == "enabled":
        asyncio.create_task(_start_owner_theme_batch_once())
