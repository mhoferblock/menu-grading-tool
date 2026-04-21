from __future__ import annotations

import sys
import os
from datetime import datetime
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Query
from src.services.mock_data import BUILDERS, next_id
from src.services.quality_tracker import compute_builder_metrics, get_builder_trend
from src.models.schemas import BuilderCreateRequest
from src.utils.errors import NotFoundError

router = APIRouter(prefix="/builders", tags=["builders"])


@router.get("")
def list_builders(q: Optional[str] = Query(None)):
    builders = list(BUILDERS.values())

    if q:
        q_lower = q.lower()
        builders = [
            b for b in builders
            if q_lower in b["name"].lower() or q_lower in b["email"].lower()
        ]

    builders.sort(key=lambda b: b["name"])
    return {"data": builders, "meta": {"total": len(builders)}}


@router.post("", status_code=201)
def create_builder(body: BuilderCreateRequest):
    builder_id = next_id("builder")
    builder = {
        "id": builder_id,
        "name": body.name,
        "email": body.email,
        "team": body.team,
        "created_at": datetime.utcnow().isoformat(),
    }
    BUILDERS[builder_id] = builder
    return {"data": builder, "meta": {}}


@router.get("/{builder_id}")
def get_builder(builder_id: str):
    if builder_id not in BUILDERS:
        raise NotFoundError("Builder", builder_id)

    metrics = compute_builder_metrics(builder_id)
    return {"data": metrics, "meta": {}}


@router.get("/{builder_id}/trend")
def get_builder_trend_data(builder_id: str):
    if builder_id not in BUILDERS:
        raise NotFoundError("Builder", builder_id)

    trend = get_builder_trend(builder_id)
    return {"data": trend, "meta": {"total": len(trend)}}
