"""In-memory mock data stores pre-populated with demo data."""

from datetime import datetime, timedelta

_now = datetime.utcnow()
_week_ago = _now - timedelta(days=7)
_two_weeks_ago = _now - timedelta(days=14)
_month_ago = _now - timedelta(days=30)

# ---------------------------------------------------------------------------
# Builders
# ---------------------------------------------------------------------------
BUILDERS: dict[str, dict] = {
    "builder-001": {
        "id": "builder-001",
        "name": "Carlos Zamora",
        "email": "carlos.zamora@bpofit.com",
        "team": "MNL",
        "created_at": (_now - timedelta(days=180)).isoformat(),
    },
    "builder-002": {
        "id": "builder-002",
        "name": "Priya Sharma",
        "email": "priya.sharma@bpofit.com",
        "team": "MNL",
        "created_at": (_now - timedelta(days=120)).isoformat(),
    },
    "builder-003": {
        "id": "builder-003",
        "name": "James Mitchell",
        "email": "james.mitchell@squareup.com",
        "team": "GT",
        "created_at": (_now - timedelta(days=365)).isoformat(),
    },
    "builder-004": {
        "id": "builder-004",
        "name": "Sofia Reyes",
        "email": "sofia.reyes@bpofit.com",
        "team": "MNL",
        "created_at": (_now - timedelta(days=90)).isoformat(),
    },
    "builder-005": {
        "id": "builder-005",
        "name": "Alex Chen",
        "email": "alex.chen@squareup.com",
        "team": "GT",
        "created_at": (_now - timedelta(days=200)).isoformat(),
    },
}

# ---------------------------------------------------------------------------
# Grading Reports
# ---------------------------------------------------------------------------
REPORTS: dict[str, dict] = {
    "report-001": {
        "id": "report-001",
        "merchant_name": "Artisan Coffee House",
        "market": "US",
        "graded_by": "mhofer@squareup.com",
        "overall_score": 82.5,
        "section_scores": {
            "neatness": {"score": 90.0, "earned": 18.0, "max_points": 20.0},
            "organization": {"score": 85.0, "earned": 21.25, "max_points": 25.0},
            "accuracy": {"score": 78.0, "earned": 23.4, "max_points": 30.0},
            "thoroughness": {"score": 76.0, "earned": 19.0, "max_points": 25.0},
        },
        "item_grades": [
            {
                "item_name": "Cappuccino",
                "category_name": "Hot Drinks",
                "overall_score": 95.0,
                "neatness": 100.0,
                "organization": 95.0,
                "accuracy": 90.0,
                "thoroughness": 95.0,
                "issues": [],
            },
            {
                "item_name": "Iced Matcha latte",
                "category_name": "Cold Drinks",
                "overall_score": 70.0,
                "neatness": 60.0,
                "organization": 80.0,
                "accuracy": 65.0,
                "thoroughness": 75.0,
                "issues": ["Title case error: 'latte' should be 'Latte'", "Missing size modifiers"],
            },
            {
                "item_name": "avocado toast",
                "category_name": "Food",
                "overall_score": 65.0,
                "neatness": 50.0,
                "organization": 70.0,
                "accuracy": 75.0,
                "thoroughness": 65.0,
                "issues": [
                    "Title case error: 'avocado toast' should be 'Avocado Toast'",
                    "Missing description",
                    "Price discrepancy: listed $12.00, source shows $12.50",
                ],
            },
            {
                "item_name": "Blueberry Muffin",
                "category_name": "Food",
                "overall_score": 88.0,
                "neatness": 90.0,
                "organization": 85.0,
                "accuracy": 90.0,
                "thoroughness": 87.0,
                "issues": ["Missing allergen info"],
            },
        ],
        "issues": {
            "price_discrepancies": [
                {"item": "avocado toast", "listed": 1200, "source": 1250}
            ],
            "capitalization_errors": [
                {"item": "Iced Matcha latte", "field": "name", "expected": "Iced Matcha Latte"},
                {"item": "avocado toast", "field": "name", "expected": "Avocado Toast"},
            ],
            "modifier_issues": [
                {"item": "Iced Matcha latte", "detail": "Missing size modifiers (Small, Medium, Large)"}
            ],
            "duplicates": [],
            "missing_items": [
                {"item": "Seasonal Special", "source": "website menu", "note": "Found on source but not in Square menu"}
            ],
            "extra_items": [],
        },
        "builder_name": "Carlos Zamora",
        "builder_email": "carlos.zamora@bpofit.com",
        "builder_team": "MNL",
        "builder_id": "builder-001",
        "feedback_status": "pending_review",
        "feedback_sent_at": None,
        "feedback_notes": "Good overall build with some title case issues to address.",
        "created_at": _week_ago.isoformat(),
    },
    "report-002": {
        "id": "report-002",
        "merchant_name": "Bella Napoli Pizzeria",
        "market": "US",
        "graded_by": "mhofer@squareup.com",
        "overall_score": 91.0,
        "section_scores": {
            "neatness": {"score": 95.0, "earned": 19.0, "max_points": 20.0},
            "organization": {"score": 92.0, "earned": 23.0, "max_points": 25.0},
            "accuracy": {"score": 88.0, "earned": 26.4, "max_points": 30.0},
            "thoroughness": {"score": 90.0, "earned": 22.5, "max_points": 25.0},
        },
        "item_grades": [
            {
                "item_name": "Margherita Pizza",
                "category_name": "Pizzas",
                "overall_score": 95.0,
                "neatness": 100.0,
                "organization": 95.0,
                "accuracy": 90.0,
                "thoroughness": 95.0,
                "issues": [],
            },
            {
                "item_name": "Tiramisu",
                "category_name": "Desserts",
                "overall_score": 88.0,
                "neatness": 90.0,
                "organization": 85.0,
                "accuracy": 90.0,
                "thoroughness": 87.0,
                "issues": ["Missing allergen info (contains eggs, dairy)"],
            },
        ],
        "issues": {
            "price_discrepancies": [],
            "capitalization_errors": [],
            "modifier_issues": [],
            "duplicates": [],
            "missing_items": [],
            "extra_items": [],
        },
        "builder_name": "Priya Sharma",
        "builder_email": "priya.sharma@bpofit.com",
        "builder_team": "MNL",
        "builder_id": "builder-002",
        "feedback_status": "sent",
        "feedback_sent_at": (_week_ago + timedelta(hours=2)).isoformat(),
        "feedback_notes": "Excellent build. Minor allergen labeling needed.",
        "created_at": _two_weeks_ago.isoformat(),
    },
    "report-003": {
        "id": "report-003",
        "merchant_name": "The Green Bowl",
        "market": "AU",
        "graded_by": "qa.lead@squareup.com",
        "overall_score": 74.0,
        "section_scores": {
            "neatness": {"score": 70.0, "earned": 14.0, "max_points": 20.0},
            "organization": {"score": 75.0, "earned": 18.75, "max_points": 25.0},
            "accuracy": {"score": 80.0, "earned": 24.0, "max_points": 30.0},
            "thoroughness": {"score": 68.0, "earned": 17.0, "max_points": 25.0},
        },
        "item_grades": [
            {
                "item_name": "acai bowl",
                "category_name": "Bowls",
                "overall_score": 60.0,
                "neatness": 50.0,
                "organization": 65.0,
                "accuracy": 70.0,
                "thoroughness": 55.0,
                "issues": [
                    "Title case error: 'acai bowl' should be 'Acai Bowl'",
                    "Missing modifiers for toppings",
                    "No description",
                ],
            },
        ],
        "issues": {
            "price_discrepancies": [
                {"item": "Smoothie Bowl", "listed": 1600, "source": 1495}
            ],
            "capitalization_errors": [
                {"item": "acai bowl", "field": "name", "expected": "Acai Bowl"}
            ],
            "modifier_issues": [
                {"item": "acai bowl", "detail": "Missing topping modifiers"}
            ],
            "duplicates": [
                {"items": ["Green Smoothie", "Green Smoothie Bowl"], "note": "Possible duplicate"}
            ],
            "missing_items": [],
            "extra_items": [],
        },
        "builder_name": "Carlos Zamora",
        "builder_email": "carlos.zamora@bpofit.com",
        "builder_team": "MNL",
        "builder_id": "builder-001",
        "feedback_status": "draft",
        "feedback_sent_at": None,
        "feedback_notes": None,
        "created_at": _month_ago.isoformat(),
    },
    "report-004": {
        "id": "report-004",
        "merchant_name": "Munich Biergarten",
        "market": "EU",
        "graded_by": "mhofer@squareup.com",
        "overall_score": 88.0,
        "section_scores": {
            "neatness": {"score": 92.0, "earned": 18.4, "max_points": 20.0},
            "organization": {"score": 88.0, "earned": 22.0, "max_points": 25.0},
            "accuracy": {"score": 85.0, "earned": 25.5, "max_points": 30.0},
            "thoroughness": {"score": 88.0, "earned": 22.0, "max_points": 25.0},
        },
        "item_grades": [],
        "issues": {
            "price_discrepancies": [],
            "capitalization_errors": [],
            "modifier_issues": [],
            "duplicates": [],
            "missing_items": [],
            "extra_items": [],
        },
        "builder_name": "James Mitchell",
        "builder_email": "james.mitchell@squareup.com",
        "builder_team": "GT",
        "builder_id": "builder-003",
        "feedback_status": "approved",
        "feedback_sent_at": None,
        "feedback_notes": "Solid EU build. Tax-inclusive pricing validated.",
        "created_at": (_week_ago - timedelta(days=3)).isoformat(),
    },
    "report-005": {
        "id": "report-005",
        "merchant_name": "Sakura Sushi Bar",
        "market": "US",
        "graded_by": "qa.lead@squareup.com",
        "overall_score": 95.0,
        "section_scores": {
            "neatness": {"score": 98.0, "earned": 19.6, "max_points": 20.0},
            "organization": {"score": 95.0, "earned": 23.75, "max_points": 25.0},
            "accuracy": {"score": 93.0, "earned": 27.9, "max_points": 30.0},
            "thoroughness": {"score": 94.0, "earned": 23.5, "max_points": 25.0},
        },
        "item_grades": [],
        "issues": {
            "price_discrepancies": [],
            "capitalization_errors": [],
            "modifier_issues": [],
            "duplicates": [],
            "missing_items": [],
            "extra_items": [],
        },
        "builder_name": "Alex Chen",
        "builder_email": "alex.chen@squareup.com",
        "builder_team": "GT",
        "builder_id": "builder-005",
        "feedback_status": "sent",
        "feedback_sent_at": (_two_weeks_ago + timedelta(days=1)).isoformat(),
        "feedback_notes": "Outstanding work.",
        "created_at": _two_weeks_ago.isoformat(),
    },
}

# ---------------------------------------------------------------------------
# Quality Snapshots
# ---------------------------------------------------------------------------
SNAPSHOTS: dict[str, dict] = {
    "snap-001": {
        "id": "snap-001",
        "report_id": "report-001",
        "grader_email": "mhofer@squareup.com",
        "builder_email": "carlos.zamora@bpofit.com",
        "overall_score": 82.5,
        "section_scores": REPORTS["report-001"]["section_scores"],
        "issue_count": 6,
        "issue_summary": {
            "price_discrepancies": 1,
            "capitalization_errors": 2,
            "modifier_issues": 1,
            "missing_items": 1,
            "duplicates": 0,
            "extra_items": 0,
        },
        "grade_time_ms": 342000,
        "created_at": _week_ago.isoformat(),
    },
    "snap-002": {
        "id": "snap-002",
        "report_id": "report-002",
        "grader_email": "mhofer@squareup.com",
        "builder_email": "priya.sharma@bpofit.com",
        "overall_score": 91.0,
        "section_scores": REPORTS["report-002"]["section_scores"],
        "issue_count": 1,
        "issue_summary": {
            "price_discrepancies": 0,
            "capitalization_errors": 0,
            "modifier_issues": 0,
            "missing_items": 0,
            "duplicates": 0,
            "extra_items": 0,
        },
        "grade_time_ms": 245000,
        "created_at": _two_weeks_ago.isoformat(),
    },
    "snap-003": {
        "id": "snap-003",
        "report_id": "report-003",
        "grader_email": "qa.lead@squareup.com",
        "builder_email": "carlos.zamora@bpofit.com",
        "overall_score": 74.0,
        "section_scores": REPORTS["report-003"]["section_scores"],
        "issue_count": 5,
        "issue_summary": {
            "price_discrepancies": 1,
            "capitalization_errors": 1,
            "modifier_issues": 1,
            "missing_items": 0,
            "duplicates": 1,
            "extra_items": 0,
        },
        "grade_time_ms": 410000,
        "created_at": _month_ago.isoformat(),
    },
    "snap-004": {
        "id": "snap-004",
        "report_id": "report-004",
        "grader_email": "mhofer@squareup.com",
        "builder_email": "james.mitchell@squareup.com",
        "overall_score": 88.0,
        "section_scores": REPORTS["report-004"]["section_scores"],
        "issue_count": 0,
        "issue_summary": {
            "price_discrepancies": 0,
            "capitalization_errors": 0,
            "modifier_issues": 0,
            "missing_items": 0,
            "duplicates": 0,
            "extra_items": 0,
        },
        "grade_time_ms": 198000,
        "created_at": (_week_ago - timedelta(days=3)).isoformat(),
    },
    "snap-005": {
        "id": "snap-005",
        "report_id": "report-005",
        "grader_email": "qa.lead@squareup.com",
        "builder_email": "alex.chen@squareup.com",
        "overall_score": 95.0,
        "section_scores": REPORTS["report-005"]["section_scores"],
        "issue_count": 0,
        "issue_summary": {
            "price_discrepancies": 0,
            "capitalization_errors": 0,
            "modifier_issues": 0,
            "missing_items": 0,
            "duplicates": 0,
            "extra_items": 0,
        },
        "grade_time_ms": 180000,
        "created_at": _two_weeks_ago.isoformat(),
    },
}

# ---------------------------------------------------------------------------
# AI Corrections & Rules (mock)
# ---------------------------------------------------------------------------
AI_CORRECTIONS: list[dict] = [
    {
        "id": "corr-001",
        "report_id": "report-001",
        "item_name": "Iced Matcha latte",
        "field": "name",
        "original_value": "Iced Matcha latte",
        "corrected_value": "Iced Matcha Latte",
        "reason": "Title case correction",
        "submitted_by": "mhofer@squareup.com",
        "created_at": _week_ago.isoformat(),
    },
]

AI_RULES: list[dict] = [
    {
        "id": "rule-001",
        "type": "capitalization",
        "pattern": "Words after 'Iced' should be capitalized",
        "confidence": 0.95,
        "occurrences": 23,
        "created_at": _month_ago.isoformat(),
    },
    {
        "id": "rule-002",
        "type": "modifier",
        "pattern": "US coffee items should have size modifiers (Small, Medium, Large)",
        "confidence": 0.88,
        "occurrences": 45,
        "created_at": _month_ago.isoformat(),
    },
    {
        "id": "rule-003",
        "type": "pricing",
        "pattern": "AU market prices should be tax-inclusive",
        "confidence": 0.92,
        "occurrences": 12,
        "created_at": _two_weeks_ago.isoformat(),
    },
]

# Counter for generating unique IDs
_counters = {
    "report": 5,
    "builder": 5,
    "snapshot": 5,
    "correction": 1,
}


def next_id(prefix: str) -> str:
    _counters[prefix] = _counters.get(prefix, 0) + 1
    return f"{prefix}-{_counters[prefix]:03d}"
