from __future__ import annotations

import sys
import os
import asyncio
from datetime import datetime
from typing import Optional, List

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from src.services import store
from src.services.mock_data import MENU_UPLOADS
from src.services.grading_engine import compute_section_scores, compute_overall_score, collect_issues
from src.services.ai_grader import grade_menu
from src.utils.logging import get_logger

log = get_logger("ai_router")

router = APIRouter(prefix="/ai", tags=["ai"])


class GradeRequest(BaseModel):
    upload_id: str
    catalog_items: List[dict] = Field(default_factory=list)
    market: str = "US"
    merchant_name: str
    builder_name: str
    builder_email: str
    builder_team: str = ""
    builder_id: str = ""
    special_requests: str = ""


@router.post("/grade")
async def ai_grade_menu(body: GradeRequest, request: Request):
    """Run AI-powered grading: send menu + catalog to Claude, create report from results."""
    upload = MENU_UPLOADS.get(body.upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Menu upload not found. Please re-upload the menu file.")

    menu_bytes = upload.get("_contents")
    if not menu_bytes:
        raise HTTPException(status_code=400, detail="Menu file data is missing.")

    file_type = upload.get("file_type", "pdf")
    grader_email = getattr(request.state, "user_email", "unknown@squareup.com")

    try:
        result = await grade_menu(
            menu_bytes=menu_bytes,
            file_type=file_type,
            catalog_items=body.catalog_items,
            market=body.market,
            special_requests=body.special_requests,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log.error("ai_grading_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"AI grading failed: {str(e)}")

    item_grades = result.get("item_grades", [])
    ai_summary = result.get("summary", {})

    section_scores = compute_section_scores(item_grades)
    overall_score = compute_overall_score(section_scores)
    issues = collect_issues(item_grades)

    if ai_summary.get("price_discrepancies"):
        for pd in ai_summary["price_discrepancies"]:
            issues.setdefault("price_discrepancies", []).append({
                "item": pd.get("item", ""),
                "detail": f"Menu: {pd.get('menu_price', '?')} vs Catalog: {pd.get('catalog_price', '?')}",
            })
    if ai_summary.get("capitalization_errors"):
        for ce in ai_summary["capitalization_errors"]:
            issues.setdefault("capitalization_errors", []).append({
                "item": ce.get("item", ""),
                "field": "name",
                "detail": ce.get("issue", ""),
            })
    if ai_summary.get("modifier_issues"):
        for mi in ai_summary["modifier_issues"]:
            issues.setdefault("modifier_issues", []).append({
                "item": mi.get("item", ""),
                "detail": mi.get("issue", ""),
            })
    if ai_summary.get("duplicates"):
        for dup in ai_summary["duplicates"]:
            issues.setdefault("duplicates", []).append({
                "item": dup if isinstance(dup, str) else str(dup),
                "detail": "Duplicate item name detected",
            })
    if ai_summary.get("missing_from_catalog"):
        for item_name in ai_summary["missing_from_catalog"]:
            issues.setdefault("missing_items", []).append({
                "item": item_name if isinstance(item_name, str) else str(item_name),
                "detail": "Item on menu but not in catalog",
            })
    if ai_summary.get("extra_in_catalog"):
        for item_name in ai_summary["extra_in_catalog"]:
            issues.setdefault("extra_items", []).append({
                "item": item_name if isinstance(item_name, str) else str(item_name),
                "detail": "Item in catalog but not on menu",
            })

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
        "feedback_notes": "",
    })

    snap = store.create_snapshot({
        "report_id": report["id"],
        "grader_email": grader_email,
        "builder_email": body.builder_email,
        "overall_score": overall_score,
        "section_scores": section_scores,
        "issue_count": sum(len(v) for v in issues.values() if isinstance(v, list)),
        "issue_summary": {k: len(v) if isinstance(v, list) else 0 for k, v in issues.items()},
        "grade_time_ms": 0,
    })

    return {
        "data": report,
        "meta": {
            "snapshot_id": snap["id"],
            "ai_summary": ai_summary,
        },
    }


@router.get("/insights")
def get_insights():
    """Compute AI-driven insights and patterns from grading data."""
    snapshots = store.list_snapshots()
    all_scores = [float(s.get("overall_score", 0)) for s in snapshots]
    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

    issue_totals: dict[str, int] = {}
    for snap in snapshots:
        for issue_type, count in snap.get("issue_summary", {}).items():
            try:
                issue_totals[issue_type] = issue_totals.get(issue_type, 0) + int(count)
            except (ValueError, TypeError):
                pass

    top_issues = sorted(issue_totals.items(), key=lambda x: x[1], reverse=True)

    insights = [
        {
            "type": "trend",
            "title": "Average Quality Score",
            "value": avg_score,
            "description": f"Across {len(all_scores)} graded menus, the average score is {avg_score}%.",
        },
        {
            "type": "pattern",
            "title": "Most Common Issue",
            "value": top_issues[0][0].replace("_", " ").title() if top_issues else "None",
            "count": top_issues[0][1] if top_issues else 0,
            "description": (
                f"'{top_issues[0][0].replace('_', ' ').title()}' is the most frequent issue type "
                f"with {top_issues[0][1]} occurrences."
            ) if top_issues else "No issues found.",
        },
        {
            "type": "recommendation",
            "title": "Training Focus Area",
            "value": "Title Case & Capitalization",
            "description": "Capitalization errors remain the most common neatness issue. Consider a targeted training session for builders.",
        },
    ]

    return {
        "data": {
            "insights": insights,
            "issue_distribution": dict(top_issues),
        },
        "meta": {},
    }


@router.get("/rules")
def list_rules():
    return {"data": [], "meta": {"total": 0}}
