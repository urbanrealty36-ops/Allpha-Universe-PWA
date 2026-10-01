# Phase 07 — Agent Memory & Knowledge

## Scope
Phase 07 activates the Agent memory and knowledge foundation on real PostgreSQL/Supabase data.

### Memory lifecycle
Capture → Classify → Permission/Consent → Store → Retrieve → Review → Expire → Soft Delete.

Memory is owner-scoped to the Agent owner. Retention and consent metadata are persisted. Expired memories are excluded from retrieval and can be transitioned to the database `expired` memory status.

### Knowledge lifecycle
Ingest → Provenance → Chunk → Embed → Store → Retrieve → Review/Retention → Archive/Delete.

Knowledge items and chunks are owner-scoped. Source URI, provenance and source locator are persisted.

### Embeddings
Embedding storage is provider/model agnostic. No embedding dimension is hardcoded into the platform because the AI Gateway/Model Router is responsible for selecting the actual embedding provider/model. Semantic retrieval uses PostgreSQL pgvector cosine distance. The existing knowledge_chunks HNSW infrastructure remains available; memory embeddings intentionally do not add a model-specific HNSW dimension before the embedding model contract is finalized.

### Security
- Supabase RLS is enabled on memory, knowledge, embedding and access-audit tables.
- Agent ownership is checked in database RPCs as well as the API.
- Memory/knowledge retrieval records access events through private database helper functions.
- Audit mutations are recorded through database triggers.
- Browser roles cannot directly write retrieval audit events.
- No service-role key is used by Web/Admin.
- No fake, mock, dummy, scenario or seed business data is created.

### Backend APIs
- Agent memory CRUD/lifecycle/review/retrieval
- Memory embedding persistence
- Knowledge item lifecycle
- Knowledge chunk persistence
- Knowledge semantic retrieval
- Retention/expiry execution
