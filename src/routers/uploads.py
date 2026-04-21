from __future__ import annotations

import sys
import os
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, UploadFile, File, HTTPException
from src.services.mock_data import MENU_UPLOADS
from src.utils.logging import get_logger

log = get_logger("uploads")

router = APIRouter(prefix="/uploads", tags=["uploads"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("/menu")
async def upload_menu(file: UploadFile = File(...)):
    """Upload a menu source file (PDF, PNG, JPG) for grading."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ("pdf", "png", "jpg", "jpeg"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Use PDF, PNG, or JPG.",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(contents) / 1024 / 1024:.1f} MB). Max is 25 MB.",
        )

    upload_id = f"upload-{uuid.uuid4().hex[:8]}"

    extracted_text = ""
    page_count = 0

    if ext == "pdf":
        try:
            import io
            page_count = _count_pdf_pages(contents)
            extracted_text = f"[PDF with {page_count} page(s) — text extraction requires OCR processing]"
        except Exception:
            extracted_text = "[PDF uploaded — text extraction pending]"
            page_count = 1
    else:
        extracted_text = f"[Image file uploaded — OCR extraction pending]"
        page_count = 1

    upload_record = {
        "id": upload_id,
        "filename": file.filename,
        "file_type": ext,
        "file_size": len(contents),
        "page_count": page_count,
        "extracted_text": extracted_text,
        "status": "uploaded",
    }

    MENU_UPLOADS[upload_id] = {**upload_record, "_contents": contents}

    log.info(
        "menu_uploaded",
        upload_id=upload_id,
        filename=file.filename,
        size=len(contents),
    )

    return {
        "data": upload_record,
        "meta": {},
    }


@router.get("")
def list_uploads():
    """List all uploaded menu files."""
    uploads = [
        {k: v for k, v in u.items() if k != "_contents"}
        for u in MENU_UPLOADS.values()
    ]
    return {"data": uploads, "meta": {"total": len(uploads)}}


def _count_pdf_pages(data: bytes) -> int:
    """Rough page count by scanning for /Type /Page markers."""
    text = data.decode("latin-1", errors="replace")
    count = text.count("/Type /Page") - text.count("/Type /Pages")
    return max(1, count)
