from __future__ import annotations

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter
from src.services import store
from src.services.feedback_compiler import compile_feedback, generate_email_html
from src.models.schemas import FeedbackSendRequest
from src.utils.errors import NotFoundError, AppError

router = APIRouter(prefix="/reports", tags=["feedback"])


@router.get("/{report_id}/feedback")
def preview_feedback(report_id: str):
    report = store.get_report(report_id)
    if not report:
        raise NotFoundError("Report", report_id)

    preview = compile_feedback(report)
    return {"data": preview, "meta": {}}


@router.post("/{report_id}/feedback")
def send_feedback(report_id: str, body: FeedbackSendRequest):
    report = store.get_report(report_id)
    if not report:
        raise NotFoundError("Report", report_id)

    if report["feedback_status"] == "sent":
        raise AppError(409, "Already sent", "Feedback for this report has already been sent")

    preview = compile_feedback(report)
    html = generate_email_html(preview, personal_notes=body.personal_notes)

    store.update_report(report_id, {
        "feedback_status": "sent",
        "feedback_sent_at": datetime.utcnow().isoformat(),
    })

    return {
        "data": {
            "status": "sent",
            "preview": preview,
            "html_length": len(html),
        },
        "meta": {"note": "Email send simulated (mock mode)"},
    }
