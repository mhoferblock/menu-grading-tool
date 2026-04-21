from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter
from src.services.quality_tracker import (
    compute_all_grader_metrics,
    compute_grader_metrics,
    compute_all_builder_metrics,
    compute_team_dashboard,
)

router = APIRouter(prefix="/quality", tags=["quality"])


@router.get("/graders")
def list_grader_metrics():
    metrics = compute_all_grader_metrics()
    return {"data": metrics, "meta": {"total": len(metrics)}}


@router.get("/graders/{email}")
def get_grader_profile(email: str):
    metrics = compute_grader_metrics(email)
    return {"data": metrics, "meta": {}}


@router.get("/builders")
def list_builder_metrics():
    metrics = compute_all_builder_metrics()
    return {"data": metrics, "meta": {"total": len(metrics)}}


@router.get("/team")
def team_dashboard():
    data = compute_team_dashboard()
    return {"data": data, "meta": {}}
