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

QA VERIFICATION RULES (MANDATORY — READ THIS CAREFULLY):
- NEVER claim an issue exists unless you can point to SPECIFIC evidence in the catalog data.
- Before reporting ANY issue, you MUST verify it against the actual catalog JSON provided. Re-read the relevant catalog entry before finalizing each issue.
- If an item has variations in the catalog JSON (multiple entries with size names under it, or a "variations" field), do NOT claim it is "listed as separate items" — it IS using variations.
- If an item has modifiers/modifier sets in the catalog JSON, do NOT claim the modifier is "missing" — verify the modifier list in the JSON first.
- PRECISION OVER RECALL: It is FAR better to miss a real issue than to report a false issue. Only report issues you are 100% certain about based on the data provided.
- If you are less than 90% confident an issue exists, do NOT report it.
- If uncertain about anything, give the builder the benefit of the doubt and do NOT flag it.
- FALSE POSITIVES ARE UNACCEPTABLE. Every reported issue must be verifiable in the source data.
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

CRITICAL — IGNORE THESE (NOT issues):
- Square catalog handles/slugs (strings starting with # like #brownie- or #cake-pop-chocolate-cake-po) are internal system identifiers, NOT display names. Do NOT flag them for capitalization, title case, or formatting.
- Token/handle columns from the catalog export are machine-generated. Only evaluate the human-readable item_name/display name field.
- If an item name starts with '#' and uses kebab-case, it is a catalog handle — skip it entirely or use the display name from another field.

For EACH catalog item, provide:
- A neatness score (0-100)
- A list of neatness-specific issues found (empty array if none)
- Each issue should be a SINGLE clear sentence describing ONE specific problem

Respond with ONLY valid JSON (no markdown, no explanation). Use this structure:
{
  "items": [
    {"item_name": "Item Name", "category_name": "Category", "score": 85, "issues": ["Title case error: 'espresso' should be 'Espresso'"]}
  ]
}

Grade EVERY catalog item. Do not skip any."""

ORGANIZATION_PROMPT = _SHARED_CONTEXT + """
YOU ARE THE ORGANIZATION AGENT. Your ONLY job is to evaluate organization for every catalog item.

IMPORTANT: Catalog handles/slugs (strings starting with # like #brownie- or #cake-pop-chocolate-cake-po) are internal system identifiers. Use the human-readable display name, not the handle.

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

CRITICAL ANTI-HALLUCINATION RULES FOR ORGANIZATION:
1. VARIATIONS vs SEPARATE ITEMS: Before claiming "should use variations instead of separate items", look at the ACTUAL catalog JSON structure. If the item appears ONCE with multiple variation entries (e.g., Small, Medium, Large under it), then variations ARE being used correctly. Do NOT report this as an issue.
2. MODIFIER PRESENCE: Before claiming a modifier is "missing", search the catalog JSON for that item's modifier sets. If the modifier exists in the data, do NOT claim it is missing.
3. When in doubt, give a PASSING score. It is better to miss a real issue than to fabricate one.

For EACH catalog item, provide:
- An organization score (0-100)
- A list of organization-specific issues found (empty array if none)
- ONLY report issues you are 100% certain about after verifying against the catalog JSON

Respond with ONLY valid JSON (no markdown, no explanation). Use this structure:
{
  "items": [
    {"item_name": "Item Name", "category_name": "Category", "score": 90, "issues": ["Variation order incorrect: Large before Small"]}
  ]
}

Grade EVERY catalog item. Do not skip any."""

ACCURACY_PROMPT = _SHARED_CONTEXT + """
YOU ARE THE ACCURACY AGENT. Your ONLY job is to evaluate accuracy for every catalog item.

IMPORTANT: Catalog handles/slugs (strings starting with # like #brownie- or #cake-pop-chocolate-cake-po) are internal system identifiers. Use the human-readable display name, not the handle.

ACCURACY CRITERIA (score 0-100):
- Price matching: compare EVERY menu price to catalog/Square price, flag discrepancies
- Auto-add correctness per market rules
- Modifier correctness: each item must have ONLY the modifiers shown on the menu (no missing, no extra)
- Modifier pricing must match menu
- Duplicate detection: flag identical or near-identical item names that are NOT intentional
- Prices and assignments correct

PRICE MATCHING IS CRITICAL: Document menu price, catalog price, and item name for EVERY discrepancy.

DUPLICATE CHECK: Identify identical or near-identical item names that are not variations or intentional service-based duplicates.

CRITICAL ANTI-HALLUCINATION RULES FOR ACCURACY:
1. MODIFIER VERIFICATION: Before claiming a modifier is "missing" from an item, search the catalog JSON for that specific item and list its actual modifiers. If the modifier IS in the JSON data, do NOT claim it is missing.
2. PRICE VERIFICATION: Only report a price discrepancy if you can cite BOTH the exact menu price AND the exact catalog price, and they are genuinely different. If you cannot read the price clearly from the menu, do NOT guess.
3. DUPLICATE VERIFICATION: Items with different variation sizes (Small, Medium, Large) under the same parent item are NOT duplicates. Only flag true duplicates — identical names with no structural reason for both existing.
4. When uncertain, do NOT report the issue. False positives are worse than missed issues.

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

IMPORTANT: Catalog handles/slugs (strings starting with # like #brownie- or #cake-pop-chocolate-cake-po) are internal system identifiers. Use the human-readable display name, not the handle.

THOROUGHNESS CRITERIA (score 0-100):
- Completeness: are all menu items present in the catalog?
- Special request compliance (if any special requests were noted)
- Judgment and problem-solving: are there creative or contextual issues?
- All modifiers from menu accounted for
- All variations from menu accounted for
- Overall build quality assessment

CRITICAL ANTI-HALLUCINATION RULES FOR THOROUGHNESS:
1. MISSING ITEMS: Only claim an item is "missing from catalog" if you carefully searched all catalog entries and it genuinely does not appear.
2. MISSING MODIFIERS: Only claim a modifier is "missing" if you verified the item's modifier sets in the catalog JSON and the modifier truly does not exist there.
3. MISSING VARIATIONS: Only claim variations are "missing" if the catalog JSON shows the item has fewer variations than the menu shows.
4. When in doubt, give the builder a PASSING score. False positives undermine trust in the QA system.

For EACH catalog item, provide:
- A thoroughness score (0-100)
- A list of thoroughness-specific issues found (empty array if none)
- ONLY report issues you are 100% certain about

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
    menu_bytes: bytes | list[bytes],
    file_type: str | list[str],
    catalog_items: list[dict],
    market: str,
    special_requests: str,
) -> list[dict]:
    """Build the shared content blocks (menu files + catalog text) reused by every agent call.

    Supports single or multiple menu files.
    """
    content: list[dict] = []

    bytes_list = menu_bytes if isinstance(menu_bytes, list) else [menu_bytes]
    types_list = file_type if isinstance(file_type, list) else [file_type]

    if len(types_list) < len(bytes_list):
        types_list = types_list + [types_list[-1]] * (len(bytes_list) - len(types_list))

    for i, (mbytes, ftype) in enumerate(zip(bytes_list, types_list)):
        if ftype == "html":
            text_content = mbytes.decode("utf-8", errors="replace")[:50000]
            content.append({
                "type": "text",
                "text": f"MENU SOURCE (webpage HTML, file {i + 1} of {len(bytes_list)}):\n{text_content}",
            })
        else:
            media_type = MEDIA_MAP.get(ftype, "application/pdf")
            b64_data = base64.standard_b64encode(mbytes).decode("utf-8")
            if ftype == "pdf":
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
            "HOW TO READ THIS CATALOG DATA:\n"
            "- Each top-level object is ONE catalog item.\n"
            "- If an item has a 'variations' array, those are its SIZE/TYPE variations "
            "(e.g., Small, Medium, Large). The item is ALREADY using variations — do NOT "
            "claim it should 'use variations instead of separate items'.\n"
            "- If an item has a 'modifier_sets' or 'modifiers' array, those are its modifiers. "
            "Check this array BEFORE claiming any modifier is missing.\n"
            "- Items with names like 'Sundae Small' and 'Sundae Large' as separate top-level "
            "items ARE separate items. But if 'Small' and 'Large' appear under a single "
            "'Sundae' item's variations array, it is ONE item with variations.\n\n"
            f"MARKET: {market}\n"
            f"SPECIAL REQUESTS: {special_requests or 'None'}\n\n"
            f"There are {len(bytes_list)} menu source file(s) above. "
            "Analyze ALL of them against this catalog. "
            "Grade every catalog item for your assigned dimension. Return ONLY valid JSON.\n\n"
            "REMINDER: Do NOT report issues unless you are 100% certain after verifying "
            "against the catalog JSON above. False positives are unacceptable."
        ),
    })
    return content


def _normalize_item_name(name: str) -> str:
    """Lowercase + strip for fuzzy matching item names across passes."""
    return name.strip().lower()


def _extract_issue_key(text: str) -> str:
    """Extract a canonical key from an issue string for deduplication.

    Maps variations like:
      "Should be Brownie in Title Case"
      "Title case error: brownie should be Brownie"
      "Not in Title Case"
    all to the same key when they reference the same item.
    """
    t = text.strip().lower()
    t = re.sub(r"\[(?:confirmed|likely|potential)\]\s*", "", t)
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    words = set(t.split())
    noise = {"should", "be", "is", "the", "a", "an", "in", "not", "error", "case", "title", "it"}
    key_words = sorted(words - noise)
    return " ".join(key_words) if key_words else t


def _fuzzy_issue_match(a: str, b: str) -> bool:
    """Check if two issue strings are describing the same problem."""
    na = a.strip().lower()
    nb = b.strip().lower()
    if na == nb:
        return True
    shorter, longer = (na, nb) if len(na) <= len(nb) else (nb, na)
    if len(shorter) > 10 and shorter in longer:
        return True
    ka = _extract_issue_key(a)
    kb = _extract_issue_key(b)
    if ka and kb and ka == kb:
        return True
    if ka and kb:
        sa = set(ka.split())
        sb = set(kb.split())
        if sa and sb:
            overlap = len(sa & sb) / max(len(sa), len(sb))
            if overlap >= 0.6:
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
                    # Drop "potential" (1-of-3) issues — too unreliable
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
            clean = issue_text.replace("[likely] ", "")
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
