"""Deterministic Agent Context assembly.

This module deliberately does not create a second memory/RAG/runtime engine.
It composes authoritative state already owned by the existing domains:
Spatial Runtime, Memory, Knowledge/RAG, Collaboration, Live and Agent Runtime.
"""
from typing import Any
from uuid import UUID

from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import select


async def build_agent_context(
    user: AuthenticatedUser,
    agent_id: UUID,
    *,
    world_id: UUID | None = None,
    district_id: UUID | None = None,
    memory_limit: int = 8,
    knowledge_limit: int = 8,
) -> dict[str, Any]:
    """Build a bounded context envelope; authorization remains in Supabase RLS."""
    memory_limit = max(1, min(memory_limit, 20))
    knowledge_limit = max(1, min(knowledge_limit, 20))

    agent = await select(user, "agents", {
        "select": "id,status,visibility,created_at,updated_at",
        "id": f"eq.{agent_id}",
        "limit": "1",
    })
    if not agent:
        return {"agent": None, "spatial": [], "memory": [], "knowledge": [], "collaboration": [], "live": []}

    spatial_query = {
        "select": "id,world_id,agent_id,movement_state,position,rotation,zone_key,target_position,speed,metadata,updated_at",
        "agent_id": f"eq.{agent_id}",
        "limit": "1",
    }
    if world_id:
        spatial_query["world_id"] = f"eq.{world_id}"
    spatial = await select(user, "agent_spatial_states", spatial_query)

    memory = await select(user, "agent_memory", {
        "select": "id,memory_type,content,metadata,status,sensitivity,source_type,source_id,expires_at,created_at,updated_at,last_accessed_at,reviewed_at",
        "agent_id": f"eq.{agent_id}",
        "deleted_at": "is.null",
        "order": "updated_at.desc",
        "limit": str(memory_limit),
    })

    knowledge = await select(user, "knowledge_items", {
        "select": "id,title,content,source_uri,provenance,visibility,status,created_at,updated_at,retention_expires_at",
        "agent_id": f"eq.{agent_id}",
        "deleted_at": "is.null",
        "order": "updated_at.desc",
        "limit": str(knowledge_limit),
    })

    collaboration = await select(user, "agent_collaboration_agreements", {
        "select": "id,requester_agent_id,target_agent_id,state,purpose,agreed_scope,constraints,terms,expires_at,updated_at",
        "or": f"(requester_agent_id.eq.{agent_id},target_agent_id.eq.{agent_id})",
        "state": "eq.approved",
        "order": "updated_at.desc",
        "limit": "10",
    })

    live = await select(user, "live_agent_collaborations", {
        "select": "id,live_session_id,agent_id,status,consent_at,verified_at,created_at,updated_at",
        "agent_id": f"eq.{agent_id}",
        "order": "updated_at.desc",
        "limit": "10",
    })

    return {
        "agent": agent[0],
        "spatial": spatial,
        "memory": memory,
        "knowledge": knowledge,
        "collaboration": collaboration,
        "live": live,
        "context_policy": {
            "deterministic_first": True,
            "vector_retrieval": "existing_retrieve_agent_memory_and_retrieve_agent_knowledge",
            "llm": "only_after_authorization_filtering_and_context_budgeting",
            "authority": "presentation_and_retrieval_never_grant_authority",
        },
        "world": {"world_id": str(world_id) if world_id else None, "district_id": str(district_id) if district_id else None},
    }
