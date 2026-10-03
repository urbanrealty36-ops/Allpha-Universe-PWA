"""Bounded Agent Context retrieval adapter.

Reuses the canonical Memory/Knowledge retrieval RPCs, canonical AI Gateway
embeddings, and existing personalization tables. Retrieval is informational
only and never grants authority.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from app.core.ai_gateway import AIGatewayError, embed_text
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


def _recency_value(value: Any) -> float:
    if not value:
        return 0.0
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        age_days = max(0.0, (datetime.now(timezone.utc) - dt).total_seconds() / 86400)
        return 1.0 / (1.0 + age_days)
    except (TypeError, ValueError):
        return 0.0


def _hybrid_results(vector_rows: list[dict[str, Any]], lexical_rows: list[dict[str, Any]], *, key: str, limit: int) -> list[dict[str, Any]]:
    by_id: dict[str, dict[str, Any]] = {}
    for row in sorted(vector_rows, key=lambda x: float(x.get("similarity") or 0), reverse=True):
        rid = str(row.get(key) or "")
        if not rid:
            continue
        by_id[rid] = {**row, "retrieval_source": "vector"}
    for row in sorted(lexical_rows, key=lambda x: _recency_value(x.get("updated_at")), reverse=True):
        rid = str(row.get("id") or row.get(key) or "")
        if not rid:
            continue
        if rid in by_id:
            by_id[rid]["retrieval_sources"] = ["vector", "lexical"]
        else:
            by_id[rid] = {**row, "retrieval_source": "lexical", "similarity": None}
    results = list(by_id.values())
    for index, row in enumerate(results[:limit], start=1):
        row["hybrid_rank"] = index
        row["provenance"] = {
            "source": row.get("retrieval_source"),
            "similarity": row.get("similarity"),
            "updated_at": row.get("updated_at"),
            "deterministic_order": "vector_similarity_then_lexical_recency",
        }
    return results[:limit]


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
    embedding_status = "supplied" if vector else "not_requested"

    if clean_query and not vector:
        try:
            embedded = await embed_text(
                user,
                clean_query,
                agent_id=str(agent_id),
                dimensions=1536,
                metadata={"purpose": "agent_context_query"},
            )
            vector = _vector_literal(embedded.embedding)
            embedding_status = "generated"
        except AIGatewayError as exc:
            embedding_status = "not_configured" if exc.code in {"AI_NO_EMBEDDING_MODEL", "AI_PROVIDER_CREDENTIAL_NOT_CONFIGURED"} else f"failed:{exc.code}"

    memory_vector: list[dict[str, Any]] = []
    knowledge_vector: list[dict[str, Any]] = []
    if vector:
        memory_vector = await rpc(user, "retrieve_agent_memory", {"p_agent_id": str(agent_id), "p_query_embedding": vector, "p_limit": limit})
        knowledge_vector = await rpc(user, "retrieve_agent_knowledge", {"p_agent_id": str(agent_id), "p_query_embedding": vector, "p_limit": limit})
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
                "agent_id": f"eq.{agent_id}", "status": "eq.active", "deleted_at": "is.null",
                "content": f"ilike.{pattern}", "order": "updated_at.desc", "limit": str(limit),
            })
            knowledge_lexical = await select(user, "knowledge_items", {
                "select": "id,title,content,source_uri,provenance,updated_at",
                "agent_id": f"eq.{agent_id}", "status": "eq.active", "deleted_at": "is.null",
                "content": f"ilike.{pattern}", "order": "updated_at.desc", "limit": str(limit),
            })

    affinities = await select(user, "subject_interest_affinities", {"select": "interest_id,score,confidence,evidence_count,positive_evidence,negative_evidence,updated_at", "agent_id": f"eq.{agent_id}", "order": "score.desc", "limit": "10"})
    passions = await select(user, "passion_clusters", {"select": "id,name,confidence,evidence_count,status,metadata,updated_at,source_interest_id", "agent_id": f"eq.{agent_id}", "order": "confidence.desc", "limit": "10"})
    habits = await select(user, "habit_patterns", {"select": "id,pattern_type,pattern_key,pattern,confidence,evidence_count,status,last_observed_at,updated_at", "agent_id": f"eq.{agent_id}", "order": "confidence.desc", "limit": "10"})

    memory_hybrid = _hybrid_results(memory_vector, memory_lexical, key="memory_id", limit=limit)
    knowledge_hybrid = _hybrid_results(knowledge_vector, knowledge_lexical, key="knowledge_item_id", limit=limit)

    return {
        "query": clean_query or None,
        "embedding": {"status": embedding_status, "dimensions": 1536 if vector else None, "model": "text-embedding-3-small" if embedding_status in {"generated","supplied"} else None},
        "retrieval": {
            "memory_vector": memory_vector, "knowledge_vector": knowledge_vector,
            "memory_lexical": memory_lexical, "knowledge_lexical": knowledge_lexical,
            "memory_hybrid": memory_hybrid, "knowledge_hybrid": knowledge_hybrid,
            "hybrid": bool(vector or clean_query),
            "rerank": "deterministic: vector similarity first, then lexical recency, with source deduplication",
            "deduplication": "memory_id / knowledge_item_id",
        },
        "learning": {
            "interest_affinities": affinities,
            "passion_clusters": passions,
            "habit_patterns": habits,
            "spatial_presence_is_not_learning_authority": True,
        },
        "authorized_context": {
            "memory": memory_hybrid[:limit],
            "knowledge": knowledge_hybrid[:limit],
            "personalization": {"interest_affinities": affinities, "passion_clusters": passions, "habit_patterns": habits},
            "authority": "retrieval and personalization are informational and never grant authority",
            "bounded": True,
            "max_items_per_source": limit,
        },
        "context_budget": {"max_items_per_source": limit, "llm_called": False, "next_stage": "existing_ai_gateway_only"},
    }
