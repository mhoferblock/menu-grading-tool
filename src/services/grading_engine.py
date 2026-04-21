"""Scoring functions for each rubric category and market-specific rules."""

from __future__ import annotations

from typing import Optional, List, Dict

# Rubric weights (max points per section, total = 100)
RUBRIC = {
    "neatness": 20.0,
    "organization": 25.0,
    "accuracy": 30.0,
    "thoroughness": 25.0,
}

TITLE_CASE_EXCEPTIONS = {
    "a", "an", "the", "and", "but", "or", "for", "nor",
    "on", "at", "to", "from", "by", "in", "of", "with",
    "vs", "w/",
}

MARKET_RULES = {
    "US": {
        "tax_inclusive": False,
        "require_size_modifiers": ["coffee", "latte", "tea", "smoothie", "juice"],
        "currency": "USD",
        "currency_symbol": "$",
    },
    "EU": {
        "tax_inclusive": True,
        "require_size_modifiers": [],
        "currency": "EUR",
        "currency_symbol": "€",
    },
    "AU": {
        "tax_inclusive": True,
        "require_size_modifiers": ["coffee", "latte"],
        "currency": "AUD",
        "currency_symbol": "$",
    },
}


def validate_title_case(name: str) -> List[str]:
    """Check if item name follows title case conventions. Returns list of issues."""
    issues = []
    words = name.split()
    for i, word in enumerate(words):
        if not word:
            continue
        if word.lower() in TITLE_CASE_EXCEPTIONS and i != 0:
            continue
        if word[0].islower():
            issues.append(
                "Title case error: '%s' should be '%s'" % (word, word.capitalize())
            )
    return issues


def check_auto_add_rules(
    item_name: str, market: str, modifiers: Optional[List[str]] = None
) -> List[str]:
    """Apply market-specific auto-add-to-check rules. Returns list of issues."""
    issues = []
    rules = MARKET_RULES.get(market, MARKET_RULES["US"])
    modifiers = modifiers or []

    item_lower = item_name.lower()
    for keyword in rules.get("require_size_modifiers", []):
        if keyword in item_lower and not modifiers:
            issues.append(
                "Missing size modifiers for '%s' (%s market requires sizes)"
                % (item_name, market)
            )
            break

    return issues


def compare_prices_cents(
    listed_cents: int, source_cents: int, tolerance_cents: int = 0
) -> Optional[Dict]:
    """Compare prices in cents. Returns discrepancy dict or None if within tolerance."""
    diff = abs(listed_cents - source_cents)
    if diff > tolerance_cents:
        return {
            "listed": listed_cents,
            "source": source_cents,
            "difference_cents": diff,
            "direction": "over" if listed_cents > source_cents else "under",
        }
    return None


def score_neatness(item_grades: List[Dict]) -> Dict:
    """Score neatness: title case, formatting, descriptions."""
    if not item_grades:
        return {"score": 100.0, "earned": RUBRIC["neatness"], "max_points": RUBRIC["neatness"]}

    total = sum(g.get("neatness", 0) for g in item_grades)
    avg = total / len(item_grades)
    earned = round(avg / 100.0 * RUBRIC["neatness"], 2)
    return {"score": round(avg, 1), "earned": earned, "max_points": RUBRIC["neatness"]}


def score_organization(item_grades: List[Dict]) -> Dict:
    """Score organization: categories, ordering, modifiers."""
    if not item_grades:
        return {"score": 100.0, "earned": RUBRIC["organization"], "max_points": RUBRIC["organization"]}

    total = sum(g.get("organization", 0) for g in item_grades)
    avg = total / len(item_grades)
    earned = round(avg / 100.0 * RUBRIC["organization"], 2)
    return {"score": round(avg, 1), "earned": earned, "max_points": RUBRIC["organization"]}


def score_accuracy(item_grades: List[Dict]) -> Dict:
    """Score accuracy: prices, names, descriptions vs source."""
    if not item_grades:
        return {"score": 100.0, "earned": RUBRIC["accuracy"], "max_points": RUBRIC["accuracy"]}

    total = sum(g.get("accuracy", 0) for g in item_grades)
    avg = total / len(item_grades)
    earned = round(avg / 100.0 * RUBRIC["accuracy"], 2)
    return {"score": round(avg, 1), "earned": earned, "max_points": RUBRIC["accuracy"]}


def score_thoroughness(item_grades: List[Dict]) -> Dict:
    """Score thoroughness: completeness, all items present, modifiers."""
    if not item_grades:
        return {"score": 100.0, "earned": RUBRIC["thoroughness"], "max_points": RUBRIC["thoroughness"]}

    total = sum(g.get("thoroughness", 0) for g in item_grades)
    avg = total / len(item_grades)
    earned = round(avg / 100.0 * RUBRIC["thoroughness"], 2)
    return {"score": round(avg, 1), "earned": earned, "max_points": RUBRIC["thoroughness"]}


def compute_overall_score(section_scores: Dict) -> float:
    """Compute weighted overall score from section scores (0-100)."""
    total_earned = sum(s["earned"] for s in section_scores.values())
    total_max = sum(s["max_points"] for s in section_scores.values())
    if total_max == 0:
        return 0.0
    return round(total_earned / total_max * 100, 1)


def grade_item(item_name: str, category_name: str, market: str, **scores) -> Dict:
    """Create an ItemGrade dict from individual scores and auto-detect issues."""
    neatness = scores.get("neatness", 100.0)
    organization = scores.get("organization", 100.0)
    accuracy = scores.get("accuracy", 100.0)
    thoroughness = scores.get("thoroughness", 100.0)

    issues = []
    issues.extend(validate_title_case(item_name))
    issues.extend(check_auto_add_rules(item_name, market))

    overall = round((neatness + organization + accuracy + thoroughness) / 4.0, 1)

    return {
        "item_name": item_name,
        "category_name": category_name,
        "overall_score": overall,
        "neatness": neatness,
        "organization": organization,
        "accuracy": accuracy,
        "thoroughness": thoroughness,
        "issues": issues,
    }


def compute_section_scores(item_grades: List[Dict]) -> Dict:
    """Compute all section scores from item grades."""
    return {
        "neatness": score_neatness(item_grades),
        "organization": score_organization(item_grades),
        "accuracy": score_accuracy(item_grades),
        "thoroughness": score_thoroughness(item_grades),
    }


def collect_issues(item_grades: List[Dict]) -> Dict:
    """Aggregate issues from all item grades into categorized buckets."""
    result = {
        "price_discrepancies": [],
        "capitalization_errors": [],
        "modifier_issues": [],
        "duplicates": [],
        "missing_items": [],
        "extra_items": [],
    }

    for grade in item_grades:
        for issue_text in grade.get("issues", []):
            lower = issue_text.lower()
            if "title case" in lower or "capitaliz" in lower:
                result["capitalization_errors"].append({
                    "item": grade["item_name"],
                    "field": "name",
                    "detail": issue_text,
                })
            elif "price" in lower:
                result["price_discrepancies"].append({
                    "item": grade["item_name"],
                    "detail": issue_text,
                })
            elif "modifier" in lower or "size" in lower:
                result["modifier_issues"].append({
                    "item": grade["item_name"],
                    "detail": issue_text,
                })

    return result
