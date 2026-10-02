"""Phase 11A Content Gravity cross-domain relevance orchestration.

This layer consumes authoritative Feed ranking and enriches it with existing
Personalization, Content Topic, World placement, and direct content signal
data. It never grants authority, changes ownership, or bypasses Feed/RLS.
"""

from __future__ import annotations

from math import exp
from typing import Any

from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import SupabaseRestError, select


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _base_score(value: Any) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return 0.0
    return _clamp(1.0 - exp(-max(0.0, numeric) / 4.0))


async def apply_content_gravity(
    user: AuthenticatedUser,
    items: list[dict[str, Any]],
    *,
    surface: str,
) -> list[dict[str, Any]]:
    if not items:
        return items

    content_ids = [str(item["id"]) for item in items if item.get("id")]
    if not content_ids:
        return items

    ids_filter = f"in.({','.join(content_ids)})"

    try:
        topic_links = await select(
            user,
            "content_topic_links",
            {"select": "content_id,topic_id", "content_id": ids_filter},
        )
        affinities = await select(
            user,
            "subject_interest_affinities",
            {"select": "interest_id,score,confidence", "user_id": f"eq.{user.id}"},
        )
        interest_ids = [str(row["interest_id"]) for row in affinities if row.get("interest_id")]
        interests = []
        if interest_ids:
            interests = await select(
                user,
                "interest_nodes",
                {"select": "id,name,canonical_key,status", "id": f"in.({','.join(interest_ids)})"},
            )

        topic_ids = [str(row["topic_id"]) for row in topic_links if row.get("topic_id")]
        topics = []
        if topic_ids:
            topics = await select(
                user,
                "content_topics",
                {"select": "id,name,slug,status", "id": f"in.({','.join(topic_ids)})"},
            )

        world_links = await select(
            user,
            "universe_world_content",
            {"select": "content_id,world_id,placement", "content_id": ids_filter},
        )
        personalization = await select(
            user,
            "personalization_signals",
            {
                "select": "entity_id,signal_type,strength,occurred_at",
                "user_id": f"eq.{user.id}",
                "entity_type": "eq.content",
                "entity_id": ids_filter,
            },
        )
    except SupabaseRestError:
        # Gravity is an enrichment layer. If an optional source is unavailable,
        # preserve the authoritative Feed result rather than fabricating a score.
        return items

    topic_by_content: dict[str, list[str]] = {}
    for row in topic_links:
        if row.get("content_id") and row.get("topic_id"):
            topic_by_content.setdefault(str(row["content_id"]), []).append(str(row["topic_id"]))

    affinity_by_interest = {
        str(row["interest_id"]): _clamp(float(row.get("score") or 0))
        * _clamp(float(row.get("confidence") or 0))
        for row in affinities
        if row.get("interest_id")
    }
    interest_name_by_id = {
        str(row["id"]): (row.get("name") or "").lower()
        for row in interests
        if row.get("id")
    }
    interest_key_by_id = {
        str(row["id"]): (row.get("canonical_key") or "").lower()
        for row in interests
        if row.get("id")
    }
    topic_name_by_id = {
        str(row["id"]): (row.get("name") or "").lower()
        for row in topics
        if row.get("id")
    }
    topic_slug_by_id = {
        str(row["id"]): (row.get("slug") or "").lower()
        for row in topics
        if row.get("id")
    }

    personalization_by_content: dict[str, float] = {}
    personalization_reason: dict[str, list[str]] = {}
    for row in personalization:
        content_id = str(row.get("entity_id"))
        strength = _clamp(float(row.get("strength") or 0))
        personalization_by_content[content_id] = max(
            personalization_by_content.get(content_id, 0.0), strength
        )
        personalization_reason.setdefault(content_id, []).append(
            str(row.get("signal_type") or "personalization")
        )

    world_by_content: dict[str, int] = {}
    for row in world_links:
        if row.get("content_id"):
            content_id = str(row["content_id"])
            world_by_content[content_id] = world_by_content.get(content_id, 0) + 1

    enriched: list[dict[str, Any]] = []
    for item in items:
        content_id = str(item["id"])
        matched_interests: list[str] = []
        topic_signal = 0.0

        for topic_id in topic_by_content.get(content_id, []):
            topic_name = topic_name_by_id.get(topic_id, "")
            topic_slug = topic_slug_by_id.get(topic_id, "")
            for interest_id, affinity in affinity_by_interest.items():
                if affinity <= 0:
                    continue
                if topic_name and (
                    topic_name == interest_name_by_id.get(interest_id)
                    or topic_name == interest_key_by_id.get(interest_id)
                ):
                    topic_signal += affinity
                    matched_interests.append(
                        interest_name_by_id.get(interest_id) or topic_name
                    )
                elif topic_slug and topic_slug == interest_key_by_id.get(interest_id):
                    topic_signal += affinity
                    matched_interests.append(
                        interest_name_by_id.get(interest_id) or topic_slug
                    )

        topic_signal = _clamp(topic_signal)
        personalization_signal = personalization_by_content.get(content_id, 0.0)
        world_signal = _clamp(world_by_content.get(content_id, 0) / 3.0)

        context_signal = 0.0
        reasons: list[str] = []
        if matched_interests:
            context_signal += topic_signal * 0.45
            reasons.append("interest_context")
        if personalization_signal > 0:
            context_signal += personalization_signal * 0.35
            reasons.extend(personalization_reason.get(content_id, [])[:2])
        if world_signal > 0:
            context_signal += world_signal * (0.25 if surface == "worlds" else 0.12)
            reasons.append("world_context")

        base = _base_score(item.get("rank_score"))
        gravity = _clamp(base * 0.65 + _clamp(context_signal) * 0.35)

        output = dict(item)
        output["gravity_score"] = round(gravity, 6)
        output["gravity_reason_codes"] = list(dict.fromkeys(reasons))[:6]
        output["gravity_signals"] = {
            "feed_base": round(base, 6),
            "interest_context": round(topic_signal, 6),
            "personalization": round(personalization_signal, 6),
            "world_context": round(world_signal, 6),
        }
        enriched.append(output)

    enriched.sort(
        key=lambda row: (
            -float(row.get("gravity_score", 0)),
            row.get("position", 0),
        )
    )
    for position, item in enumerate(enriched):
        item["gravity_position"] = position

    return enriched
