from __future__ import annotations

import os
from typing import Any, Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from app.api.dependencies import get_auth_context

router = APIRouter(prefix="/api/v1/3d-generation", tags=["AI 3D Theme Generation"])
TRIPO_BASE_URL = "https://openapi.tripo3d.ai/v3"


class TextToModelRequest(BaseModel):
    prompt: str = Field(min_length=8, max_length=1024)
    negative_prompt: str | None = Field(default=None, max_length=255)
    model: str = "v3.1-20260211"
    face_limit: int = Field(default=50000, ge=1000, le=150000)
    texture: bool = True
    pbr: bool = True
    texture_quality: Literal["standard", "detailed"] = "detailed"


class ImageToModelRequest(BaseModel):
    image_url: HttpUrl
    model: str = "v3.1-20260211"
    face_limit: int = Field(default=50000, ge=1000, le=150000)
    texture: bool = True
    pbr: bool = True
    texture_quality: Literal["standard", "detailed"] = "detailed"


def _api_key() -> str:
    key = os.getenv("TRIPO_API_KEY", "").strip()
    if not key:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "TRIPO_NOT_CONFIGURED",
                "message": "3D generation is not configured. Set TRIPO_API_KEY on the API service.",
            },
        )
    return key


async def _tripo_post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {_api_key()}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            response = await client.post(f"{TRIPO_BASE_URL}{path}", headers=headers, json=payload)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_UPSTREAM_UNAVAILABLE", "message": str(exc)}) from exc
    if response.status_code >= 400:
        # Do not return upstream headers or credentials to clients.
        raise HTTPException(
            status_code=502,
            detail={"code": "TRIPO_UPSTREAM_ERROR", "status": response.status_code, "message": response.text[:1000]},
        )
    data = response.json()
    if data.get("code", 0) != 0:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_TASK_REJECTED", "message": data.get("message", "Generation request failed")})
    return data.get("data", data)


@router.post("/text-to-model", status_code=202)
async def text_to_model(payload: TextToModelRequest, context: dict = Depends(get_auth_context)):
    _ = context
    result = await _tripo_post(
        "/generation/text-to-model",
        {
            "prompt": payload.prompt,
            "negative_prompt": payload.negative_prompt,
            "model": payload.model,
            "face_limit": payload.face_limit,
            "texture": payload.texture,
            "pbr": payload.pbr,
            "texture_quality": payload.texture_quality,
        },
    )
    return {"data": result, "provider": "tripo", "status": "queued"}


@router.post("/image-to-model", status_code=202)
async def image_to_model(payload: ImageToModelRequest, context: dict = Depends(get_auth_context)):
    _ = context
    result = await _tripo_post(
        "/generation/image-to-model",
        {
            "input": str(payload.image_url),
            "model": payload.model,
            "face_limit": payload.face_limit,
            "texture": payload.texture,
            "pbr": payload.pbr,
            "texture_quality": payload.texture_quality,
        },
    )
    return {"data": result, "provider": "tripo", "status": "queued"}


@router.get("/tasks/{task_id}")
async def get_task(task_id: str, context: dict = Depends(get_auth_context)):
    _ = context
    headers = {"Authorization": f"Bearer {_api_key()}"}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=10.0)) as client:
            response = await client.get(f"{TRIPO_BASE_URL}/tasks/{task_id}", headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_UPSTREAM_UNAVAILABLE", "message": str(exc)}) from exc
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_UPSTREAM_ERROR", "status": response.status_code, "message": response.text[:1000]})
    body = response.json()
    if body.get("code", 0) != 0:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_TASK_QUERY_FAILED", "message": body.get("message", "Task query failed")})
    return {"data": body.get("data", body), "provider": "tripo"}
