from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.agents import router as agents_router
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
from app.api.health import router as health_router
from app.api.identity import router as identity_router
from app.api.memory_knowledge import router as memory_knowledge_router
from app.api.messaging import router as messaging_router
from app.api.agent_collaboration import router as agent_collaboration_router
from app.api.personalization import router as personalization_router
from app.api.social import router as social_router
from app.api.router import router as domain_router

app = FastAPI(
    title="Allpha Universe API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(content_router)
app.include_router(communities_router)
app.include_router(feed_router)
app.include_router(identity_router)
app.include_router(memory_knowledge_router)
app.include_router(messaging_router)
app.include_router(agent_collaboration_router)
app.include_router(personalization_router)
app.include_router(social_router)
app.include_router(domain_router)
app.include_router(agents_router)
app.include_router(ai_gateway_router)
app.include_router(agent_runtime_router)
app.include_router(workflows_router)
app.include_router(universe_router)
app.include_router(spatial_runtime_router)
app.include_router(districts_router)
app.include_router(booths_router)
app.include_router(themes_router)
app.include_router(live_router)
app.include_router(world_builder_router)
app.include_router(world_runtime_router)
