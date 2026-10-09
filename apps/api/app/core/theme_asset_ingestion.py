from __future__ import annotations

import hashlib
import re
from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import get_settings
from app.core.supabase_rest import service_insert, service_select, service_update


class ThemeAssetIngestionError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        super().__init__(message)


def _headers(content_type: str = "application/json") -> dict[str, str]:
    settings = get_settings()
    key = settings.supabase_service_role_key
    if not key:
        raise ThemeAssetIngestionError("SUPABASE_SERVICE_ROLE_NOT_CONFIGURED", "Server-side Storage access is not configured.")
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
        "Content-Type": content_type,
    }


async def ensure_theme_records(package: dict[str, Any]) -> dict[str, Any]:
    if package.get("theme_id") and package.get("theme_version_id"):
        return package
    current = await service_select("theme_generation_packages", {
        "select":"id,owner_user_id,theme_name,theme_direction,metadata,theme_id,theme_version_id",
        "id":f"eq.{package['id']}",
        "limit":"1",
    })
    if current:
        package = {**package, **current[0]}
        if package.get("theme_id") and package.get("theme_version_id"):
            return package
    theme_name = str(package["theme_name"])
    slug_base = re.sub(r"[^a-z0-9-]+", "-", theme_name.lower()).strip("-")[:48] or "generated-theme"
    slug = f"{slug_base}-{str(package['id']).split('-')[0]}"
    metadata = package.get("metadata") if isinstance(package.get("metadata"), dict) else {}
    face_limit = int(metadata.get("face_limit") or 50000)
    theme_rows = await service_insert("themes", {
        "creator_user_id": package["owner_user_id"],
        "created_by_user_id": package["owner_user_id"],
        "name": theme_name,
        "slug": slug,
        "description": str(package["theme_direction"]),
        "category": "custom",
        "compatibility": {"renderer": "AllphaWorldRenderer", "theme_generation_package_id": package["id"]},
        "allowed_components": [],
        "performance_budget": {"max_faces": face_limit},
        "accessibility_constraints": {},
        "status": "draft",
        "moderation_status": "pending",
        "source": "creator",
    })
    if not theme_rows:
        raise ThemeAssetIngestionError("THEME_RECORD_CREATE_FAILED", "Theme draft could not be created.")
    version_rows = await service_insert("theme_versions", {
        "theme_id": theme_rows[0]["id"],
        "version": 1,
        "status": "draft",
        "tokens": {"art_direction": str(package["theme_direction"])},
        "component_config": {},
        "world_schema": {"source": "theme_studio", "package_id": package["id"]},
        "compatibility": {"renderer": "AllphaWorldRenderer"},
        "performance_budget": {"max_faces": face_limit},
        "accessibility_constraints": {},
        "validation_status": "pending",
        "performance_status": "pending",
        "moderation_status": "pending",
        "created_by_user_id": package["owner_user_id"],
    })
    if not version_rows:
        raise ThemeAssetIngestionError("THEME_VERSION_CREATE_FAILED", "Theme version draft could not be created.")
    updated = await service_update("theme_generation_packages", {"id": f"eq.{package['id']}"}, {
        "theme_id": theme_rows[0]["id"],
        "theme_version_id": version_rows[0]["id"],
    })
    return updated[0] if updated else {
        **package,
        "theme_id": theme_rows[0]["id"],
        "theme_version_id": version_rows[0]["id"],
    }


async def persist_generated_asset(package: dict[str, Any], item: dict[str, Any], provider_output: dict[str, Any]) -> dict[str, Any]:
    if item.get("storage_path") and item.get("theme_asset_id"):
        return item
    model_url = provider_output.get("model_url") or provider_output.get("pbr_model") or provider_output.get("base_model")
    if isinstance(model_url, dict):
        model_url = model_url.get("url") or model_url.get("model_url")
    if not isinstance(model_url, str) or not model_url.startswith("https://"):
        raise ThemeAssetIngestionError("TRIPO_MODEL_URL_MISSING", "Tripo completed but did not return a valid HTTPS model URL.")
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=15.0), follow_redirects=True) as client:
            download = await client.get(model_url)
            download.raise_for_status()
            content = download.content
    except httpx.HTTPError as exc:
        raise ThemeAssetIngestionError("THEME_ASSET_DOWNLOAD_FAILED", "Generated GLB could not be downloaded.") from exc
    if not content or len(content) > 100 * 1024 * 1024:
        raise ThemeAssetIngestionError("THEME_ASSET_SIZE_INVALID", "Generated GLB is empty or exceeds the 100 MB ingestion limit.")
    if content[:4] != b"glTF":
        raise ThemeAssetIngestionError("THEME_ASSET_NOT_GLB", "Provider output did not contain a binary GLB asset.")
    digest = hashlib.sha256(content).hexdigest()
    storage_path = f"generated/{package['owner_user_id']}/{package['id']}/{item['asset_key']}-{digest[:16]}.glb"
    upload_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/allpha-world-assets/{quote(storage_path, safe='/')}"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=15.0)) as client:
            upload = await client.post(
                upload_url,
                headers={**_headers("model/gltf-binary"), "x-upsert": "true"},
                content=content,
            )
    except httpx.HTTPError as exc:
        raise ThemeAssetIngestionError("THEME_STORAGE_UPLOAD_FAILED", "Generated GLB could not be uploaded to Allpha Storage.") from exc
    if upload.status_code >= 400:
        raise ThemeAssetIngestionError("THEME_STORAGE_UPLOAD_FAILED", "Generated GLB could not be uploaded to Allpha Storage.")
    asset_rows = await service_insert("theme_assets", {
        "theme_id": package["theme_id"],
        "theme_version_id": package["theme_version_id"],
        "asset_type": "model",
        "storage_path": storage_path,
        "mime_type": "model/gltf-binary",
        "metadata": {
            "source": "theme_studio_tripo_v3",
            "package_id": package["id"],
            "generation_item_id": item["id"],
            "asset_key": item["asset_key"],
            "sha256": digest,
        },
        "sort_order": 0,
        "status": "pending",
        "moderation_status": "pending",
        "safety_status": "pending",
        "performance_status": "pending",
        "created_by_user_id": package["owner_user_id"],
        "storage_bucket": "allpha-world-assets",
        "content_size_bytes": len(content),
        "checksum_sha256": digest,
    })
    if not asset_rows:
        raise ThemeAssetIngestionError("THEME_ASSET_REGISTRATION_FAILED", "Uploaded GLB could not be registered in theme_assets.")
    updated = await service_update("theme_generation_items", {"id": f"eq.{item['id']}"}, {
        "storage_path": storage_path,
        "theme_asset_id": asset_rows[0]["id"],
        "model_url": None,
        "preview_url": provider_output.get("rendered_image_url") or provider_output.get("preview"),
        "status": "success",
        "progress": 100,
        "metadata": {
            **(item.get("metadata") if isinstance(item.get("metadata"), dict) else {}),
            "storage_bucket": "allpha-world-assets",
            "checksum_sha256": digest,
            "content_size_bytes": len(content),
        },
    })
    return updated[0] if updated else {
        **item,
        "storage_path": storage_path,
        "theme_asset_id": asset_rows[0]["id"],
        "status": "success",
    }


async def create_signed_asset_url(storage_path: str) -> str | None:
    settings = get_settings()
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/sign/allpha-world-assets/{quote(storage_path, safe='/')}"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, headers=_headers(), json={"expiresIn": 3600})
    except httpx.HTTPError:
        return None
    if response.status_code >= 400:
        return None
    data = response.json()
    signed_url = data.get("signedURL") or data.get("signedUrl")
    if not isinstance(signed_url, str):
        return None
    if signed_url.startswith("/"):
        return f"{settings.supabase_url.rstrip('/')}{signed_url}" if signed_url.startswith("/storage/v1") else f"{settings.supabase_url.rstrip('/')}/storage/v1{signed_url}"
    return signed_url
