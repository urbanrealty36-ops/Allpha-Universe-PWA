from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.dependencies import get_auth_context
from app.core.auth import AuthenticatedUser
from app.core.supabase_rest import update, select


router = APIRouter(prefix="/api/v1/identity", tags=["Human Identity"])


class HumanProfileUpdate(BaseModel):
    bio: str | None = None
    avatar_path: str | None = None
    cover_path: str | None = None
    website_url: str | None = None
    visibility: str | None = None
    preferences: dict[str, Any] | None = None


@router.get("/me")
async def get_human_identity(context: dict = Depends(get_auth_context)) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    profiles = await select(user, "profiles", {
        "select": "id,bio,avatar_path,cover_path,website_url,visibility,preferences,created_at,updated_at",
        "id": f"eq.{user.user_id}", "limit": "1",
    })
    identities = await select(user, "identities", {
        "select": "id,provider,provider_subject,verified_at,metadata,created_at",
        "user_id": f"eq.{user.user_id}",
    })
    return {
        "user": context["user_record"],
        "profile": profiles[0] if profiles else None,
        "identities": identities,
        "roles": context["roles"],
        "permissions": context["permissions"],
    }


@router.patch("/me/profile")
async def update_human_profile(
    payload: HumanProfileUpdate,
    context: dict = Depends(get_auth_context),
) -> dict[str, Any]:
    user: AuthenticatedUser = context["user"]
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail={
            "code": "PROFILE_UPDATE_EMPTY",
            "message": "At least one profile field is required.",
        })
    rows = await update(user, "profiles", {"id": f"eq.{user.user_id}"}, values)
    if not rows:
        raise HTTPException(status_code=404, detail={
            "code": "PROFILE_NOT_FOUND",
            "message": "Human profile was not found.",
        })
    return rows[0]
