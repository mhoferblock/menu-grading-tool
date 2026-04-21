from __future__ import annotations

import sys
import os
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Query
from src.services import store
from src.models.schemas import BuilderCreateRequest
from src.utils.errors import NotFoundError

router = APIRouter(prefix="/builders", tags=["builders"])


@router.get("")
def list_builders(q: Optional[str] = Query(None)):
    builders = store.list_builders(q)
    return {"data": builders, "meta": {"total": len(builders)}}


@router.get("/{builder_id}")
def get_builder(builder_id: str):
    builder = store.get_builder(builder_id)
    if not builder:
        raise NotFoundError("Builder", builder_id)
    return {"data": builder, "meta": {}}


@router.post("", status_code=201)
def create_builder(body: BuilderCreateRequest):
    builder = store.create_builder(body.name, body.email, body.team)
    return {"data": builder, "meta": {}}


@router.delete("/{builder_id}")
def delete_builder(builder_id: str):
    deleted = store.delete_builder(builder_id)
    if not deleted:
        raise NotFoundError("Builder", builder_id)
    return {"data": deleted, "meta": {"deleted": True}}
