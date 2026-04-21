"""AI-powered menu grading using Claude."""

from __future__ import annotations

import json
import base64
import re
from typing import Optional

from src.config import settings
from src.utils.logging import get_logger

log = get_logger("ai_grader")

GRADING_SYSTEM_PROMPT = """You are an AI Menu QA Auditor responsible for parsing a menu from a PDF or image, comparing it against a Square catalog or Excel export, verifying structure, pricing, modifiers, variations, organization, and standards, and producing a graded QA report. Accuracy, completeness, and transparency are mandatory. Never assume or guess.

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
- Y = auto add, N = do not auto add

MODIFIER & VARIATION VALIDATION (CRITICAL):
- Each item must have ONLY the modifiers shown on the menu. No missing or extra modifiers.
- Modifier pricing must match menu.
- Modifier limits (min/max) must be correct.
- Nested modifiers used when required.
- Modifier sets applied to correct items.

DUPLICATE CHECK: Identify identical or near-identical item names that are not variations or intentional service-based duplicates.

PRICE MATCHING: Compare every menu price to catalog/Square price. Flag discrepancies unless special pricing was noted. Document menu price, catalog price, and item name.

SCORING RUBRIC (PER ITEM, scores are PERCENTAGES 0-100):
- NEATNESS (weight 10%): capitalization, spelling, punctuation, description quality if present. 100 = perfect, 0 = all wrong.
- ORGANIZATION (weight 30%): variations correct & ordered, modifier sets logical & alphabetized, categories & grid structure. 100 = perfect, 0 = all wrong.
- ACCURACY (weight 40%): auto-add correct, modifiers correct, no duplicates, prices & assignments correct. 100 = perfect, 0 = all wrong.
- THOROUGHNESS (weight 20%): special requests followed, judgment & problem-solving, completeness. 100 = perfect, 0 = all wrong.
- overall_score per item = (neatness * 0.10) + (organization * 0.30) + (accuracy * 0.40) + (thoroughness * 0.20)

QA VERIFICATION RULES (MANDATORY):
- NEVER make claims without complete data.
- Document total item counts from both sources.
- Verify every discrepancy in both sources before reporting.
- If uncertain, mark as UNVERIFIED.

COMPARISON WORKFLOW:
1. Extract all items from the menu (Source A) and document count.
2. List all items from the catalog (Source B) and document count.
3. Match items A to B.
4. Create lists: Matched, Missing from catalog, Extra in catalog.
5. Verify each issue with source data.
6. Report only verified issues.

You MUST respond with ONLY valid JSON (no markdown, no explanation outside JSON). Use this exact structure:

{
  "item_grades": [
    {
      "item_name": "Item Name From Catalog",
      "category_name": "Category Name",
      "neatness": 85,
      "organization": 90,
      "accuracy": 70,
      "thoroughness": 95,
      "overall_score": 82,
      "issues": ["Price: menu $5.50 vs catalog $5.75", "Missing size modifiers for Coffee"]
    }
  ],
  "summary": {
    "total_items_menu": 45,
    "total_items_catalog": 42,
    "matched_items": 40,
    "missing_from_catalog": ["Item A", "Item B"],
    "extra_in_catalog": ["Item C"],
    "duplicates": ["Duplicate Item Name"],
    "price_discrepancies": [
      {"item": "Latte", "menu_price": "$5.50", "catalog_price": "$5.75"}
    ],
    "capitalization_errors": [
      {"item": "espresso shot", "issue": "Should be 'Espresso Shot'"}
    ],
    "modifier_issues": [
      {"item": "Coffee", "issue": "Missing size modifiers (Small, Medium, Large)"}
    ],
    "special_request_compliance": "All special requests met" 
  }
}

Grade EVERY item in the catalog. Do not skip items. Each item must have scores and an issues array (empty array if no issues). Be specific in issue descriptions."""


def _parse_json_response(text: str) -> dict:
    """Extract JSON from Claude's response, handling markdown code blocks."""
    text = text.strip()
    md_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if md_match:
        text = md_match.group(1).strip()
    return json.loads(text)


async def grade_menu(
    menu_bytes: bytes,
    file_type: str,
    catalog_items: list[dict],
    market: str,
    special_requests: str = "",
) -> dict:
    """Send menu + catalog to Claude for AI-powered grading.
    
    Returns dict with 'item_grades' and 'summary' keys.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError(
            "ANTHROPIC_API_KEY is not configured. "
            "Set it in Databricks App environment variables to enable AI grading."
        )

    try:
        from anthropic import Anthropic
    except ImportError:
        raise ValueError("anthropic package is not installed")

    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    content: list[dict] = []

    media_map = {
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
    }
    media_type = media_map.get(file_type, "application/pdf")
    b64_data = base64.standard_b64encode(menu_bytes).decode("utf-8")

    if file_type == "pdf":
        content.append({
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": b64_data,
            },
        })
    else:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": b64_data,
            },
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
            "Grade every catalog item. Return ONLY valid JSON."
        ),
    })

    log.info(
        "calling_claude",
        file_type=file_type,
        catalog_items=len(catalog_items),
        market=market,
        file_size_kb=round(len(menu_bytes) / 1024, 1),
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=16384,
        system=GRADING_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    response_text = response.content[0].text
    log.info("claude_response_received", length=len(response_text))

    result = _parse_json_response(response_text)

    if "item_grades" not in result:
        raise ValueError("Claude response missing 'item_grades' key")

    for grade in result["item_grades"]:
        for field in ("neatness", "organization", "accuracy", "thoroughness"):
            grade[field] = max(0, min(100, float(grade.get(field, 80))))
        n = grade["neatness"]
        o = grade["organization"]
        a = grade["accuracy"]
        t = grade["thoroughness"]
        grade["overall_score"] = round(n * 0.10 + o * 0.30 + a * 0.40 + t * 0.20, 1)
        if "issues" not in grade:
            grade["issues"] = []

    log.info("grading_complete", items_graded=len(result["item_grades"]))
    return result
