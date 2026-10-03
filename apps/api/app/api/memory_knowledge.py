from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.ai_gateway import AIGatewayError, embed_text\nfrom app.core.supabase_rest import insert, rpc, select, update


router = APIRouter(prefix="/api/v1/agents", tags=["Agent Memory & Knowledge"])


class MemoryCreateRequest(BaseModel):
    memory_type: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)
    sensitivity: str | None = None
    source_type: str | None = None
    source_id: UUID | None = None
    expires_at: str | None = None
    consent_basis: str | None = None


class EmbeddingUpsertRequest(BaseModel):
    embedding: str = Field(min_length=3)
    model: str | None = None
    dimensions: int | None = Field(default=None, gt=0)


class KnowledgeCreateRequest(BaseModel):
    title: str | None = None
    content: str = Field(min_length=1)
    source_uri: str | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)
    visibility: str = "private"
    retention_policy: dict[str, Any] = Field(default_factory=dict)
    retention_expires_at: str | None = None


class KnowledgeChunkCreateRequest(BaseModel):
    chunk_index: int = Field(ge=0)
    content: str = Field(min_length=1)
    token_count: int | None = Field(default=None, ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)
    source_locator: dict[str, Any] = Field(default_factory=dict)
    embedding: str | None = None


class RetrievalRequest(BaseModel):
    embedding: str = Field(min_length=3)
    limit: int = Field(default=10, ge=1, le=50)


async def _owned_agent(user: AuthenticatedUser, agent_id: UUID) -> None:
    rows = await select(user, "agents", {
        "select": "id",
        "id": f"eq.{agent_id}",
        "limit": "1",
    })
    if not rows:
        raise HTTPException(status_code=404, detail={
            "code": "AGENT_NOT_FOUND",
            "message": "Agent was not found or is not owned by the authenticated user.",
        })


@router.get("/{agent_id}/memory")
async def list_memory(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    await _owned_agent(user, agent_id)
    return {"data": await select(user, "agent_memory", {
        "select": "id,memory_type,content,metadata,status,sensitivity,source_type,source_id,expires_at,deleted_at,reviewed_at,last_accessed_at,created_at,updated_at",
        "agent_id": f"eq.{agent_id}",
        "status": "neq.deleted",
        "order": "created_at.desc",
    })}


@router.post("/{agent_id}/memory", status_code=201)
async def create_memory(agent_id: UUID, payload: MemoryCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    result = await rpc(user, "create_agent_memory", {
        "p_agent_id": str(agent_id),
        "p_memory_type": payload.memory_type,
        "p_content": payload.content,
        "p_metadata": payload.metadata,
        "p_sensitivity": payload.sensitivity,
        "p_source_type": payload.source_type,
        "p_source_id": str(payload.source_id) if payload.source_id else None,
        "p_expires_at": payload.expires_at,
        "p_consent_basis": payload.consent_basis,
    })
    return result


@router.post("/{agent_id}/memory/{memory_id}/embedding/generate")
async def generate_memory_embedding(agent_id: UUID, memory_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    memory = await select(user, "agent_memory", {"select": "id,content", "id": f"eq.{memory_id}", "agent_id": f"eq.{agent_id}", "owner_user_id": f"eq.{user.user_id}", "limit": "1"})
    if not memory:
        raise HTTPException(status_code=404, detail={"code": "MEMORY_NOT_FOUND", "message": "Memory was not found."})
    try:
        result = await embed_text(user, memory[0]["content"], agent_id=str(agent_id), dimensions=1536, metadata={"purpose":"agent_memory_embedding","memory_id":str(memory_id)})
    except AIGatewayError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc
    rows = await update(user, "agent_memory_embeddings", {"memory_id": f"eq.{memory_id}"}, {"embedding": result.embedding, "model": result.model_identifier, "dimensions": len(result.embedding)})
    if not rows:
        rows = await insert(user, "agent_memory_embeddings", {"memory_id": str(memory_id), "embedding": result.embedding, "model": result.model_identifier, "dimensions": len(result.embedding)})
    return {"data": rows[0] if rows else {"memory_id": str(memory_id)}, "embedding": {"model": result.model_identifier, "dimensions": len(result.embedding), "request_id": result.request_id}}

@router.post("/{agent_id}/memory/{memory_id}/embedding")
async def upsert_memory_embedding(
    agent_id: UUID,
    memory_id: UUID,
    payload: EmbeddingUpsertRequest,
    context: dict = Depends(get_auth_context),
) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    memory = await select(user, "agent_memory", {
        "select": "id",
        "id": f"eq.{memory_id}",
        "agent_id": f"eq.{agent_id}",
        "owner_user_id": f"eq.{user.user_id}",
        "limit": "1",
    })
    if not memory:
        raise HTTPException(status_code=404, detail={"code": "MEMORY_NOT_FOUND", "message": "Memory was not found."})
    rows = await update(user, "agent_memory_embeddings", {"memory_id": f"eq.{memory_id}"}, {
        "embedding": payload.embedding,
        "model": payload.model,
        "dimensions": payload.dimensions,
    })
    if not rows:
        rows = await insert(user, "agent_memory_embeddings", {
            "memory_id": str(memory_id),
            "embedding": payload.embedding,
            "model": payload.model,
            "dimensions": payload.dimensions,
        })
    return rows[0] if rows else {"memory_id": str(memory_id)}


@router.post("/{agent_id}/memory/retrieve")
async def retrieve_memory(agent_id: UUID, payload: RetrievalRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    embedding = payload.embedding
    if not embedding and payload.query:
        try:
            result = await embed_text(user, payload.query, agent_id=str(agent_id), dimensions=1536, metadata={"purpose":"agent_memory_query"})
            embedding = "[" + ",".join(f"{v:.10g}" for v in result.embedding) + "]"
        except AIGatewayError as exc:
            raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc
    if not embedding:
        raise HTTPException(status_code=422, detail={"code": "RETRIEVAL_QUERY_REQUIRED", "message": "query or embedding is required."})
    result = await rpc(user, "retrieve_agent_memory", {"p_agent_id": str(agent_id), "p_query_embedding": embedding, "p_limit": payload.limit})
    return {"data": result}


@router.post("/{agent_id}/memory/expire")
async def expire_memory(agent_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    return {"expired_count": await rpc(user, "expire_agent_memory", {})}


@router.post("/{agent_id}/memory/{memory_id}/review")
async def review_memory(agent_id: UUID, memory_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    return await rpc(user, "review_agent_memory", {"p_memory_id": str(memory_id)})


@router.delete("/{agent_id}/memory/{memory_id}")
async def delete_memory(agent_id: UUID, memory_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    return await rpc(user, "delete_agent_memory", {"p_memory_id": str(memory_id)})


@router.get("/{agent_id}/knowledge")
async def list_knowledge(agent_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    await _owned_agent(user, agent_id)
    return {"data": await select(user, "knowledge_items", {
        "select": "id,title,content,source_uri,provenance,visibility,status,retention_policy,deleted_at,created_at,updated_at",
        "agent_id": f"eq.{agent_id}",
        "status": "neq.deleted",
        "order": "updated_at.desc",
    })}


@router.post("/{agent_id}/knowledge", status_code=201)
async def create_knowledge(agent_id: UUID, payload: KnowledgeCreateRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    return await rpc(user, "create_knowledge_item", {
        "p_agent_id": str(agent_id),
        "p_title": payload.title,
        "p_content": payload.content,
        "p_source_uri": payload.source_uri,
        "p_provenance": payload.provenance,
        "p_visibility": payload.visibility,
        "p_retention_policy": {**payload.retention_policy, **({"expires_at": payload.retention_expires_at} if payload.retention_expires_at else {})},
    })


@router.get("/{agent_id}/knowledge/{knowledge_id}/chunks")
async def list_knowledge_chunks(agent_id: UUID, knowledge_id: UUID, context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user = context["user"]
    await _owned_agent(user, agent_id)
    item = await select(user, "knowledge_items", {
        "select": "id",
        "id": f"eq.{knowledge_id}",
        "agent_id": f"eq.{agent_id}",
        "owner_user_id": f"eq.{user.user_id}",
        "limit": "1",
    })
    if not item:
        raise HTTPException(status_code=404, detail={"code": "KNOWLEDGE_NOT_FOUND", "message": "Knowledge item was not found."})
    return {"data": await select(user, "knowledge_chunks", {
        "select": "id,chunk_index,content,token_count,metadata,source_locator,created_at",
        "knowledge_item_id": f"eq.{knowledge_id}",
        "order": "chunk_index.asc",
    })}


@router.post("/{agent_id}/knowledge/{knowledge_id}/chunks", status_code=201)
async def create_knowledge_chunk(
    agent_id: UUID,
    knowledge_id: UUID,
    payload: KnowledgeChunkCreateRequest,
    context: dict = Depends(get_auth_context),
) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    item = await select(user, "knowledge_items", {
        "select": "id",
        "id": f"eq.{knowledge_id}",
        "agent_id": f"eq.{agent_id}",
        "owner_user_id": f"eq.{user.user_id}",
        "limit": "1",
    })
    if not item:
        raise HTTPException(status_code=404, detail={"code": "KNOWLEDGE_NOT_FOUND", "message": "Knowledge item was not found."})
    values = payload.model_dump(exclude_none=True)
    values["knowledge_item_id"] = str(knowledge_id)
    return (await insert(user, "knowledge_chunks", values))[0]


@router.post("/{agent_id}/knowledge/{knowledge_id}/chunks/{chunk_id}/embedding/generate")
async def generate_knowledge_chunk_embedding(agent_id: UUID, knowledge_id: UUID, chunk_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    rows = await select(user, "knowledge_chunks", {
        "select": "id,content",
        "id": f"eq.{chunk_id}",
        "knowledge_item_id": f"eq.{knowledge_id}",
        "limit": "1",
    })
    item = await select(user, "knowledge_items", {"select": "id", "id": f"eq.{knowledge_id}", "agent_id": f"eq.{agent_id}", "owner_user_id": f"eq.{user.user_id}", "limit": "1"})
    if not rows or not item:
        raise HTTPException(status_code=404, detail={"code": "KNOWLEDGE_CHUNK_NOT_FOUND", "message": "Knowledge chunk was not found."})
    try:
        result = await embed_text(user, rows[0]["content"], agent_id=str(agent_id), dimensions=1536, metadata={"purpose":"knowledge_chunk_embedding","knowledge_id":str(knowledge_id),"chunk_id":str(chunk_id)})
    except AIGatewayError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc
    updated = await update(user, "knowledge_chunks", {"id": f"eq.{chunk_id}"}, {"embedding": result.embedding})
    return {"data": updated[0] if updated else {"id": str(chunk_id)}, "embedding": {"model": result.model_identifier, "dimensions": len(result.embedding), "request_id": result.request_id}}

@router.post("/{agent_id}/knowledge/retrieve")
async def retrieve_knowledge(agent_id: UUID, payload: RetrievalRequest, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    embedding = payload.embedding
    if not embedding and payload.query:
        try:
            result = await embed_text(user, payload.query, agent_id=str(agent_id), dimensions=1536, metadata={"purpose":"agent_knowledge_query"})
            embedding = "[" + ",".join(f"{v:.10g}" for v in result.embedding) + "]"
        except AIGatewayError as exc:
            raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": str(exc)}) from exc
    if not embedding:
        raise HTTPException(status_code=422, detail={"code": "RETRIEVAL_QUERY_REQUIRED", "message": "query or embedding is required."})
    result = await rpc(user, "retrieve_agent_knowledge", {"p_agent_id": str(agent_id), "p_query_embedding": embedding, "p_limit": payload.limit})
    return {"data": result}


@router.delete("/{agent_id}/knowledge/{knowledge_id}")
async def delete_knowledge(agent_id: UUID, knowledge_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    item = await select(user, "knowledge_items", {
        "select": "id",
        "id": f"eq.{knowledge_id}",
        "agent_id": f"eq.{agent_id}",
        "owner_user_id": f"eq.{user.user_id}",
        "limit": "1",
    })
    if not item:
        raise HTTPException(status_code=404, detail={"code": "KNOWLEDGE_NOT_FOUND", "message": "Knowledge item was not found."})
    return await rpc(user, "delete_knowledge_item", {"p_knowledge_item_id": str(knowledge_id)})


@router.post("/{agent_id}/knowledge/expire")
async def expire_knowledge(agent_id: UUID, context: dict = Depends(get_auth_context)) -> Any:
    user = context["user"]
    await _owned_agent(user, agent_id)
    return {"archived_count": await rpc(user, "expire_agent_knowledge", {})}
