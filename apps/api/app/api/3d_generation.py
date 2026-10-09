from __future__ import annotations

import os
import re
from typing import Any, Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, HttpUrl

router = APIRouter(prefix="/api/v1/3d-generation", tags=["AI 3D Theme Generation"])
TRIPO_BASE_URL = "https://openapi.tripo3d.ai/v3"
TASK_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{6,160}$")


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
        raise HTTPException(status_code=503, detail={"code": "TRIPO_NOT_CONFIGURED", "message": "3D generation is not configured. Set TRIPO_API_KEY on the API service."})
    return key


def _upstream_error(status: int, code: str) -> HTTPException:
    return HTTPException(status_code=502, detail={"code": code, "provider_status": status, "message": "Tripo rejected or could not complete the request."})


async def _tripo_post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {_api_key()}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            response = await client.post(f"{TRIPO_BASE_URL}{path}", headers=headers, json=payload)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_UPSTREAM_UNAVAILABLE", "message": "Tripo is temporarily unavailable."}) from exc
    if response.status_code >= 400:
        raise _upstream_error(response.status_code, "TRIPO_UPSTREAM_ERROR")
    try:
        body = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_INVALID_RESPONSE", "message": "Tripo returned an invalid response."}) from exc
    if not isinstance(body, dict) or body.get("code", 0) != 0:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_TASK_REJECTED", "message": "Tripo did not accept the generation request."})
    result = body.get("data", body)
    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail={"code": "TRIPO_INVALID_RESPONSE", "message": "Tripo returned an unexpected response shape."})
    return result


@router.post("/text-to-model", status_code=202)
async def text_to_model(payload: TextToModelRequest):
    result = await _tripo_post("/generation/text-to-model", {
        "prompt": payload.prompt,
        "negative_prompt": payload.negative_prompt,
        "model": payload.model,
        "face_limit": payload.face_limit,
        "texture": payload.texture,
        "pbr": payload.pbr,
        "texture_quality": payload.texture_quality,
    })
    if not result.get("task_id"):
        raise HTTPException(status_code=502, detail={"code": "TRIPO_TASK_ID_MISSING", "message": "Tripo did not return a task ID."})
    return {"data": result, "provider": "tripo", "status": "queued"}


@router.post("/image-to-model", status_code=202)
async def image_to_model(payload: ImageToModelRequest):
    result = await _tripo_post("/generation/image-to-model", {
        "input": str(payload.image_url),
        "model": payload.model,
        "face_limit": payload.face_limit,
        "texture": payload.texture,
        "pbr": payload.pbr,
        "texture_quality": payload.texture_quality,
    })
    if not result.get("task_id"):
        raise HTTPException(status_code=502, detail={"code": "TRIPO_TASK_ID_MISSING", "message": "Tripo did not return a task ID."})
    return {"data": result, "provider": "tripo", "status": "queued"}


@router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    if not TASK_ID_PATTERN.fullmatch(task_id):
        raise HTTPException(status_code=422, detail={"code": "TRIPO_TASK_ID_INVALID", "message": "Invalid Tripo task ID."})
    headers = {"Authorization": f"Bearer {_api_key()}"}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=10.0)) as client:
            response = await client.get(f"{TRIPO_BASE_URL}/tasks/{task_id}", headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_UPSTREAM_UNAVAILABLE", "message": "Tripo is temporarily unavailable."}) from exc
    if response.status_code >= 400:
        raise _upstream_error(response.status_code, "TRIPO_TASK_QUERY_FAILED")
    try:
        body = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_INVALID_RESPONSE", "message": "Tripo returned an invalid response."}) from exc
    if not isinstance(body, dict) or body.get("code", 0) != 0:
        raise HTTPException(status_code=502, detail={"code": "TRIPO_TASK_QUERY_FAILED", "message": "Tripo task query failed."})
    data = body.get("data", body)
    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail={"code": "TRIPO_INVALID_RESPONSE", "message": "Tripo returned an unexpected response shape."})
    return {"data": data, "provider": "tripo"}


class RigCheckRequest(BaseModel):
    input: str = Field(min_length=6, max_length=2048)


class RigRequest(BaseModel):
    input: str = Field(min_length=6, max_length=2048)
    model: str = "v1.0-20240301"
    rig_type: Literal["biped", "quadruped", "hexapod", "octopod", "avian", "serpentine", "aquatic"] = "biped"
    spec: Literal["tripo", "mixamo"] = "mixamo"
    out_format: Literal["glb", "fbx"] = "glb"


class RetargetRequest(BaseModel):
    input: str = Field(min_length=6, max_length=2048)
    animations: list[str] = Field(min_length=1, max_length=20)


@router.post("/animations/rig-check", status_code=202)
async def rig_check(payload: RigCheckRequest):
    result = await _tripo_post("/animations/rig-check", {"input": payload.input})
    if not result.get("task_id"):
        raise HTTPException(status_code=502, detail={"code": "TRIPO_TASK_ID_MISSING", "message": "Tripo did not return a rig-check task ID."})
    return {"data": result, "provider": "tripo", "status": "queued"}


@router.post("/animations/rig", status_code=202)
async def rig_character(payload: RigRequest):
    result = await _tripo_post("/animations/rig", {
        "input": payload.input,
        "model": payload.model,
        "rig_type": payload.rig_type,
        "spec": payload.spec,
        "out_format": payload.out_format,
    })
    if not result.get("task_id"):
        raise HTTPException(status_code=502, detail={"code": "TRIPO_TASK_ID_MISSING", "message": "Tripo did not return a rigging task ID."})
    return {"data": result, "provider": "tripo", "status": "queued"}


@router.post("/animations/retarget", status_code=202)
async def retarget_character(payload: RetargetRequest):
    result = await _tripo_post("/animations/retarget", {"input": payload.input, "animations": payload.animations})
    if not result.get("task_id"):
        raise HTTPException(status_code=502, detail={"code": "TRIPO_TASK_ID_MISSING", "message": "Tripo did not return a retarget task ID."})
    return {"data": result, "provider": "tripo", "status": "queued"}
