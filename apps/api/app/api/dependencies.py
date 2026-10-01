from collections.abc import Callable
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status

from app.core.auth import AuthenticatedUser, require_auth
from app.core.supabase_rest import select


async def get_auth_context(
    user: AuthenticatedUser = Depends(require_auth),
) -> dict:
    users = await select(
        user,
        "users",
        {
            "select": "id,status,display_name,username,locale,timezone,created_at,updated_at",
            "id": f"eq.{user.user_id}",
            "limit": "1",
        },
    )

    if not users:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "AUTH_IDENTITY_NOT_PROVISIONED",
                "message": "The authenticated identity has not been provisioned in Allpha.",
            },
        )

    user_record = users[0]
    if user_record.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "AUTH_ACCOUNT_INACTIVE",
                "message": "The Allpha account is not active.",
            },
        )

    roles = await select(
        user,
        "user_roles",
        {
            "select": "role_id,expires_at,platform_roles(key,name)",
            "user_id": f"eq.{user.user_id}",
        },
    )

    permissions: set[str] = set()
    role_keys: set[str] = set()

    for role in roles:
        expires_at = role.get("expires_at")
        if expires_at:
            try:
                if datetime.fromisoformat(expires_at.replace("Z", "+00:00")) <= datetime.now(timezone.utc):
                    continue
            except ValueError:
                continue

        role_obj = role.get("platform_roles") or {}
        role_key = role_obj.get("key")
        if role_key:
            role_keys.add(role_key)

        permission_rows = await select(
            user,
            "platform_role_permissions",
            {
                "select": "permissions(key)",
                "role_id": f"eq.{role.get('role_id')}",
            },
        )
        permissions.update(
            item["permissions"]["key"]
            for item in permission_rows
            if item.get("permissions") and item["permissions"].get("key")
        )

    return {
        "user": user,
        "user_record": user_record,
        "roles": sorted(role_keys),
        "permissions": sorted(permissions),
    }


def require_permission(permission: str) -> Callable:
    async def dependency(context: dict = Depends(get_auth_context)) -> dict:
        if permission not in set(context["permissions"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "AUTH_PERMISSION_DENIED",
                    "permission": permission,
                    "message": "The authenticated user is not authorized for this operation.",
                },
            )
        return context

    return dependency
