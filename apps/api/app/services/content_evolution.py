"""Phase 11A.6 Content Evolution orchestration.

Composes existing authoritative Content, AI Capsule, Community, Feed/content-topic,
Live and Universe/World domains into the canonical Content Evolution path.
It does not create a second content/recommendation/community/live/world engine.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, select


class ContentEvolutionError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


async def get_content_evolution(
    user: AuthenticatedUser,
    content_id: UUID,
    *,
    related_limit: int = 6,
) -> dict[str, Any]:
    content_rows = await select(
        user,
        "content_items",
        {
            "select": "id,owner_type,owner_id,content_type,title,excerpt,visibility,status,published_at,created_at,updated_at",
            "id": f"eq.{content_id}",
            "status": "eq.published",
            "limit": "1",
        },
    )
    if not content_rows:
        raise ContentEvolutionError(
            "CONTENT_EVOLUTION_CONTENT_NOT_AVAILABLE",
            "Published Content is not available in the current permission scope.",
            404,
        )

    content = content_rows[0]
    content_key = str(content["id"])

    try:
        topics = await select(
            user,
            "content_topic_links",
            {"select": "topic_id", "content_id": f"eq.{content_key}"},
        )
        topic_ids = [str(row["topic_id"]) for row in topics if row.get("topic_id")]

        capsule_rows = await select(
            user,
            "ai_capsules",
            {
                "select": "id,summary,key_points,source_metadata,generated_by,model_reference,provenance,confidence,review_status,created_at,updated_at",
                "content_id": f"eq.{content_key}",
                "review_status": "eq.reviewed",
                "limit": "1",
            },
        )

        discussion_rows = await select(
            user,
            "community_posts",
            {
                "select": "id,community_id,content_id,author_type,author_id,status,pinned,created_at,updated_at",
                "content_id": f"eq.{content_key}",
                "status": "eq.active",
                "order": "created_at.desc",
                "limit": str(related_limit),
            },
        )

        world_rows = await select(
            user,
            "universe_world_content",
            {
                "select": "world_id,content_id,placement,sort_order,created_at",
                "content_id": f"eq.{content_key}",
                "order": "sort_order.asc,created_at.asc",
                "limit": str(related_limit),
            },
        )

        related_rows: list[dict[str, Any]] = []
        if topic_ids:
            topic_filter = f"in.({','.join(topic_ids)})"
            related_links = await select(
                user,
                "content_topic_links",
                {
                    "select": "content_id,topic_id",
                    "topic_id": topic_filter,
                    "content_id": f"neq.{content_key}",
                    "limit": str(related_limit * 4),
                },
            )
            related_ids = []
            for row in related_links:
                candidate = str(row.get("content_id") or "")
                if candidate and candidate not in related_ids:
                    related_ids.append(candidate)
            if related_ids:
                related_rows = await select(
                    user,
                    "content_items",
                    {
                        "select": "id,owner_type,owner_id,content_type,title,excerpt,published_at,created_at",
                        "id": f"in.({','.join(related_ids[:related_limit * 2])})",
                        "status": "eq.published",
                        "visibility": "eq.public",
                        "order": "published_at.desc.nullslast,created_at.desc",
                        "limit": str(related_limit),
                    },
                )

        live_rows: list[dict[str, Any]] = []
        metadata = content.get("metadata") if isinstance(content.get("metadata"), dict) else {}
        live_session_id = metadata.get("live_session_id")
        if live_session_id:
            live_rows = await select(
                user,
                "live_sessions",
                {
                    "select": "id,title,source_type,status,visibility,scheduled_at,started_at,ended_at,district_id,booth_id",
                    "id": f"eq.{live_session_id}",
                    "status": "in.(scheduled,live)",
                    "visibility": "eq.public",
                    "limit": "1",
                },
            )
    except SupabaseRestError as exc:
        raise ContentEvolutionError(
            "CONTENT_EVOLUTION_SOURCE_FAILED",
            "One or more evolution sources are unavailable in the current permission boundary.",
            exc.status_code if exc.status_code in {401, 403, 404} else 503,
        ) from exc

    return {
        "content": content,
        "path": [
            {"key": "original", "available": True, "target_type": "content", "target_id": content_key},
            {
                "key": "ai_summary",
                "available": bool(capsule_rows),
                "target_type": "ai_capsule",
                "target_id": str(capsule_rows[0]["id"]) if capsule_rows else None,
            },
            {
                "key": "discussion",
                "available": bool(discussion_rows),
                "target_type": "community_post",
                "target_count": len(discussion_rows),
            },
            {
                "key": "related_content",
                "available": bool(related_rows),
                "target_type": "content",
                "target_count": len(related_rows),
            },
            {
                "key": "live_experience",
                "available": bool(live_rows),
                "target_type": "live_session",
                "target_count": len(live_rows),
            },
            {
                "key": "world",
                "available": bool(world_rows),
                "target_type": "world",
                "target_count": len(world_rows),
            },
        ],
        "ai_summary": capsule_rows[0] if capsule_rows else None,
        "discussion": discussion_rows,
        "related_content": related_rows,
        "live_experience": live_rows,
        "world": world_rows,
        "availability": {
            "topic_count": len(topic_ids),
            "has_reviewed_ai_summary": bool(capsule_rows),
            "discussion_count": len(discussion_rows),
            "related_content_count": len(related_rows),
            "live_experience_count": len(live_rows),
            "world_count": len(world_rows),
        },
    }
