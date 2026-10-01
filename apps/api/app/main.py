from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.agents import router as agents_router
from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.identity import router as identity_router
from app.api.memory_knowledge import router as memory_knowledge_router
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
app.include_router(identity_router)
app.include_router(memory_knowledge_router)
app.include_router(domain_router)
app.include_router(agents_router)
