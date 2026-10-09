from __future__ import annotations

import asyncio
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import get_settings
from app.core.supabase_rest import service_insert, service_select, service_update


def _validate_glb(content: bytes) -> None:
    """Reject malformed or non-renderable GLB containers before Storage upload."""
    if len(content) < 20 or len(content) > 100 * 1024 * 1024:
        raise ThemeAssetIngestionError("THEME_ASSET_SIZE_INVALID", "Generated GLB is empty, truncated, or exceeds the 100 MB ingestion limit.")
    magic, version, declared_length = struct.unpack_from("<III", content, 0)
    if magic != 0x46546C67 or version != 2 or declared_length != len(content):
        raise ThemeAssetIngestionError("THEME_ASSET_NOT_GLB", "Provider output is not a valid GLB 2.0 binary container.")
    offset = 12
    chunk_index = 0
    document: dict[str, Any] | None = None
    saw_binary = False
    while offset < len(content):
        if offset + 8 > len(content):
            raise ThemeAssetIngestionError("THEME_ASSET_GLB_CHUNK_INVALID", "GLB chunk header is truncated.")
        chunk_length, chunk_type = struct.unpack_from("<II", content, offset)
        offset += 8
        if chunk_length == 0 or chunk_length % 4 or offset + chunk_length > len(content):
            raise ThemeAssetIngestionError("THEME_ASSET_GLB_CHUNK_INVALID", "GLB chunk length or alignment is invalid.")
        chunk = content[offset:offset + chunk_length]
        if chunk_index == 0 and chunk_type != 0x4E4F534A:
            raise ThemeAssetIngestionError("THEME_ASSET_GLB_JSON_MISSING", "GLB JSON chunk must be first.")
        if chunk_type == 0x4E4F534A:
            if document is not None or chunk_index != 0:
                raise ThemeAssetIngestionError("THEME_ASSET_GLB_JSON_INVALID", "GLB JSON chunk is duplicated or out of order.")
            try:
                document = json.loads(chunk.decode("utf-8").rstrip(" \\t\\r\\n\\x00"))
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                raise ThemeAssetIngestionError("THEME_ASSET_GLB_JSON_INVALID", "GLB JSON chunk is invalid.") from exc
        elif chunk_type == 0x004E4942:
            if document is None or saw_binary:
                raise ThemeAssetIngestionError("THEME_ASSET_GLB_CHUNK_INVALID", "GLB binary chunk is duplicated or out of order.")
            saw_binary = True
        else:
            raise ThemeAssetIngestionError("THEME_ASSET_GLB_CHUNK_INVALID", "GLB contains an unsupported chunk type.")
        offset += chunk_length
        chunk_index += 1
    if offset != len(content) or not isinstance(document, dict) or document.get("asset", {}).get("version") != "2.0":
        raise ThemeAssetIngestionError("THEME_ASSET_NOT_GLB", "GLB does not contain a valid glTF 2.0 document.")
    scenes = document.get("scenes")
    nodes = document.get("nodes")
    meshes = document.get("meshes")
    if not isinstance(scenes, list) or not scenes or not isinstance(nodes, list) or not isinstance(meshes, list) or not meshes:
        raise ThemeAssetIngestionError("THEME_ASSET_SCENE_EMPTY", "GLB must contain at least one scene, node list, and mesh.")
    mesh_node_indices = {
        node.get("mesh") for node in nodes
        if isinstance(node, dict) and isinstance(node.get("mesh"), int)
    }
    if not any(isinstance(scene, dict) and any(
        isinstance(index, int) and 0 <= index < len(nodes) and nodes[index].get("mesh") in mesh_node_indices
        for index in scene.get("nodes", []) if isinstance(scene.get("nodes"), list)
    ) for scene in scenes):
        raise ThemeAssetIngestionError("THEME_ASSET_SCENE_EMPTY", "GLB scenes do not reference mesh-bearing nodes.")


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



def _process_with_blender(content: bytes) -> tuple[bytes, dict[str, Any]]:
    """Run the canonical headless Blender import/export gate when configured."""
    configured = os.getenv("ALLPHA_BLENDER_BINARY", "").strip()
    binary = configured or shutil.which("blender")
    script = Path(__file__).resolve().parents[4] / "scripts" / "theme-rebuild" / "blender_process_glb.py"
    if not binary:
        raise ThemeAssetIngestionError("BLENDER_NOT_CONFIGURED", "Blender is required for Theme 3D production ingestion. Configure ALLPHA_BLENDER_BINARY on the API service.")
    if not script.is_file():
        raise ThemeAssetIngestionError("BLENDER_PIPELINE_SCRIPT_MISSING", "Canonical Blender processing script is missing from the API deployment.")
    with tempfile.TemporaryDirectory(prefix="allpha-theme-glb-") as temp_dir:
        source = Path(temp_dir) / "provider.glb"
        output = Path(temp_dir) / "processed.glb"
        report_path = Path(temp_dir) / "blender-report.json"
        source.write_bytes(content)
        try:
            result = subprocess.run(
                [binary, "--background", "--python", str(script), "--", str(source), str(output), str(report_path)],
                capture_output=True, text=True,
                timeout=int(os.getenv("ALLPHA_BLENDER_TIMEOUT_SECONDS", "180")), check=False,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise ThemeAssetIngestionError("BLENDER_PROCESS_FAILED", "Blender could not process the generated GLB within the configured runtime.") from exc
        if result.returncode != 0 or not output.is_file() or not report_path.is_file():
            raise ThemeAssetIngestionError("BLENDER_PROCESS_FAILED", "Blender import/export QA failed; the unprocessed source was not promoted.")
        try:
            report = json.loads(report_path.read_text(encoding="utf-8"))
            processed = output.read_bytes()
        except (OSError, ValueError) as exc:
            raise ThemeAssetIngestionError("BLENDER_REPORT_INVALID", "Blender output report or processed GLB is invalid.") from exc
        _validate_glb(processed)
        if report.get("output_sha256") != hashlib.sha256(processed).hexdigest():
            raise ThemeAssetIngestionError("BLENDER_CHECKSUM_MISMATCH", "Blender output checksum does not match its report.")
        return processed, report


async def _verify_signed_url(signed_url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(signed_url, headers={"Range": "bytes=0-31"})
        return response.status_code in {200, 206} and bool(response.content)
    except httpx.HTTPError:
        return False


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
    _validate_glb(content)
    content, blender_report = await asyncio.to_thread(_process_with_blender, content)
    _validate_glb(content)
    digest = hashlib.sha256(content).hexdigest()
    storage_path = f"theme-v3-tripo/{package['id']}/{item['asset_key']}-{digest[:16]}.glb"
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
            "pipeline": "REBUILD-03",
            "blender_report": blender_report,
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
    signed_url = await create_signed_asset_url(storage_path)
    if not signed_url or not await _verify_signed_url(signed_url):
        raise ThemeAssetIngestionError("THEME_SIGNED_URL_VERIFICATION_FAILED", "Uploaded GLB was registered, but its signed download URL could not be verified.")
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
            "blender_report": blender_report,
            "signed_url_verified": True,
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
