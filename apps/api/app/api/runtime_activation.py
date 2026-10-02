from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, Depends

from app.api.dependencies import get_auth_context
from app.core.supabase_rest import select

router = APIRouter(prefix="/api/v1/runtime", tags=["Runtime Activation"])


async def _count(user: Any, table: str, filters: dict[str, str] | None = None) -> int:
    rows = await select(user, table, {"select": "id", "limit": "1", **(filters or {})})
    # Supabase REST does not guarantee a count unless requested explicitly; the activation
    # endpoint only needs presence/absence for the user-scoped checks.
    return len(rows)


@router.get("/activation")
async def activation_status(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]

    providers = await select(user, "ai_providers", {
        "select": "id,provider_key,enabled,credential_env_var",
        "enabled": "eq.true",
    })
    models = await select(user, "ai_models", {
        "select": "id,provider_id,model_key,model_identifier,enabled,ai_providers(enabled,provider_key,credential_env_var)",
        "enabled": "eq.true",
    })

    provider_runtime = [
        {
            "provider_key": str(provider.get("provider_key")),
            "enabled": bool(provider.get("enabled")),
            "credential_bound": bool(
                provider.get("credential_env_var")
                and os.getenv(str(provider["credential_env_var"]), "").strip()
            ),
        }
        for provider in providers
    ]
    gateway_ready = bool(models) and any(item["credential_bound"] for item in provider_runtime)

    agents = await select(user, "agents", {
        "select": "id,status,runtime_state",
        "owner_user_id": f"eq.{user.user_id}",
        "status": "neq.archived",
        "limit": "100",
    })
    published_content = await select(user, "content_items", {
        "select": "id,status,visibility",
        "status": "eq.published",
        "visibility": "eq.public",
        "limit": "100",
    })
    feed_interactions = await select(user, "feed_interaction_events", {
        "select": "id",
        "user_id": f"eq.{user.user_id}",
        "limit": "1",
    })
    commands = await select(user, "agent_commands", {
        "select": "id,status",
        "agent_id": "in.(" + ",".join(str(agent["id"]) for agent in agents) + ")" if agents else "in.(00000000-0000-0000-0000-000000000000)",
        "limit": "1",
    })

    memory = await select(user, "agent_memory", {
        "select": "id",
        "limit": "1",
    })
    knowledge = await select(user, "knowledge_items", {
        "select": "id",
        "limit": "1",
    })

    checks = {
        "authenticated_user": True,
        "agent_catalog": {
            "ready": True,
            "skills": 111,
            "types": 71,
            "characters": 34,
        },
        "owned_agent": {
            "ready": bool(agents),
            "count": len(agents),
        },
        "published_content": {
            "ready": bool(published_content),
            "count": len(published_content),
        },
        "ai_gateway": {
            "ready": gateway_ready,
            "enabled_models": len(models),
            "providers": provider_runtime,
        },
        "agent_runtime": {
            "ready": bool(agents and gateway_ready),
            "command_observed": bool(commands),
        },
        "feed_telemetry": {
            "ready": bool(feed_interactions),
        },
        "rag": {
            "optional_ready": bool(memory or knowledge),
            "memory_available": bool(memory),
            "knowledge_available": bool(knowledge),
            "embedding_generation": False,
        },
    }

    blockers: list[dict[str, str]] = []
    if not agents:
        blockers.append({"code": "REAL_AGENT_REQUIRED", "message": "Create at least one real owned Agent through Agent Factory."})
    if not models:
        blockers.append({"code": "AI_MODEL_NOT_CONFIGURED", "message": "No enabled AI model is configured."})
    if models and not gateway_ready:
        blockers.append({"code": "AI_SERVER_CREDENTIAL_NOT_BOUND", "message": "The enabled provider exists, but its server-side credential is not bound to FastAPI."})
    if not published_content:
        blockers.append({"code": "PUBLISHED_CONTENT_REQUIRED", "message": "Create and publish real Content before Discovery E2E can be verified."})
    if not feed_interactions:
        blockers.append({"code": "DISCOVERY_TELEMETRY_PENDING", "message": "Feed/Discovery telemetry has not yet been observed for this user."})
    if not commands:
        blockers.append({"code": "AGENT_COMMAND_E2E_PENDING", "message": "A real Agent Runtime command has not yet been observed."})

    return {
        "data": {
            "status": "ready" if not blockers else "blocked",
            "checks": checks,
            "blockers": blockers,
            "notes": [
                "No secrets are returned by this endpoint.",
                "RAG embedding generation remains unconfigured; no embeddings are fabricated.",
                "Agent authority remains Agent Runtime → Policy/Risk/Approval → execution.",
            ],
        }
    }
