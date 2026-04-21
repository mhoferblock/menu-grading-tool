"""Persistent store backed by Delta Lake tables."""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Optional

from src.services import db
from src.config import settings
from src.utils.logging import get_logger

log = get_logger("store")

CATALOG = settings.DATABRICKS_CATALOG
SCHEMA = settings.DATABRICKS_SCHEMA
FQN = f"{CATALOG}.{SCHEMA}"


def init_tables():
    """Create schema and tables if they don't exist."""
    db.execute_ddl(f"CREATE SCHEMA IF NOT EXISTS {FQN}")

    db.execute_ddl(f"""
        CREATE TABLE IF NOT EXISTS {FQN}.builders (
            id STRING NOT NULL,
            name STRING NOT NULL,
            email STRING NOT NULL,
            team STRING,
            created_at STRING
        ) USING DELTA
    """)

    db.execute_ddl(f"""
        CREATE TABLE IF NOT EXISTS {FQN}.graders (
            id STRING NOT NULL,
            name STRING NOT NULL,
            email STRING NOT NULL,
            team STRING,
            role STRING,
            created_at STRING
        ) USING DELTA
    """)

    db.execute_ddl(f"""
        CREATE TABLE IF NOT EXISTS {FQN}.reports (
            id STRING NOT NULL,
            merchant_name STRING NOT NULL,
            market STRING,
            graded_by STRING,
            overall_score DOUBLE,
            section_scores STRING,
            item_grades STRING,
            issues STRING,
            builder_name STRING,
            builder_email STRING,
            builder_team STRING,
            builder_id STRING,
            feedback_status STRING,
            feedback_sent_at STRING,
            feedback_notes STRING,
            created_at STRING
        ) USING DELTA
    """)

    db.execute_ddl(f"""
        CREATE TABLE IF NOT EXISTS {FQN}.snapshots (
            id STRING NOT NULL,
            report_id STRING,
            grader_email STRING,
            builder_email STRING,
            overall_score DOUBLE,
            section_scores STRING,
            issue_count INT,
            issue_summary STRING,
            grade_time_ms INT,
            created_at STRING
        ) USING DELTA
    """)

    log.info("tables_initialized", schema=FQN)


def _next_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _json_col(val) -> str:
    """Serialize a dict/list to JSON string for storage."""
    if val is None:
        return "{}"
    if isinstance(val, str):
        return val
    return json.dumps(val)


def _parse_json(val) -> dict | list:
    """Parse a JSON string from storage."""
    if val is None:
        return {}
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return {}


# ---------------------------------------------------------------------------
# Builders
# ---------------------------------------------------------------------------

def list_builders(q: Optional[str] = None) -> list[dict]:
    rows = db.execute_sql(f"SELECT * FROM {FQN}.builders ORDER BY name")
    if q:
        q_lower = q.lower()
        rows = [r for r in rows if q_lower in (r.get("name") or "").lower() or q_lower in (r.get("email") or "").lower()]
    return rows


def get_builder(builder_id: str) -> Optional[dict]:
    rows = db.execute_sql(f"SELECT * FROM {FQN}.builders WHERE id = :id", {"id": builder_id})
    return rows[0] if rows else None


def create_builder(name: str, email: str, team: Optional[str] = None) -> dict:
    bid = _next_id("builder")
    now = datetime.utcnow().isoformat()
    db.execute_sql(
        f"INSERT INTO {FQN}.builders (id, name, email, team, created_at) VALUES (:id, :name, :email, :team, :created_at)",
        {"id": bid, "name": name, "email": email, "team": team or "", "created_at": now},
    )
    return {"id": bid, "name": name, "email": email, "team": team or "", "created_at": now}


def delete_builder(builder_id: str) -> Optional[dict]:
    existing = get_builder(builder_id)
    if not existing:
        return None
    db.execute_sql(f"DELETE FROM {FQN}.builders WHERE id = :id", {"id": builder_id})
    return existing


# ---------------------------------------------------------------------------
# Graders
# ---------------------------------------------------------------------------

def list_graders(q: Optional[str] = None) -> list[dict]:
    rows = db.execute_sql(f"SELECT * FROM {FQN}.graders ORDER BY name")
    if q:
        q_lower = q.lower()
        rows = [r for r in rows if q_lower in (r.get("name") or "").lower() or q_lower in (r.get("email") or "").lower()]
    return rows


def get_grader(grader_id: str) -> Optional[dict]:
    rows = db.execute_sql(f"SELECT * FROM {FQN}.graders WHERE id = :id", {"id": grader_id})
    return rows[0] if rows else None


def create_grader(name: str, email: str, team: Optional[str] = None, role: str = "grader") -> dict:
    gid = _next_id("grader")
    now = datetime.utcnow().isoformat()
    db.execute_sql(
        f"INSERT INTO {FQN}.graders (id, name, email, team, role, created_at) VALUES (:id, :name, :email, :team, :role, :created_at)",
        {"id": gid, "name": name, "email": email, "team": team or "", "role": role, "created_at": now},
    )
    return {"id": gid, "name": name, "email": email, "team": team or "", "role": role, "created_at": now}


def delete_grader(grader_id: str) -> Optional[dict]:
    existing = get_grader(grader_id)
    if not existing:
        return None
    db.execute_sql(f"DELETE FROM {FQN}.graders WHERE id = :id", {"id": grader_id})
    return existing


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

def list_reports(market=None, builder=None, grader=None, status=None, page=1, page_size=20) -> tuple[list[dict], int]:
    rows = db.execute_sql(f"SELECT * FROM {FQN}.reports ORDER BY created_at DESC")

    for r in rows:
        r["section_scores"] = _parse_json(r.get("section_scores"))
        r["item_grades"] = _parse_json(r.get("item_grades"))
        r["issues"] = _parse_json(r.get("issues"))
        if r.get("overall_score") is not None:
            try:
                r["overall_score"] = float(r["overall_score"])
            except (ValueError, TypeError):
                pass

    if market:
        rows = [r for r in rows if r.get("market") == market]
    if builder:
        bl = builder.lower()
        rows = [r for r in rows if bl in (r.get("builder_name") or "").lower() or bl in (r.get("builder_email") or "").lower()]
    if grader:
        gl = grader.lower()
        rows = [r for r in rows if gl in (r.get("graded_by") or "").lower()]
    if status:
        rows = [r for r in rows if r.get("feedback_status") == status]

    total = len(rows)
    start = (page - 1) * page_size
    return rows[start : start + page_size], total


def get_report(report_id: str) -> Optional[dict]:
    rows = db.execute_sql(f"SELECT * FROM {FQN}.reports WHERE id = :id", {"id": report_id})
    if not rows:
        return None
    r = rows[0]
    r["section_scores"] = _parse_json(r.get("section_scores"))
    r["item_grades"] = _parse_json(r.get("item_grades"))
    r["issues"] = _parse_json(r.get("issues"))
    if r.get("overall_score") is not None:
        try:
            r["overall_score"] = float(r["overall_score"])
        except (ValueError, TypeError):
            pass
    return r


def create_report(data: dict) -> dict:
    rid = _next_id("report")
    now = datetime.utcnow().isoformat()
    report = {
        "id": rid,
        "merchant_name": data.get("merchant_name", ""),
        "market": data.get("market", ""),
        "graded_by": data.get("graded_by", ""),
        "overall_score": data.get("overall_score", 0),
        "section_scores": data.get("section_scores", {}),
        "item_grades": data.get("item_grades", []),
        "issues": data.get("issues", {}),
        "builder_name": data.get("builder_name", ""),
        "builder_email": data.get("builder_email", ""),
        "builder_team": data.get("builder_team", ""),
        "builder_id": data.get("builder_id", ""),
        "feedback_status": "draft",
        "feedback_sent_at": None,
        "feedback_notes": data.get("feedback_notes"),
        "created_at": now,
    }
    db.execute_sql(
        f"""INSERT INTO {FQN}.reports
        (id, merchant_name, market, graded_by, overall_score, section_scores,
         item_grades, issues, builder_name, builder_email, builder_team, builder_id,
         feedback_status, feedback_notes, created_at)
        VALUES (:id, :merchant_name, :market, :graded_by, :overall_score, :section_scores,
                :item_grades, :issues, :builder_name, :builder_email, :builder_team, :builder_id,
                :feedback_status, :feedback_notes, :created_at)""",
        {
            "id": rid,
            "merchant_name": report["merchant_name"],
            "market": report["market"],
            "graded_by": report["graded_by"],
            "overall_score": report["overall_score"],
            "section_scores": _json_col(report["section_scores"]),
            "item_grades": _json_col(report["item_grades"]),
            "issues": _json_col(report["issues"]),
            "builder_name": report["builder_name"],
            "builder_email": report["builder_email"],
            "builder_team": report["builder_team"],
            "builder_id": report["builder_id"],
            "feedback_status": report["feedback_status"],
            "feedback_notes": report["feedback_notes"] or "",
            "created_at": now,
        },
    )
    return report


def update_report(report_id: str, updates: dict) -> Optional[dict]:
    existing = get_report(report_id)
    if not existing:
        return None

    set_clauses = []
    params = {"id": report_id}
    for key, val in updates.items():
        if key == "id":
            continue
        if key in ("section_scores", "item_grades", "issues"):
            val = _json_col(val)
        params[key] = val if val is not None else ""
        set_clauses.append(f"{key} = :{key}")

    if set_clauses:
        sql = f"UPDATE {FQN}.reports SET {', '.join(set_clauses)} WHERE id = :id"
        db.execute_sql(sql, params)

    return get_report(report_id)


# ---------------------------------------------------------------------------
# Snapshots
# ---------------------------------------------------------------------------

def create_snapshot(data: dict) -> dict:
    sid = _next_id("snapshot")
    now = datetime.utcnow().isoformat()
    snap = {**data, "id": sid, "created_at": now}
    db.execute_sql(
        f"""INSERT INTO {FQN}.snapshots
        (id, report_id, grader_email, builder_email, overall_score,
         section_scores, issue_count, issue_summary, grade_time_ms, created_at)
        VALUES (:id, :report_id, :grader_email, :builder_email, :overall_score,
                :section_scores, :issue_count, :issue_summary, :grade_time_ms, :created_at)""",
        {
            "id": sid,
            "report_id": snap.get("report_id", ""),
            "grader_email": snap.get("grader_email", ""),
            "builder_email": snap.get("builder_email", ""),
            "overall_score": snap.get("overall_score", 0),
            "section_scores": _json_col(snap.get("section_scores", {})),
            "issue_count": snap.get("issue_count", 0),
            "issue_summary": _json_col(snap.get("issue_summary", {})),
            "grade_time_ms": snap.get("grade_time_ms", 0),
            "created_at": now,
        },
    )
    return snap


def list_snapshots() -> list[dict]:
    rows = db.execute_sql(f"SELECT * FROM {FQN}.snapshots ORDER BY created_at DESC")
    for r in rows:
        r["section_scores"] = _parse_json(r.get("section_scores"))
        r["issue_summary"] = _parse_json(r.get("issue_summary"))
    return rows


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

def seed_if_empty():
    """Insert default seed data if tables are empty."""
    builders = list_builders()
    if not builders:
        log.info("seeding_builders")
        for name, email, team in [
            ("Carlos Zamora", "carlos.zamora@bpofit.com", "MNL"),
            ("Priya Sharma", "priya.sharma@bpofit.com", "MNL"),
            ("James Mitchell", "james.mitchell@squareup.com", "GT"),
            ("Sofia Reyes", "sofia.reyes@bpofit.com", "MNL"),
            ("Alex Chen", "alex.chen@squareup.com", "GT"),
        ]:
            create_builder(name, email, team)

    graders = list_graders()
    if not graders:
        log.info("seeding_graders")
        for name, email, team, role in [
            ("Yuri Echeverria", "yecheverria-bpo@bpofit.com", "GT", "grader"),
            ("Sebastian Guzman", "sebastianguzman-bpo@bpofit.com", "GT", "grader"),
            ("Alyanna Cruz", "alyanna-bpo@bpofit.com", "MNL", "grader"),
            ("Randell Santos", "randell-bpo@bpofit.com", "MNL", "grader"),
            ("Mike Hofer", "mhofer@squareup.com", "GSO", "lead"),
            ("Leonel Reyes", "leonel-bpo@bpofit.com", "GT", "grader"),
        ]:
            create_grader(name, email, team, role)

    log.info("seed_complete")
