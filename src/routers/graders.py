from __future__ import annotations

import sys
import os
from datetime import datetime
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Query
from src.services.mock_data import GRADERS, next_id
from src.models.schemas import GraderCreateRequest
from src.utils.errors import NotFoundError

router = APIRouter(prefix="/graders", tags=["graders"])


@router.get("")
def list_graders(q: Optional[str] = Query(None)):
    graders = list(GRADERS.values())

    if q:
        q_lower = q.lower()
        graders = [
            g for g in graders
            if q_lower in g["name"].lower() or q_lower in g["email"].lower()
        ]

    graders.sort(key=lambda g: g["name"])
    return {"data": graders, "meta": {"total": len(graders)}}


@router.post("", status_code=201)
def create_grader(body: GraderCreateRequest):
    grader_id = next_id("grader")
    grader = {
        "id": grader_id,
        "name": body.name,
        "email": body.email,
        "team": body.team,
        "role": body.role,
        "created_at": datetime.utcnow().isoformat(),
    }
    GRADERS[grader_id] = grader
    return {"data": grader, "meta": {}}


@router.delete("/{grader_id}")
def delete_grader(grader_id: str):
    if grader_id not in GRADERS:
        raise NotFoundError("Grader", grader_id)

    deleted = GRADERS.pop(grader_id)
    return {"data": deleted, "meta": {"deleted": True}}
