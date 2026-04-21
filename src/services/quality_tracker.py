"""Compute builder and grader quality metrics from snapshots."""

from __future__ import annotations

import sys
import os
from typing import Optional, List, Dict, Tuple

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.services.mock_data import SNAPSHOTS, BUILDERS, REPORTS


def compute_builder_metrics(builder_id: str) -> Optional[Dict]:
    """Compute quality metrics for a specific builder."""
    builder = BUILDERS.get(builder_id)
    if not builder:
        return None

    builder_email = builder["email"]
    snaps = [s for s in SNAPSHOTS.values() if s["builder_email"] == builder_email]

    if not snaps:
        return {
            "builder": builder,
            "total_menus": 0,
            "avg_score": 0.0,
            "trend": "stable",
            "trend_delta": 0.0,
            "top_issue": "N/A",
            "recent_scores": [],
        }

    snaps_sorted = sorted(snaps, key=lambda s: s["created_at"])
    scores = [s["overall_score"] for s in snaps_sorted]
    avg = round(sum(scores) / len(scores), 1)

    trend, delta = _compute_trend(scores)
    top_issue = _find_top_issue(snaps)

    return {
        "builder": builder,
        "total_menus": len(snaps),
        "avg_score": avg,
        "trend": trend,
        "trend_delta": delta,
        "top_issue": top_issue,
        "recent_scores": scores[-10:],
    }


def compute_all_builder_metrics() -> List[Dict]:
    """Compute quality metrics for all builders."""
    results = []
    for builder_id in BUILDERS:
        metrics = compute_builder_metrics(builder_id)
        if metrics and metrics["total_menus"] > 0:
            results.append(metrics)
    return sorted(results, key=lambda m: m["avg_score"], reverse=True)


def compute_grader_metrics(grader_email: str) -> Dict:
    """Compute quality metrics for a specific grader."""
    snaps = [s for s in SNAPSHOTS.values() if s["grader_email"] == grader_email]

    if not snaps:
        return {
            "grader_email": grader_email,
            "total_graded": 0,
            "avg_time_minutes": 0.0,
            "avg_score_given": 0.0,
            "override_rate": 0.0,
            "consistency": "N/A",
        }

    scores = [s["overall_score"] for s in snaps]
    times = [s["grade_time_ms"] for s in snaps]

    avg_score = round(sum(scores) / len(scores), 1)
    avg_time_ms = sum(times) / len(times)
    avg_time_min = round(avg_time_ms / 60000, 1)

    consistency = _compute_consistency(scores)

    return {
        "grader_email": grader_email,
        "total_graded": len(snaps),
        "avg_time_minutes": avg_time_min,
        "avg_score_given": avg_score,
        "override_rate": 0.0,
        "consistency": consistency,
    }


def compute_all_grader_metrics() -> List[Dict]:
    """Compute quality metrics for all graders."""
    grader_emails = set(s["grader_email"] for s in SNAPSHOTS.values())
    results = []
    for email in grader_emails:
        results.append(compute_grader_metrics(email))
    return sorted(results, key=lambda m: m["total_graded"], reverse=True)


def compute_team_dashboard() -> Dict:
    """Compute team-level dashboard data comparing GT vs MNL."""
    teams: Dict[str, List[float]] = {}
    for snap in SNAPSHOTS.values():
        builder = _find_builder_by_email(snap["builder_email"])
        if builder:
            team = builder.get("team", "Unknown")
            teams.setdefault(team, []).append(snap["overall_score"])

    team_stats = {}
    for team, scores in teams.items():
        team_stats[team] = {
            "total_menus": len(scores),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "min_score": round(min(scores), 1) if scores else 0,
            "max_score": round(max(scores), 1) if scores else 0,
        }

    all_scores = [s["overall_score"] for s in SNAPSHOTS.values()]
    return {
        "teams": team_stats,
        "overall": {
            "total_menus": len(all_scores),
            "avg_score": round(sum(all_scores) / len(all_scores), 1) if all_scores else 0,
        },
        "grader_count": len(set(s["grader_email"] for s in SNAPSHOTS.values())),
        "builder_count": len(set(s["builder_email"] for s in SNAPSHOTS.values())),
    }


def get_builder_trend(builder_id: str) -> List[Dict]:
    """Get score trend data for a builder."""
    builder = BUILDERS.get(builder_id)
    if not builder:
        return []

    snaps = [s for s in SNAPSHOTS.values() if s["builder_email"] == builder["email"]]
    snaps_sorted = sorted(snaps, key=lambda s: s["created_at"])

    return [
        {
            "date": s["created_at"],
            "score": s["overall_score"],
            "report_id": s["report_id"],
            "merchant": REPORTS.get(s["report_id"], {}).get("merchant_name", "Unknown"),
        }
        for s in snaps_sorted
    ]


def _compute_trend(scores: List[float]) -> Tuple[str, float]:
    """Determine if scores are improving, stable, or declining."""
    if len(scores) < 2:
        return "stable", 0.0

    recent = scores[-min(3, len(scores)):]
    older = scores[:max(1, len(scores) - 3)]

    recent_avg = sum(recent) / len(recent)
    older_avg = sum(older) / len(older)
    delta = round(recent_avg - older_avg, 1)

    if delta > 3:
        return "improving", delta
    if delta < -3:
        return "declining", delta
    return "stable", delta


def _compute_consistency(scores: List[float]) -> str:
    """Rate grader consistency based on score variance."""
    if len(scores) < 2:
        return "N/A"

    mean = sum(scores) / len(scores)
    variance = sum((s - mean) ** 2 for s in scores) / len(scores)
    std_dev = variance ** 0.5

    if std_dev < 3:
        return "Very High"
    if std_dev < 6:
        return "High"
    if std_dev < 10:
        return "Medium"
    return "Low"


def _find_top_issue(snapshots: List[Dict]) -> str:
    """Find the most common issue type across snapshots."""
    issue_counts: Dict[str, int] = {}
    for snap in snapshots:
        for issue_type, count in snap.get("issue_summary", {}).items():
            if count > 0:
                issue_counts[issue_type] = issue_counts.get(issue_type, 0) + count

    if not issue_counts:
        return "None"

    top = max(issue_counts, key=issue_counts.get)
    return top.replace("_", " ").title()


def _find_builder_by_email(email: str) -> Optional[Dict]:
    for b in BUILDERS.values():
        if b["email"] == email:
            return b
    return None
