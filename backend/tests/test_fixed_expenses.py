from __future__ import annotations

from fastapi.testclient import TestClient

_PAYLOAD: dict[str, object] = {
    "name": "Rent",
    "amount": 1200.0,
    "type": "fixed",
    "confidence": 100,
    "estimate": 1200.0,
}


def test_list_empty(client: TestClient) -> None:
    assert client.get("/api/v1/fixed-expenses/").json() == []


def test_create(client: TestClient) -> None:
    res = client.post("/api/v1/fixed-expenses/", json=_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Rent"
    assert body["amount"] == 1200.0
    assert isinstance(body["id"], int)


def test_list_returns_created(client: TestClient) -> None:
    client.post("/api/v1/fixed-expenses/", json=_PAYLOAD)
    assert len(client.get("/api/v1/fixed-expenses/").json()) == 1


def test_update(client: TestClient) -> None:
    created = client.post("/api/v1/fixed-expenses/", json=_PAYLOAD).json()
    res = client.put(f"/api/v1/fixed-expenses/{created['id']}", json={**_PAYLOAD, "amount": 1300.0})
    assert res.status_code == 200
    assert res.json()["amount"] == 1300.0


def test_update_not_found(client: TestClient) -> None:
    assert client.put("/api/v1/fixed-expenses/999", json=_PAYLOAD).status_code == 404


def test_delete(client: TestClient) -> None:
    created = client.post("/api/v1/fixed-expenses/", json=_PAYLOAD).json()
    assert client.delete(f"/api/v1/fixed-expenses/{created['id']}").status_code == 204
    assert client.get("/api/v1/fixed-expenses/").json() == []


def test_delete_not_found(client: TestClient) -> None:
    assert client.delete("/api/v1/fixed-expenses/999").status_code == 404
