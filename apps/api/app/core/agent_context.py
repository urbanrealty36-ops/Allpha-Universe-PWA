"""Deterministic Agent Context assembly.

This module composes authoritative state already owned by existing domains:
Spatial Runtime, District/Zone/Booth, Memory, Knowledge/RAG, Collaboration,
Live and Agent Runtime. It never grants authority.
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
    memory_limit = max(1, min(memory_limit, 20))
    knowledge_limit = max(1, min(knowledge_limit, 20))

    agent = await select(user, "agents", {
        "select": "id,status,visibility,created_at,updated_at",
        "id": f"eq.{agent_id}",
        "limit": "1",
    })
    if not agent:
        return {"agent": None, "spatial": [], "district": None, "zone": None, "booths": [], "memory": [], "knowledge": [], "learning": {}, "collaboration": [], "live": []}

    spatial_query = {
        "select": "id,world_id,agent_id,movement_state,position,rotation,zone_key,target_position,speed,metadata,updated_at",
        "agent_id": f"eq.{agent_id}",
        "limit": "1",
    }
    if world_id:
        spatial_query["world_id"] = f"eq.{world_id}"
    spatial = await select(user, "agent_spatial_states", spatial_query)

    district = None
    zone = None
    booths: list[dict[str, Any]] = []
    if spatial:
        zone_key = spatial[0].get("zone_key")
        if zone_key:
            zones = await select(user, "district_zones", {
                "select": "id,district_id,zone_key,name,zone_type,status,spatial_config,metadata",
                "zone_key": f"eq.{zone_key}",
                "limit": "1",
            })
            if zones:
                zone = zones[0]
                district_rows = await select(user, "districts", {
                    "select": "id,world_id,owner_type,owner_id,name,slug,district_type,visibility,status,theme_key,spatial_config,metadata",
                    "id": f"eq.{zone['district_id']}",
                    "limit": "1",
                })
                district = district_rows[0] if district_rows else None
                booths = await select(user, "booths", {
                    "select": "id,district_id,district_zone_id,agent_id,booth_type,tier,name,slug,description,theme_id,status,moderation_status,display_config,scene_config",
                    "district_zone_id": f"eq.{zone['id']}",
                    "status": "eq.active",
                    "order": "updated_at.desc",
                    "limit": "20",
                })

    memory = await select(user, "agent_memory", {
        "select": "id,memory_type,content,metadata,status,sensitivity,source_type,source_id,expires_at,created_at,updated_at,last_accessed_at,reviewed_at",
        "agent_id": f"eq.{agent_id}",
        "deleted_at": "is.null",
        "status": "eq.active",
        "order": "updated_at.desc",
        "limit": str(memory_limit),
    })
    knowledge = await select(user, "knowledge_items", {
        "select": "id,title,content,source_uri,provenance,visibility,status,created_at,updated_at,retention_expires_at",
        "agent_id": f"eq.{agent_id}",
        "deleted_at": "is.null",
        "status": "eq.active",
        "order": "updated_at.desc",
        "limit": str(knowledge_limit),
    })

    affinities = await select(user, "subject_interest_affinities", {
        "select": "interest_id,score,confidence,evidence_count,positive_evidence,negative_evidence,updated_at",
        "agent_id": f"eq.{agent_id}",
        "order": "score.desc",
        "limit": "10",
    })
    passions = await select(user, "passion_clusters", {
        "select": "id,name,confidence,evidence_count,status,metadata,updated_at,source_interest_id",
        "agent_id": f"eq.{agent_id}",
        "order": "confidence.desc",
        "limit": "10",
    })
    habits = await select(user, "habit_patterns", {
        "select": "id,pattern_type,pattern_key,pattern,confidence,evidence_count,status,last_observed_at,updated_at",
        "agent_id": f"eq.{agent_id}",
        "order": "confidence.desc",
        "limit": "10",
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
        "district": district,
        "zone": zone,
        "booths": booths,
        "memory": memory,
        "knowledge": knowledge,
        "learning": {
            "interest_affinities": affinities,
            "passion_clusters": passions,
            "habit_patterns": habits,
            "spatial_presence_is_not_learning_authority": True,
        },
        "collaboration": collaboration,
        "live": live,
        "context_policy": {
            "deterministic_first": True,
            "vector_retrieval": "existing_retrieve_agent_memory_and_retrieve_agent_knowledge_via_POST_retrieve",
            "llm": "only_after_authorization_filtering_and_context_budgeting",
            "authority": "presentation_retrieval_learning_and_spatial_context_never_grant_authority",
        },
        "world": {"world_id": str(world_id) if world_id else None, "district_id": str(district_id) if district_id else None},
    }
