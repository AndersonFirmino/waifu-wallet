from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = (
    Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "gacha"
)
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/gacha")
async def upload_gacha_image(file: UploadFile) -> dict[str, str]:
    # Validate file type
    if file.filename is None:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Generate unique filename
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename

    # Ensure directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Write file
    filepath.write_bytes(content)

    return {"url": f"/gacha/{filename}"}
