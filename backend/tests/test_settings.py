from __future__ import annotations

from fastapi.testclient import TestClient


def test_get_default(client: TestClient) -> None:
    res = client.get("/api/v1/settings/")
    assert res.status_code == 200
    body = res.json()
    assert body["manual_balance"] == 0.0
    assert isinstance(body["id"], int)


def test_update(client: TestClient) -> None:
    res = client.patch("/api/v1/settings/", json={"manual_balance": 1500.0})
    assert res.status_code == 200
    assert res.json()["manual_balance"] == 1500.0


def test_get_after_update(client: TestClient) -> None:
    client.patch("/api/v1/settings/", json={"manual_balance": 2000.0})
    res = client.get("/api/v1/settings/")
    assert res.json()["manual_balance"] == 2000.0


def test_partial_update_no_fields(client: TestClient) -> None:
    client.patch("/api/v1/settings/", json={"manual_balance": 500.0})
    res = client.patch("/api/v1/settings/", json={})
    assert res.json()["manual_balance"] == 500.0
