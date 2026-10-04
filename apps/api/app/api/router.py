from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import require_auth

router = APIRouter(prefix="/api/v1")


def not_implemented(domain: str) -> None:
    raise HTTPException(
        status_code=501,
        detail={
            "code": "DOMAIN_NOT_IMPLEMENTED",
            "domain": domain,
            "message": "This domain does not yet expose a dedicated canonical FastAPI surface.",
        },
    )


def domain_router(path: str, domain: str) -> APIRouter:
    child = APIRouter(prefix=path, tags=[domain], dependencies=[Depends(require_auth)])

    @child.get("")
    async def list_resource() -> None:
        not_implemented(domain)

    return child


# Only domains without a dedicated canonical router are kept here.
# Do not add a path that already has an authoritative domain router.
for _path, _domain in [
    ("/events", "Events"),
    ("/transactions", "Transactions"),
    ("/reports", "Reports"),
    ("/localization", "Localization"),
    ("/system-settings", "System Settings"),
    ("/e2e-qa", "E2E QA"),
]:
    router.include_router(domain_router(_path, _domain))
