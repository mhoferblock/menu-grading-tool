from __future__ import annotations

import sys
import os
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, Query, Request
from src.services import store
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
    page_data, total = store.list_reports(
        market=market, builder=builder, grader=grader,
        status=status, page=page, page_size=page_size,
    )
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
    report = store.get_report(report_id)
    if not report:
        raise NotFoundError("Report", report_id)
    return {"data": report, "meta": {}}


@router.post("", status_code=201)
def create_report(body: ReportCreateRequest, request: Request):
    grader_email = getattr(request.state, "user_email", "unknown@squareup.com")

    item_grades = [ig.model_dump() for ig in body.item_grades]
    section_scores = compute_section_scores(item_grades)
    overall_score = compute_overall_score(section_scores)
    issues = collect_issues(item_grades)

    report = store.create_report({
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
        "feedback_notes": body.feedback_notes,
    })

    issue_count = sum(len(v) for v in issues.values() if isinstance(v, list))
    issue_summary = {k: len(v) if isinstance(v, list) else 0 for k, v in issues.items()}

    snap = store.create_snapshot({
        "report_id": report["id"],
        "grader_email": grader_email,
        "builder_email": body.builder_email,
        "overall_score": overall_score,
        "section_scores": section_scores,
        "issue_count": issue_count,
        "issue_summary": issue_summary,
        "grade_time_ms": 0,
    })

    return {"data": report, "meta": {"snapshot_id": snap["id"]}}


@router.put("/{report_id}")
def update_report(report_id: str, body: ReportUpdateRequest):
    existing = store.get_report(report_id)
    if not existing:
        raise NotFoundError("Report", report_id)

    updates = body.model_dump(exclude_none=True)

    if "item_grades" in updates:
        updates["item_grades"] = [ig.model_dump() if hasattr(ig, "model_dump") else ig for ig in updates["item_grades"]]
        updates["section_scores"] = compute_section_scores(updates["item_grades"])
        updates["overall_score"] = compute_overall_score(updates["section_scores"])
        updates["issues"] = collect_issues(updates["item_grades"])

    report = store.update_report(report_id, updates)
    return {"data": report, "meta": {}}
