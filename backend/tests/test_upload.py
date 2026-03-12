from __future__ import annotations

import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Minimal 1x1 pixel PNG
TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00"
    b"\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00"
    b"\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_upload_png(client: TestClient) -> None:
    res = client.post(
        "/api/v1/upload/gacha",
        files={"file": ("image.png", io.BytesIO(TINY_PNG), "image/png")},
    )
    assert res.status_code == 200
    body = res.json()
    assert "url" in body
    assert body["url"].startswith("/gacha/")
    assert body["url"].endswith(".png")


def test_upload_jpg(client: TestClient) -> None:
    res = client.post(
        "/api/v1/upload/gacha",
        files={"file": ("photo.jpg", io.BytesIO(TINY_PNG), "image/jpeg")},
    )
    assert res.status_code == 200
    body = res.json()
    assert "url" in body
    assert body["url"].startswith("/gacha/")
    assert body["url"].endswith(".jpg")


def test_upload_rejects_invalid_extension(client: TestClient) -> None:
    res = client.post(
        "/api/v1/upload/gacha",
        files={"file": ("document.txt", io.BytesIO(b"hello"), "text/plain")},
    )
    assert res.status_code == 400


def test_upload_file_written_to_disk(
    client: TestClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("routers.upload.UPLOAD_DIR", tmp_path)

    res = client.post(
        "/api/v1/upload/gacha",
        files={"file": ("image.png", io.BytesIO(TINY_PNG), "image/png")},
    )
    assert res.status_code == 200

    url: str = res.json()["url"]
    filename = url.split("/gacha/")[-1]
    written_file = tmp_path / filename

    assert written_file.exists()
    assert written_file.read_bytes() == TINY_PNG


def test_upload_unique_filenames(
    client: TestClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("routers.upload.UPLOAD_DIR", tmp_path)

    res1 = client.post(
        "/api/v1/upload/gacha",
        files={"file": ("image.png", io.BytesIO(TINY_PNG), "image/png")},
    )
    res2 = client.post(
        "/api/v1/upload/gacha",
        files={"file": ("image.png", io.BytesIO(TINY_PNG), "image/png")},
    )

    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json()["url"] != res2.json()["url"]
