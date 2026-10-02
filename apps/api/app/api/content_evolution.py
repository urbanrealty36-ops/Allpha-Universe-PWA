from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import get_auth_context
from app.services.content_evolution import ContentEvolutionError, get_content_evolution


router = APIRouter(prefix="/api/v1/discovery", tags=["Allpha Universe Discovery"])


def _error(exc: ContentEvolutionError) -> HTTPException:
    status = exc.status_code if exc.status_code in {400, 401, 403, 404, 422, 503} else 500
    return HTTPException(status_code=status, detail={"code": exc.code, "message": str(exc)})


@router.get("/content/{content_id}/evolution")
async def content_evolution(
    content_id: UUID,
    related_limit: int = Query(default=6, ge=1, le=12),
    context: dict[str, Any] = Depends(get_auth_context),
) -> dict[str, Any]:
    try:
        data = await get_content_evolution(
            context["user"],
            content_id=content_id,
            related_limit=related_limit,
        )
        return {"data": data}
    except ContentEvolutionError as exc:
        raise _error(exc) from exc
