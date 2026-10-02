"""Bounded Agent Context retrieval adapter.

Reuses the canonical Memory/Knowledge retrieval RPCs and existing learning
tables. This module is retrieval/context assembly only; it never grants
authority and never creates a second RAG, learning, or runtime engine.
"""
from __future__ import annotations

import re
from typing import Any
from uuid import UUID

from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import rpc, select


def _tokens(query: str) -> list[str]:
    return [t for t in re.findall(r"[\w-]{3,}", query.lower())[:12] if t]


def _vector_literal(values: list[float]) -> str:
    if not values or len(values) > 4096:
        raise ValueError("Invalid embedding.")
    if any(not isinstance(v, (int, float)) for v in values):
        raise ValueError("Invalid embedding.")
    return "[" + ",".join(f"{float(v):.10g}" for v in values) + "]"


async def retrieve_agent_context(
    user: AuthenticatedUser,
    agent_id: UUID,
    *,
    query: str | None = None,
    query_embedding: list[float] | None = None,
    limit: int = 8,
) -> dict[str, Any]:
    limit = max(1, min(limit, 20))
    clean_query = (query or "").strip()[:500]
    vector = _vector_literal(query_embedding) if query_embedding else None

    memory_vector: list[dict[str, Any]] = []
    knowledge_vector: list[dict[str, Any]] = []
    if vector:
        memory_vector = await rpc(user, "retrieve_agent_memory", {
            "p_agent_id": str(agent_id), "p_query_embedding": vector, "p_limit": limit,
        })
        knowledge_vector = await rpc(user, "retrieve_agent_knowledge", {
            "p_agent_id": str(agent_id), "p_query_embedding": vector, "p_limit": limit,
        })
        memory_vector = memory_vector if isinstance(memory_vector, list) else []
        knowledge_vector = knowledge_vector if isinstance(knowledge_vector, list) else []

    memory_lexical: list[dict[str, Any]] = []
    knowledge_lexical: list[dict[str, Any]] = []
    if clean_query:
        tokens = _tokens(clean_query)
        if tokens:
            pattern = "%" + "%".join(tokens[:5]) + "%"
            memory_lexical = await select(user, "agent_memory", {
                "select": "id,memory_type,content,metadata,updated_at",
                "agent_id": f"eq.{agent_id}",
                "status": "eq.active",
                "deleted_at": "is.null",
                "content": f"ilike.{pattern}",
                "order": "updated_at.desc",
                "limit": str(limit),
            })
            knowledge_lexical = await select(user, "knowledge_items", {
                "select": "id,title,content,source_uri,provenance,updated_at",
                "agent_id": f"eq.{agent_id}",
                "status": "eq.active",
                "deleted_at": "is.null",
                "content": f"ilike.{pattern}",
                "order": "updated_at.desc",
                "limit": str(limit),
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

    return {
        "query": clean_query or None,
        "retrieval": {
            "memory_vector": memory_vector,
            "knowledge_vector": knowledge_vector,
            "memory_lexical": memory_lexical,
            "knowledge_lexical": knowledge_lexical,
            "hybrid": bool(vector or clean_query),
            "rerank": "deterministic provenance + similarity + recency is applied by the consumer; no LLM rerank",
            "deduplication": "memory_id / knowledge_item_id",
        },
        "learning": {
            "interest_affinities": affinities,
            "passion_clusters": passions,
            "habit_patterns": habits,
            "spatial_presence_is_not_learning_authority": True,
        },
        "context_budget": {
            "max_items_per_source": limit,
            "llm_called": False,
            "next_stage": "authorized_context_only_then_existing_ai_gateway",
        },
    }
