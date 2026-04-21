"""Generate a formatted PDF QA report from a GradingReport dict."""

from __future__ import annotations

import io
from datetime import datetime
from typing import Any

from fpdf import FPDF

from src.utils.logging import get_logger

log = get_logger("pdf_report")

# Brand colors (RGB)
DARK_BG = (24, 24, 27)
CARD_BG = (39, 39, 42)
WHITE = (244, 244, 245)
MUTED = (161, 161, 170)
BLUE = (59, 130, 246)
GREEN = (52, 211, 153)
AMBER = (251, 191, 36)
RED = (248, 113, 113)
BORDER = (63, 63, 70)


def _score_color(score: float) -> tuple[int, int, int]:
    if score >= 90:
        return GREEN
    if score >= 80:
        return BLUE
    if score >= 70:
        return AMBER
    return RED


def _score_label(score: float) -> str:
    if score >= 90:
        return "Excellent"
    if score >= 80:
        return "Good"
    if score >= 70:
        return "Fair"
    return "Needs Work"


def _fmt_date(iso: str) -> str:
    try:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return d.strftime("%b %d, %Y")
    except Exception:
        return iso[:10] if len(iso) >= 10 else iso


class QAReportPDF(FPDF):
    """Custom PDF layout for Menu Grading QA reports."""

    def __init__(self, report: dict):
        super().__init__()
        self.report = report
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 6, "Menu Grading Tool — QA Report", align="L")
        self.cell(0, 6, f"Generated {datetime.utcnow().strftime('%b %d, %Y %H:%M UTC')}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*BORDER)
        self.line(10, self.get_y(), self.w - 10, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*MUTED)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def generate_pdf(report: dict) -> bytes:
    """Generate a complete QA report PDF and return raw bytes."""
    r = report
    overall = float(r.get("overall_score", 0))
    section_scores = r.get("section_scores", {})
    item_grades = r.get("item_grades", [])
    issues = r.get("issues", {})

    pdf = QAReportPDF(report)
    pdf.alias_nb_pages()
    pdf.add_page()

    # ---- Title Block ----
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 12, f"QA Report: {r.get('merchant_name', 'Unknown')}", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*MUTED)
    date_str = _fmt_date(r.get("created_at", ""))
    pdf.cell(0, 6, f"Graded by {r.get('graded_by', 'N/A')} on {date_str}  |  Market: {r.get('market', 'US')}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Built by {r.get('builder_name', 'N/A')} ({r.get('builder_email', '')})  |  Team: {r.get('builder_team', 'N/A')}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    # ---- Overall Score ----
    color = _score_color(overall)
    label = _score_label(overall)

    pdf.set_font("Helvetica", "B", 48)
    pdf.set_text_color(*color)
    pdf.cell(40, 24, f"{overall:.0f}", new_x="END")

    pdf.set_font("Helvetica", "", 14)
    pdf.set_text_color(*MUTED)
    pdf.cell(15, 24, "/100", new_x="END")

    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(*color)
    pdf.cell(0, 24, label, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # ---- Section Scores ----
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 8, "Section Scores", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    sections = [
        ("Neatness", "neatness"),
        ("Organization", "organization"),
        ("Accuracy", "accuracy"),
        ("Thoroughness", "thoroughness"),
    ]
    for label_name, key in sections:
        sec = section_scores.get(key, {})
        earned = float(sec.get("earned", 0))
        max_pts = float(sec.get("max_points", 1))
        pct = round(earned / max_pts * 100, 1) if max_pts > 0 else 0

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(*WHITE)
        pdf.cell(35, 7, label_name)

        bar_x = pdf.get_x()
        bar_y = pdf.get_y() + 1.5
        bar_w = 90
        bar_h = 4

        pdf.set_fill_color(63, 63, 70)
        pdf.rect(bar_x, bar_y, bar_w, bar_h, style="F")

        fill_w = bar_w * (pct / 100)
        c = _score_color(pct)
        pdf.set_fill_color(*c)
        pdf.rect(bar_x, bar_y, fill_w, bar_h, style="F")

        pdf.set_x(bar_x + bar_w + 4)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*MUTED)
        pdf.cell(0, 7, f"{earned:.0f}/{max_pts:.0f}", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # ---- Issue Summary ----
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 8, "Issue Summary", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    issue_labels = [
        ("Price Mismatches", "price_discrepancies", RED),
        ("Capitalization Errors", "capitalization_errors", AMBER),
        ("Modifier Issues", "modifier_issues", AMBER),
        ("Duplicates", "duplicates", BLUE),
        ("Missing Items", "missing_items", RED),
        ("Extra Items", "extra_items", GREEN),
    ]

    col_w = (pdf.w - 20) / 3
    for i, (label_name, key, tone) in enumerate(issue_labels):
        if i > 0 and i % 3 == 0:
            pdf.ln(8)
        x = 10 + (i % 3) * col_w
        y = pdf.get_y()

        count = 0
        val = issues.get(key, [])
        if isinstance(val, list):
            count = len(val)
        elif isinstance(val, (int, float)):
            count = int(val)

        pdf.set_xy(x + 2, y)
        pdf.set_font("Helvetica", "B", 18)
        pdf.set_text_color(*tone)
        pdf.cell(col_w - 4, 10, str(count), new_x="LMARGIN")

        pdf.set_xy(x + 2, y + 9)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(*MUTED)
        pdf.cell(col_w - 4, 5, label_name, new_x="LMARGIN")

    pdf.ln(18)

    # ---- Per-Item Grades Table ----
    if item_grades:
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*WHITE)
        pdf.cell(0, 8, f"Item Grades ({len(item_grades)} items)", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        name_w = 52
        cat_w = 32
        score_w = 16
        dim_w = 12
        issue_w = pdf.w - 20 - name_w - cat_w - score_w - (dim_w * 4)

        pdf.set_fill_color(39, 39, 42)
        pdf.set_font("Helvetica", "B", 7)
        pdf.set_text_color(*MUTED)

        y_header = pdf.get_y()
        pdf.cell(name_w, 7, "ITEM", fill=True)
        pdf.cell(cat_w, 7, "CATEGORY", fill=True)
        pdf.cell(score_w, 7, "SCORE", fill=True)
        pdf.cell(dim_w, 7, "N", fill=True, align="C")
        pdf.cell(dim_w, 7, "O", fill=True, align="C")
        pdf.cell(dim_w, 7, "A", fill=True, align="C")
        pdf.cell(dim_w, 7, "T", fill=True, align="C")
        pdf.cell(issue_w, 7, "ISSUES", fill=True, new_x="LMARGIN", new_y="NEXT")

        for idx, item in enumerate(item_grades):
            if pdf.get_y() > pdf.h - 25:
                pdf.add_page()
                pdf.set_fill_color(39, 39, 42)
                pdf.set_font("Helvetica", "B", 7)
                pdf.set_text_color(*MUTED)
                pdf.cell(name_w, 7, "ITEM", fill=True)
                pdf.cell(cat_w, 7, "CATEGORY", fill=True)
                pdf.cell(score_w, 7, "SCORE", fill=True)
                pdf.cell(dim_w, 7, "N", fill=True, align="C")
                pdf.cell(dim_w, 7, "O", fill=True, align="C")
                pdf.cell(dim_w, 7, "A", fill=True, align="C")
                pdf.cell(dim_w, 7, "T", fill=True, align="C")
                pdf.cell(issue_w, 7, "ISSUES", fill=True, new_x="LMARGIN", new_y="NEXT")

            item_score = float(item.get("overall_score", 0))
            item_name = str(item.get("item_name", ""))[:30]
            cat_name = str(item.get("category_name", ""))[:18]
            item_issues = item.get("issues", [])
            issue_text = "; ".join(str(i) for i in item_issues[:3])
            if len(item_issues) > 3:
                issue_text += f" (+{len(item_issues) - 3} more)"
            issue_text = issue_text[:60]

            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(*WHITE)
            pdf.cell(name_w, 6, item_name)

            pdf.set_text_color(*MUTED)
            pdf.cell(cat_w, 6, cat_name)

            sc = _score_color(item_score)
            pdf.set_font("Helvetica", "B", 7)
            pdf.set_text_color(*sc)
            pdf.cell(score_w, 6, f"{item_score:.0f}%")

            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(*MUTED)
            pdf.cell(dim_w, 6, str(int(item.get("neatness", 0))), align="C")
            pdf.cell(dim_w, 6, str(int(item.get("organization", 0))), align="C")
            pdf.cell(dim_w, 6, str(int(item.get("accuracy", 0))), align="C")
            pdf.cell(dim_w, 6, str(int(item.get("thoroughness", 0))), align="C")

            pdf.set_text_color(161, 161, 170)
            pdf.set_font("Helvetica", "", 6)
            pdf.cell(issue_w, 6, issue_text, new_x="LMARGIN", new_y="NEXT")

        pdf.ln(6)

    # ---- Detailed Issues ----
    has_detailed = False
    for label_name, key, _ in issue_labels:
        items = issues.get(key, [])
        if not isinstance(items, list) or not items:
            continue
        if not has_detailed:
            if pdf.get_y() > pdf.h - 40:
                pdf.add_page()
            pdf.set_font("Helvetica", "B", 12)
            pdf.set_text_color(*WHITE)
            pdf.cell(0, 8, "Detailed Issues", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
            has_detailed = True

        if pdf.get_y() > pdf.h - 25:
            pdf.add_page()

        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*WHITE)
        pdf.cell(0, 6, f"{label_name} ({len(items)})", new_x="LMARGIN", new_y="NEXT")

        for entry in items[:15]:
            if pdf.get_y() > pdf.h - 15:
                pdf.add_page()
            if isinstance(entry, dict):
                item_name = entry.get("item", "")
                detail = entry.get("detail", entry.get("issue", ""))
                line = f"  {item_name}: {detail}" if item_name else f"  {detail}"
            else:
                line = f"  {entry}"
            pdf.set_font("Helvetica", "", 7)
            pdf.set_text_color(*MUTED)
            pdf.cell(0, 5, line[:120], new_x="LMARGIN", new_y="NEXT")

        if len(items) > 15:
            pdf.set_font("Helvetica", "I", 7)
            pdf.cell(0, 5, f"  ... and {len(items) - 15} more", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

    buf = io.BytesIO()
    pdf.output(buf)
    return buf.getvalue()
