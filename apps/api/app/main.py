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
from app.api.live import router as live_router
from app.api.world_builder import router as world_builder_router
from app.api.world_runtime import router as world_runtime_router
from app.api.auth import router as auth_router
from app.api.content import router as content_router
from app.api.communities import router as communities_router
from app.api.feed import router as feed_router
from app.api.discovery import router as discovery_router
from app.api.ask_content import router as ask_content_router
from app.api.content_evolution import router as content_evolution_router
from app.api.agent_intelligence import router as agent_intelligence_router
from app.api.admin_agent_authority import router as admin_agent_authority_router
from app.api.admin_content_moderation import router as admin_content_moderation_router
from app.api.admin_control_plane import router as admin_control_plane_router
from app.api.health import router as health_router
from app.api.runtime_activation import router as runtime_activation_router
from app.api.identity import router as identity_router
from app.api.memory_knowledge import router as memory_knowledge_router
from app.api.messaging import router as messaging_router
from app.api.agent_collaboration import router as agent_collaboration_router
from app.api.marketplace import router as marketplace_router
from app.api.economy import router as economy_router
from app.api.payouts import router as payouts_router
from app.api.admin_control_plane import router as admin_control_plane_router
from app.api.security import router as security_router
from app.api.personalization import router as personalization_router
from app.api.social import router as social_router
from app.api.avatar import router as avatar_router
from app.api.live_assets import router as live_assets_router
from app.api.router import router as domain_router

app = FastAPI(title="Allpha Universe API",version="0.1.0",docs_url="/docs",redoc_url="/redoc")
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:3000","http://localhost:3001"],allow_credentials=True,allow_methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"],allow_headers=["Authorization","Content-Type","Accept","Origin","X-Request-ID","X-CSRF-Token"])
app.add_middleware(SecurityHeadersMiddleware)

for _router in [health_router,runtime_activation_router,auth_router,content_router,communities_router,feed_router,discovery_router,ask_content_router,content_evolution_router,agent_intelligence_router,admin_agent_authority_router,admin_content_moderation_router,admin_control_plane_router,identity_router,memory_knowledge_router,messaging_router,agent_collaboration_router,marketplace_router,economy_router,payouts_router,security_router,personalization_router,social_router,avatar_router,live_assets_router,domain_router,agents_router,agent_catalog_router,agent_skills_router,ai_gateway_router,agent_runtime_router,workflows_router,universe_router,spatial_runtime_router,districts_router,booths_router,themes_router,live_router,world_builder_router,world_runtime_router]:
    app.include_router(_router)
