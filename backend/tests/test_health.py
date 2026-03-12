from __future__ import annotations

from fastapi.testclient import TestClient


def test_root_returns_ok(client: TestClient) -> None:
    res = client.get("/")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["docs"] == "/docs"
