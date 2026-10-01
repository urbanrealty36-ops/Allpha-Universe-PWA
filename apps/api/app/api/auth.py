from fastapi import APIRouter, Depends

from app.api.dependencies import get_auth_context
from app.core.supabase_rest import select, SupabaseRestError


router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.get("/me")
async def get_current_identity(context: dict = Depends(get_auth_context)) -> dict:
    user = context["user"]
    try:
        users = await select(
            user,
            "users",
            {
                "select": "id,status,display_name,username,locale,timezone,created_at,updated_at",
                "id": f"eq.{user.user_id}",
                "limit": "1",
            },
        )
        profiles = await select(
            user,
            "profiles",
            {
                "select": "id,bio,avatar_path,cover_path,website_url,visibility,preferences,created_at,updated_at",
                "id": f"eq.{user.user_id}",
                "limit": "1",
            },
        )
    except SupabaseRestError as exc:
        raise RuntimeError("Authoritative identity data could not be read.") from exc

    return {
        "user": users[0] if users else None,
        "profile": profiles[0] if profiles else None,
        "roles": context["roles"],
        "permissions": context["permissions"],
        "session": {
            "session_id": str(user.session_id) if user.session_id else None,
            "role": user.role,
        },
    }


@router.get("/permissions")
async def get_current_permissions(context: dict = Depends(get_auth_context)) -> dict:
    return {
        "roles": context["roles"],
        "permissions": context["permissions"],
    }


@router.get("/organizations")
async def get_current_organizations(context: dict = Depends(get_auth_context)) -> list[dict]:
    user = context["user"]
    return await select(
        user,
        "organization_members",
        {
            "select": "id,organization_id,role,permissions,created_at,updated_at,organizations(id,name,slug,status)",
            "user_id": f"eq.{user.user_id}",
            "order": "created_at.asc",
        },
    )
