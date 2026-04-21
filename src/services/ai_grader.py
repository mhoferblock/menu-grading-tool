"""AI-powered menu grading using Claude with multipass specialized agents."""

from __future__ import annotations

import asyncio
import json
import base64
import re
import statistics
from collections import defaultdict
from typing import Optional

from src.config import settings
from src.utils.logging import get_logger

log = get_logger("ai_grader")

# ---------------------------------------------------------------------------
# Shared preamble injected into every agent prompt
# ---------------------------------------------------------------------------

_SHARED_CONTEXT = """You are an AI Menu QA Auditor. You are analyzing a menu document (PDF or image) against a Square catalog export. Accuracy, completeness, and transparency are mandatory. Never assume or guess.

CORE DEFINITIONS:
- Variations = Mutually exclusive options with different prices. Ordered smallest to largest or least to most expensive. Item name must NOT appear in variation name.
- Modifiers = Optional customizations applied across variations. Required modifier sets appear first. Options are alphabetized.

GLOBAL STANDARDS:
- Title Case required for item names, category names, variation names, modifier sets, and modifier options (except of, with, and, etc.).
- Units formatted correctly (8oz, 250ml).
- Items must not contain the word 'or'.
- Context must be included in names (e.g., Chocolate Shake, not Chocolate).
- Duplicate items allowed only for different services or pricing and must be named accordingly.

AUTO-ADD TO CHECK RULES:
- US/EU = Drinks without variations or modifiers = Y
- AU = All items without variations or modifiers = Y

QA VERIFICATION RULES (MANDATORY):
- NEVER make claims without complete data.
- Verify every discrepancy in both sources before reporting.
- If uncertain, mark as UNVERIFIED.
"""

# ---------------------------------------------------------------------------
# 4 Specialized Agent Prompts
# ---------------------------------------------------------------------------

NEATNESS_PROMPT = _SHARED_CONTEXT + """
YOU ARE THE NEATNESS AGENT. Your ONLY job is to evaluate neatness for every catalog item.

NEATNESS CRITERIA (score 0-100):
- Title Case compliance for item names, category names, variation names, modifier sets, modifier options
- Spelling correctness
- Punctuation correctness
- Description quality (if descriptions are present)
- Formatting standards (units like 8oz, 250ml formatted correctly)
- No use of the word 'or' in item names
- Context included in names (e.g., 'Chocolate Shake' not just 'Chocolate')

For EACH catalog item, provide:
- A neatness score (0-100)
- A list of neatness-specific issues found (empty array if none)

Respond with ONLY valid JSON (no markdown, no explanation). Use this structure:
{
  "items": [
    {"item_name": "Item Name", "category_name": "Category", "score": 85, "issues": ["Title case error: 'espresso' should be 'Espresso'"]}
  ]
}

Grade EVERY catalog item. Do not skip any."""

ORGANIZATION_PROMPT = _SHARED_CONTEXT + """
YOU ARE THE ORGANIZATION AGENT. Your ONLY job is to evaluate organization for every catalog item.

ORGANIZATION CRITERIA (score 0-100):
- Variations are correct and ordered (smallest to largest, cheapest to most expensive)
- Item name does NOT appear in variation name
- Modifier sets are logical and alphabetized
- Required modifier sets appear before optional ones
- Categories and grid structure are logical
- Items are in appropriate categories
- Modifier limits (min/max) are correct
- Nested modifiers used when required
- Modifier sets applied to correct items

For EACH catalog item, provide:
- An organization score (0-100)
- A list of organization-specific issues found (empty array if none)

Respond with ONLY valid JSON (no markdown, no explanation). Use this structure:
{
  "items": [
    {"item_name": "Item Name", "category_name": "Category", "score": 90, "issues": ["Variation order incorrect: Large before Small"]}
  ]
}

Grade EVERY catalog item. Do not skip any."""

ACCURACY_PROMPT = _SHARED_CONTEXT + """
YOU ARE THE ACCURACY AGENT. Your ONLY job is to evaluate accuracy for every catalog item.

ACCURACY CRITERIA (score 0-100):
- Price matching: compare EVERY menu price to catalog/Square price, flag discrepancies
- Auto-add correctness per market rules
- Modifier correctness: each item must have ONLY the modifiers shown on the menu (no missing, no extra)
- Modifier pricing must match menu
- Duplicate detection: flag identical or near-identical item names that are NOT intentional
- Prices and assignments correct

PRICE MATCHING IS CRITICAL: Document menu price, catalog price, and item name for EVERY discrepancy.

DUPLICATE CHECK: Identify identical or near-identical item names that are not variations or intentional service-based duplicates.

For EACH catalog item, provide:
- An accuracy score (0-100)
- A list of accuracy-specific issues found (empty array if none)

Also provide a summary of cross-item issues:
- price_discrepancies: [{item, menu_price, catalog_price}]
- duplicates: [item names]
- missing_from_catalog: [items on menu but not in catalog]
- extra_in_catalog: [items in catalog but not on menu]

Respond with ONLY valid JSON (no markdown, no explanation). Use this structure:
{
  "items": [
    {"item_name": "Item Name", "category_name": "Category", "score": 70, "issues": ["Price: menu $5.50 vs catalog $5.75"]}
  ],
  "cross_item": {
    "price_discrepancies": [{"item": "Latte", "menu_price": "$5.50", "catalog_price": "$5.75"}],
    "duplicates": ["Duplicate Name"],
    "missing_from_catalog": ["Menu Item X"],
    "extra_in_catalog": ["Catalog Item Y"]
  }
}

Grade EVERY catalog item. Do not skip any."""

THOROUGHNESS_PROMPT = _SHARED_CONTEXT + """
YOU ARE THE THOROUGHNESS AGENT. Your ONLY job is to evaluate thoroughness for every catalog item.

THOROUGHNESS CRITERIA (score 0-100):
- Completeness: are all menu items present in the catalog?
- Special request compliance (if any special requests were noted)
- Judgment and problem-solving: are there creative or contextual issues?
- All modifiers from menu accounted for
- All variations from menu accounted for
- Overall build quality assessment

For EACH catalog item, provide:
- A thoroughness score (0-100)
- A list of thoroughness-specific issues found (empty array if none)

Also provide:
- total_items_menu: count of items extracted from the menu
- total_items_catalog: count of items in the catalog
- matched_items: count of successfully matched items
- special_request_compliance: brief assessment of special request adherence

Respond with ONLY valid JSON (no markdown, no explanation). Use this structure:
{
  "items": [
    {"item_name": "Item Name", "category_name": "Category", "score": 95, "issues": ["Missing modifier set for size options"]}
  ],
  "meta": {
    "total_items_menu": 45,
    "total_items_catalog": 42,
    "matched_items": 40,
    "special_request_compliance": "All special requests met"
  }
}

Grade EVERY catalog item. Do not skip any."""

# Map of agent name -> (prompt, score field name)
AGENTS = {
    "neatness": (NEATNESS_PROMPT, "neatness"),
    "organization": (ORGANIZATION_PROMPT, "organization"),
    "accuracy": (ACCURACY_PROMPT, "accuracy"),
    "thoroughness": (THOROUGHNESS_PROMPT, "thoroughness"),
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MEDIA_MAP = {
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
}


def _parse_json_response(text: str) -> dict:
    """Extract JSON from Claude's response, handling markdown code blocks."""
    text = text.strip()
    md_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if md_match:
        text = md_match.group(1).strip()
    return json.loads(text)


def _build_content_blocks(
    menu_bytes: bytes, file_type: str, catalog_items: list[dict],
    market: str, special_requests: str,
) -> list[dict]:
    """Build the shared content blocks (menu file + catalog text) reused by every agent call."""
    media_type = MEDIA_MAP.get(file_type, "application/pdf")
    b64_data = base64.standard_b64encode(menu_bytes).decode("utf-8")

    content: list[dict] = []
    if file_type == "pdf":
        content.append({
            "type": "document",
            "source": {"type": "base64", "media_type": media_type, "data": b64_data},
        })
    else:
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": b64_data},
        })

    catalog_text = json.dumps(catalog_items, indent=2)
    content.append({
        "type": "text",
        "text": (
            f"CATALOG DATA ({len(catalog_items)} items):\n"
            f"{catalog_text}\n\n"
            f"MARKET: {market}\n"
            f"SPECIAL REQUESTS: {special_requests or 'None'}\n\n"
            "Analyze the menu document/image above against this catalog. "
            "Grade every catalog item for your assigned dimension. Return ONLY valid JSON."
        ),
    })
    return content


def _normalize_item_name(name: str) -> str:
    """Lowercase + strip for fuzzy matching item names across passes."""
    return name.strip().lower()


def _fuzzy_issue_match(a: str, b: str) -> bool:
    """Check if two issue strings are describing the same problem."""
    na = a.strip().lower()
    nb = b.strip().lower()
    if na == nb:
        return True
    shorter, longer = (na, nb) if len(na) <= len(nb) else (nb, na)
    if len(shorter) > 10 and shorter in longer:
        return True
    return False


# ---------------------------------------------------------------------------
# Single Agent Call
# ---------------------------------------------------------------------------

async def _call_agent(
    client,
    agent_name: str,
    system_prompt: str,
    content_blocks: list[dict],
    pass_num: int,
) -> dict:
    """Make one Claude API call for a specific agent + pass number."""
    log.info("agent_call_start", agent=agent_name, pass_num=pass_num)
    try:
        response = await asyncio.to_thread(
            client.messages.create,
            model=settings.AI_MODEL,
            max_tokens=16384,
            system=system_prompt,
            messages=[{"role": "user", "content": content_blocks}],
        )
        text = response.content[0].text
        result = _parse_json_response(text)
        log.info("agent_call_done", agent=agent_name, pass_num=pass_num,
                 items=len(result.get("items", [])))
        return result
    except Exception as e:
        log.error("agent_call_failed", agent=agent_name, pass_num=pass_num, error=str(e))
        return {"items": [], "_error": str(e)}


# ---------------------------------------------------------------------------
# Score Merger
# ---------------------------------------------------------------------------

def _merge_passes(
    agent_name: str,
    score_field: str,
    pass_results: list[dict],
) -> dict[str, dict]:
    """Merge multiple pass results for one agent into per-item median scores + issue union.

    Returns {normalized_item_name: {"score": float, "issues": [{"text": str, "confidence": str}], "category_name": str}}
    """
    item_scores: dict[str, list[float]] = defaultdict(list)
    item_issues: dict[str, list[list[str]]] = defaultdict(list)
    item_category: dict[str, str] = {}

    for result in pass_results:
        for item in result.get("items", []):
            name = item.get("item_name", "")
            key = _normalize_item_name(name)
            if not key:
                continue
            score = max(0, min(100, float(item.get("score", 80))))
            item_scores[key].append(score)
            item_issues[key].append(item.get("issues", []))
            if not item_category.get(key):
                item_category[key] = item.get("category_name", "Uncategorized")

    merged: dict[str, dict] = {}
    num_passes = len(pass_results)

    for key in item_scores:
        scores = item_scores[key]
        median_score = round(statistics.median(scores), 1) if scores else 80.0

        all_issue_lists = item_issues[key]
        issue_counts: dict[str, int] = {}
        for issue_list in all_issue_lists:
            seen_in_this_pass: set[str] = set()
            for issue_text in issue_list:
                matched = False
                for existing in issue_counts:
                    if _fuzzy_issue_match(issue_text, existing) and existing not in seen_in_this_pass:
                        issue_counts[existing] += 1
                        seen_in_this_pass.add(existing)
                        matched = True
                        break
                if not matched:
                    issue_counts[issue_text] = 1
                    seen_in_this_pass.add(issue_text)

        tagged_issues = []
        for issue_text, count in issue_counts.items():
            if num_passes >= 3:
                if count >= 3:
                    confidence = "confirmed"
                elif count >= 2:
                    confidence = "likely"
                else:
                    confidence = "potential"
            else:
                confidence = "confirmed" if count == num_passes else "likely"
            tagged_issues.append({"text": issue_text, "confidence": confidence})

        merged[key] = {
            "score": median_score,
            "issues": tagged_issues,
            "category_name": item_category.get(key, "Uncategorized"),
        }

    return merged


def _merge_cross_item_data(pass_results: list[dict]) -> dict:
    """Merge cross-item summary data (from accuracy + thoroughness agents) across passes."""
    price_disc: dict[str, dict] = {}
    duplicates: set[str] = set()
    missing: set[str] = set()
    extra: set[str] = set()
    total_menu = 0
    total_catalog = 0
    matched = 0
    compliance_notes: list[str] = []

    for result in pass_results:
        cross = result.get("cross_item", {})
        meta = result.get("meta", {})

        for pd in cross.get("price_discrepancies", []):
            item = pd.get("item", "")
            if item and item not in price_disc:
                price_disc[item] = pd
        for d in cross.get("duplicates", []):
            if isinstance(d, str):
                duplicates.add(d)
        for m in cross.get("missing_from_catalog", []):
            if isinstance(m, str):
                missing.add(m)
        for e in cross.get("extra_in_catalog", []):
            if isinstance(e, str):
                extra.add(e)

        if meta.get("total_items_menu"):
            total_menu = max(total_menu, int(meta["total_items_menu"]))
        if meta.get("total_items_catalog"):
            total_catalog = max(total_catalog, int(meta["total_items_catalog"]))
        if meta.get("matched_items"):
            matched = max(matched, int(meta["matched_items"]))
        if meta.get("special_request_compliance"):
            compliance_notes.append(str(meta["special_request_compliance"]))

    return {
        "total_items_menu": total_menu,
        "total_items_catalog": total_catalog,
        "matched_items": matched,
        "missing_from_catalog": sorted(missing),
        "extra_in_catalog": sorted(extra),
        "duplicates": sorted(duplicates),
        "price_discrepancies": list(price_disc.values()),
        "special_request_compliance": compliance_notes[0] if compliance_notes else "N/A",
    }


# ---------------------------------------------------------------------------
# Multipass Orchestrator
# ---------------------------------------------------------------------------

async def grade_menu_multipass(
    menu_bytes: bytes,
    file_type: str,
    catalog_items: list[dict],
    market: str,
    special_requests: str = "",
) -> dict:
    """Run 4 specialized agents x N passes in parallel, merge results.

    Returns the same shape as the old single-pass grade_menu() for backward compatibility:
    {"item_grades": [...], "summary": {...}}
    """
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError(
            "ANTHROPIC_API_KEY is not configured. "
            "Set it in Databricks App environment variables to enable AI grading."
        )

    from anthropic import Anthropic
    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    content_blocks = _build_content_blocks(
        menu_bytes, file_type, catalog_items, market, special_requests,
    )

    num_passes = settings.AI_PASSES

    log.info(
        "multipass_start",
        agents=list(AGENTS.keys()),
        passes=num_passes,
        total_calls=len(AGENTS) * num_passes,
        catalog_items=len(catalog_items),
        market=market,
    )

    tasks = []
    task_meta = []
    for agent_name, (prompt, _score_field) in AGENTS.items():
        for pass_num in range(1, num_passes + 1):
            tasks.append(_call_agent(client, agent_name, prompt, content_blocks, pass_num))
            task_meta.append((agent_name, pass_num))

    all_results = await asyncio.gather(*tasks, return_exceptions=True)

    agent_passes: dict[str, list[dict]] = defaultdict(list)
    for i, result in enumerate(all_results):
        agent_name = task_meta[i][0]
        if isinstance(result, Exception):
            log.error("pass_exception", agent=agent_name, error=str(result))
            agent_passes[agent_name].append({"items": []})
        else:
            agent_passes[agent_name].append(result)

    merged_agents: dict[str, dict[str, dict]] = {}
    for agent_name, (_prompt, score_field) in AGENTS.items():
        merged_agents[agent_name] = _merge_passes(
            agent_name, score_field, agent_passes[agent_name],
        )

    cross_item_sources = agent_passes.get("accuracy", []) + agent_passes.get("thoroughness", [])
    cross_item = _merge_cross_item_data(cross_item_sources)

    all_item_keys: set[str] = set()
    for agent_merged in merged_agents.values():
        all_item_keys.update(agent_merged.keys())

    item_grades = []
    for key in sorted(all_item_keys):
        n_data = merged_agents["neatness"].get(key, {"score": 80, "issues": [], "category_name": "Uncategorized"})
        o_data = merged_agents["organization"].get(key, {"score": 80, "issues": [], "category_name": "Uncategorized"})
        a_data = merged_agents["accuracy"].get(key, {"score": 80, "issues": [], "category_name": "Uncategorized"})
        t_data = merged_agents["thoroughness"].get(key, {"score": 80, "issues": [], "category_name": "Uncategorized"})

        n = n_data["score"]
        o = o_data["score"]
        a = a_data["score"]
        t = t_data["score"]
        overall = round(n * 0.10 + o * 0.30 + a * 0.40 + t * 0.20, 1)

        category = n_data["category_name"] or o_data["category_name"] or a_data["category_name"] or t_data["category_name"]

        original_name = key
        for agent_merged in merged_agents.values():
            if key in agent_merged:
                for passes in agent_passes.values():
                    for p in passes:
                        for item in p.get("items", []):
                            if _normalize_item_name(item.get("item_name", "")) == key:
                                original_name = item["item_name"]
                                break

        all_issues = []
        seen_issues: set[str] = set()
        for agent_data in (n_data, o_data, a_data, t_data):
            for issue in agent_data["issues"]:
                text = issue["text"]
                if text not in seen_issues:
                    conf = issue["confidence"]
                    if conf == "confirmed":
                        all_issues.append(text)
                    elif conf == "likely":
                        all_issues.append(f"[likely] {text}")
                    else:
                        all_issues.append(f"[potential] {text}")
                    seen_issues.add(text)

        item_grades.append({
            "item_name": original_name,
            "category_name": category,
            "neatness": n,
            "organization": o,
            "accuracy": a,
            "thoroughness": t,
            "overall_score": overall,
            "issues": all_issues,
        })

    item_grades.sort(key=lambda g: g["overall_score"])

    summary = {
        **cross_item,
        "capitalization_errors": [],
        "modifier_issues": [],
        "grading_method": "multipass",
        "passes_per_agent": num_passes,
        "total_api_calls": len(AGENTS) * num_passes,
    }

    for grade in item_grades:
        for issue_text in grade["issues"]:
            clean = issue_text.replace("[likely] ", "").replace("[potential] ", "")
            lower = clean.lower()
            if "title case" in lower or "capitaliz" in lower or "spelling" in lower:
                summary["capitalization_errors"].append({"item": grade["item_name"], "issue": clean})
            elif "modifier" in lower:
                summary["modifier_issues"].append({"item": grade["item_name"], "issue": clean})

    log.info(
        "multipass_complete",
        items_graded=len(item_grades),
        total_calls=len(AGENTS) * num_passes,
    )

    return {"item_grades": item_grades, "summary": summary}


# ---------------------------------------------------------------------------
# Legacy single-pass (kept as fallback)
# ---------------------------------------------------------------------------

GRADING_SYSTEM_PROMPT = _SHARED_CONTEXT + """
SCORING RUBRIC (PER ITEM, scores are PERCENTAGES 0-100):
- NEATNESS (weight 10%): capitalization, spelling, punctuation, description quality if present.
- ORGANIZATION (weight 30%): variations correct & ordered, modifier sets logical & alphabetized, categories & grid structure.
- ACCURACY (weight 40%): auto-add correct, modifiers correct, no duplicates, prices & assignments correct.
- THOROUGHNESS (weight 20%): special requests followed, judgment & problem-solving, completeness.
- overall_score per item = (neatness * 0.10) + (organization * 0.30) + (accuracy * 0.40) + (thoroughness * 0.20)

You MUST respond with ONLY valid JSON. Use this structure:
{
  "item_grades": [
    {"item_name": "Name", "category_name": "Cat", "neatness": 85, "organization": 90, "accuracy": 70, "thoroughness": 95, "overall_score": 82, "issues": []}
  ],
  "summary": {
    "total_items_menu": 0, "total_items_catalog": 0, "matched_items": 0,
    "missing_from_catalog": [], "extra_in_catalog": [], "duplicates": [],
    "price_discrepancies": [], "capitalization_errors": [], "modifier_issues": [],
    "special_request_compliance": ""
  }
}
Grade EVERY catalog item. Do not skip any."""


async def grade_menu(
    menu_bytes: bytes,
    file_type: str,
    catalog_items: list[dict],
    market: str,
    special_requests: str = "",
) -> dict:
    """Single-pass fallback grading (kept for backward compatibility)."""
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not configured.")

    from anthropic import Anthropic
    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    content = _build_content_blocks(menu_bytes, file_type, catalog_items, market, special_requests)

    log.info("single_pass_start", catalog_items=len(catalog_items), market=market)

    response = client.messages.create(
        model=settings.AI_MODEL,
        max_tokens=16384,
        system=GRADING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    result = _parse_json_response(response.content[0].text)
    if "item_grades" not in result:
        raise ValueError("Claude response missing 'item_grades' key")

    for grade in result["item_grades"]:
        for field in ("neatness", "organization", "accuracy", "thoroughness"):
            grade[field] = max(0, min(100, float(grade.get(field, 80))))
        n, o, a, t = grade["neatness"], grade["organization"], grade["accuracy"], grade["thoroughness"]
        grade["overall_score"] = round(n * 0.10 + o * 0.30 + a * 0.40 + t * 0.20, 1)
        if "issues" not in grade:
            grade["issues"] = []

    log.info("single_pass_complete", items_graded=len(result["item_grades"]))
    return result
