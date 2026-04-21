from __future__ import annotations

import sys
import os
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Query
from src.services import store
from src.models.schemas import GraderCreateRequest
from src.utils.errors import NotFoundError

router = APIRouter(prefix="/graders", tags=["graders"])


@router.get("")
def list_graders(q: Optional[str] = Query(None)):
    graders = store.list_graders(q)
    return {"data": graders, "meta": {"total": len(graders)}}


@router.post("", status_code=201)
def create_grader(body: GraderCreateRequest):
    grader = store.create_grader(body.name, body.email, body.team, body.role)
    return {"data": grader, "meta": {}}


@router.delete("/{grader_id}")
def delete_grader(grader_id: str):
    deleted = store.delete_grader(grader_id)
    if not deleted:
        raise NotFoundError("Grader", grader_id)
    return {"data": deleted, "meta": {"deleted": True}}
