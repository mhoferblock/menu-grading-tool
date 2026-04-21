from __future__ import annotations

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter
from src.services.mock_data import AI_CORRECTIONS, AI_RULES, SNAPSHOTS, next_id
from src.models.schemas import AICorrectionRequest

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/insights")
def get_insights():
    """Compute AI-driven insights and patterns from grading data."""
    all_scores = [s["overall_score"] for s in SNAPSHOTS.values()]
    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

    issue_totals: dict[str, int] = {}
    for snap in SNAPSHOTS.values():
        for issue_type, count in snap.get("issue_summary", {}).items():
            issue_totals[issue_type] = issue_totals.get(issue_type, 0) + count

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
            "description": f"'{top_issues[0][0].replace('_', ' ').title()}' is the most frequent issue type with {top_issues[0][1]} occurrences." if top_issues else "No issues found.",
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
            "rules_count": len(AI_RULES),
            "corrections_count": len(AI_CORRECTIONS),
        },
        "meta": {},
    }


@router.get("/rules")
def list_rules():
    return {"data": AI_RULES, "meta": {"total": len(AI_RULES)}}


@router.post("/corrections", status_code=201)
def submit_correction(body: AICorrectionRequest):
    correction = {
        "id": next_id("correction"),
        "report_id": body.report_id,
        "item_name": body.item_name,
        "field": body.field,
        "original_value": body.original_value,
        "corrected_value": body.corrected_value,
        "reason": body.reason,
        "submitted_by": "unknown@squareup.com",
        "created_at": datetime.utcnow().isoformat(),
    }
    AI_CORRECTIONS.append(correction)
    return {"data": correction, "meta": {}}
