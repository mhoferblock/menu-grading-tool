from __future__ import annotations

import sys
import os
from datetime import datetime
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Query, Request
from src.services.mock_data import REPORTS, SNAPSHOTS, BUILDERS, next_id
from src.services.grading_engine import compute_section_scores, compute_overall_score, collect_issues
from src.models.schemas import ReportCreateRequest, ReportUpdateRequest
from src.utils.errors import NotFoundError

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
def list_reports(
    market: Optional[str] = Query(None),
    builder: Optional[str] = Query(None),
    grader: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    reports = list(REPORTS.values())

    if market:
        reports = [r for r in reports if r["market"] == market]
    if builder:
        reports = [r for r in reports if builder.lower() in r["builder_name"].lower() or builder.lower() in r["builder_email"].lower()]
    if grader:
        reports = [r for r in reports if grader.lower() in r["graded_by"].lower()]
    if status:
        reports = [r for r in reports if r["feedback_status"] == status]

    reports.sort(key=lambda r: r["created_at"], reverse=True)

    total = len(reports)
    start = (page - 1) * page_size
    end = start + page_size
    page_data = reports[start:end]

    return {
        "data": page_data,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        },
    }


@router.get("/{report_id}")
def get_report(report_id: str):
    report = REPORTS.get(report_id)
    if not report:
        raise NotFoundError("Report", report_id)
    return {"data": report, "meta": {}}


@router.post("", status_code=201)
def create_report(body: ReportCreateRequest, request: Request):
    grader_email = getattr(request.state, "user_email", "unknown@squareup.com")
    report_id = next_id("report")

    item_grades = [ig.model_dump() for ig in body.item_grades]
    section_scores = compute_section_scores(item_grades)
    overall_score = compute_overall_score(section_scores)
    issues = collect_issues(item_grades)

    report = {
        "id": report_id,
        "merchant_name": body.merchant_name,
        "market": body.market,
        "graded_by": grader_email,
        "overall_score": overall_score,
        "section_scores": section_scores,
        "item_grades": item_grades,
        "issues": issues,
        "builder_name": body.builder_name,
        "builder_email": body.builder_email,
        "builder_team": body.builder_team,
        "builder_id": body.builder_id,
        "feedback_status": "draft",
        "feedback_sent_at": None,
        "feedback_notes": body.feedback_notes,
        "created_at": datetime.utcnow().isoformat(),
    }

    REPORTS[report_id] = report

    snap_id = next_id("snapshot")
    issue_count = sum(len(v) for v in issues.values() if isinstance(v, list))
    issue_summary = {k: len(v) if isinstance(v, list) else 0 for k, v in issues.items()}

    SNAPSHOTS[snap_id] = {
        "id": snap_id,
        "report_id": report_id,
        "grader_email": grader_email,
        "builder_email": body.builder_email,
        "overall_score": overall_score,
        "section_scores": section_scores,
        "issue_count": issue_count,
        "issue_summary": issue_summary,
        "grade_time_ms": 0,
        "created_at": datetime.utcnow().isoformat(),
    }

    return {"data": report, "meta": {"snapshot_id": snap_id}}


@router.put("/{report_id}")
def update_report(report_id: str, body: ReportUpdateRequest):
    report = REPORTS.get(report_id)
    if not report:
        raise NotFoundError("Report", report_id)

    updates = body.model_dump(exclude_none=True)

    if "item_grades" in updates:
        updates["item_grades"] = [ig.model_dump() if hasattr(ig, "model_dump") else ig for ig in updates["item_grades"]]
        updates["section_scores"] = compute_section_scores(updates["item_grades"])
        updates["overall_score"] = compute_overall_score(updates["section_scores"])
        updates["issues"] = collect_issues(updates["item_grades"])

    report.update(updates)
    return {"data": report, "meta": {}}
