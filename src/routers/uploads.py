from __future__ import annotations

import sys
import os
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
from src.services.mock_data import MENU_UPLOADS
from src.utils.logging import get_logger

log = get_logger("uploads")

router = APIRouter(prefix="/uploads", tags=["uploads"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB per file
MAX_FILES = 10
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}


class UrlUploadRequest(BaseModel):
    url: str


@router.post("/menu")
async def upload_menu(files: List[UploadFile] = File(...)):
    """Upload one or more menu source files (PDF, PNG, JPG) for grading."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_FILES} files allowed")

    upload_id = f"upload-{uuid.uuid4().hex[:8]}"
    all_contents: list[bytes] = []
    file_records: list[dict] = []
    primary_ext = "pdf"

    for file in files:
        if not file.filename:
            continue
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: .{ext} ({file.filename}). Use PDF, PNG, or JPG.",
            )

        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large: {file.filename} ({len(contents) / 1024 / 1024:.1f} MB). Max is 25 MB per file.",
            )

        all_contents.append(contents)
        page_count = 1
        if ext == "pdf":
            page_count = _count_pdf_pages(contents)
            primary_ext = "pdf"
        elif primary_ext != "pdf":
            primary_ext = ext

        file_records.append({
            "filename": file.filename,
            "file_type": ext,
            "file_size": len(contents),
            "page_count": page_count,
        })

    if not all_contents:
        raise HTTPException(status_code=400, detail="No valid files uploaded")

    upload_record = {
        "id": upload_id,
        "filename": file_records[0]["filename"] if len(file_records) == 1 else f"{len(file_records)} files",
        "file_type": primary_ext,
        "file_size": sum(r["file_size"] for r in file_records),
        "page_count": sum(r["page_count"] for r in file_records),
        "file_count": len(file_records),
        "files": file_records,
        "status": "uploaded",
    }

    MENU_UPLOADS[upload_id] = {
        **upload_record,
        "_contents": all_contents[0] if len(all_contents) == 1 else all_contents,
        "_all_contents": all_contents,
        "_file_types": [r["file_type"] for r in file_records],
    }

    log.info(
        "menu_uploaded",
        upload_id=upload_id,
        file_count=len(file_records),
        total_size=upload_record["file_size"],
    )

    return {
        "data": upload_record,
        "meta": {},
    }


@router.post("/menu-url")
async def upload_menu_url(body: UrlUploadRequest):
    """Fetch a menu from a website URL and store it for grading."""
    url = body.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    import httpx

    upload_id = f"upload-{uuid.uuid4().hex[:8]}"

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; MenuGradingTool/1.0)",
            })
            resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: HTTP {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")

    content_type = resp.headers.get("content-type", "")
    body_bytes = resp.content

    if len(body_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Page too large (>25 MB)")

    if "pdf" in content_type:
        file_type = "pdf"
    elif "image" in content_type:
        file_type = "png"
    else:
        file_type = "html"

    upload_record = {
        "id": upload_id,
        "filename": url[:60],
        "file_type": file_type,
        "file_size": len(body_bytes),
        "page_count": 1,
        "file_count": 1,
        "source_url": url,
        "status": "uploaded",
    }

    MENU_UPLOADS[upload_id] = {
        **upload_record,
        "_contents": body_bytes,
        "_all_contents": [body_bytes],
        "_file_types": [file_type],
    }

    log.info("menu_url_uploaded", upload_id=upload_id, url=url, size=len(body_bytes))

    return {
        "data": upload_record,
        "meta": {},
    }


@router.get("")
def list_uploads():
    """List all uploaded menu files."""
    uploads = [
        {k: v for k, v in u.items() if not k.startswith("_")}
        for u in MENU_UPLOADS.values()
    ]
    return {"data": uploads, "meta": {"total": len(uploads)}}


def _count_pdf_pages(data: bytes) -> int:
    """Rough page count by scanning for /Type /Page markers."""
    text = data.decode("latin-1", errors="replace")
    count = text.count("/Type /Page") - text.count("/Type /Pages")
    return max(1, count)
