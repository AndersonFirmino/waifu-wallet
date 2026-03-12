from __future__ import annotations

from fastapi.testclient import TestClient

_PAYLOAD: dict[str, object] = {
    "type": "expense",
    "description": "Test transaction",
    "category": "Test",
    "emoji": "🧪",
    "amount": 100.0,
    "date": "2026-03-15",
}


def test_list_empty(client: TestClient) -> None:
    res = client.get("/api/v1/transactions/")
    assert res.status_code == 200
    assert res.json() == []


def test_create(client: TestClient) -> None:
    res = client.post("/api/v1/transactions/", json=_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["description"] == "Test transaction"
    assert body["amount"] == 100.0
    assert isinstance(body["id"], int)


def test_list_returns_created(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json=_PAYLOAD)
    data = client.get("/api/v1/transactions/").json()
    assert len(data) == 1


def test_list_filters_by_month(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json={**_PAYLOAD, "date": "2026-03-10"})
    client.post("/api/v1/transactions/", json={**_PAYLOAD, "date": "2026-04-10"})

    res = client.get("/api/v1/transactions/", params={"month": 3, "year": 2026})
    data = res.json()
    assert len(data) == 1
    assert data[0]["date"] == "2026-03-10"


def test_list_without_filter_returns_all(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json={**_PAYLOAD, "date": "2026-03-10"})
    client.post("/api/v1/transactions/", json={**_PAYLOAD, "date": "2026-04-10"})
    assert len(client.get("/api/v1/transactions/").json()) == 2


def test_list_ordered_by_date_desc(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json={**_PAYLOAD, "date": "2026-03-01"})
    client.post("/api/v1/transactions/", json={**_PAYLOAD, "date": "2026-03-20"})
    data = client.get("/api/v1/transactions/").json()
    assert data[0]["date"] == "2026-03-20"


def test_delete(client: TestClient) -> None:
    created = client.post("/api/v1/transactions/", json=_PAYLOAD).json()
    res = client.delete(f"/api/v1/transactions/{created['id']}")
    assert res.status_code == 204
    assert client.get("/api/v1/transactions/").json() == []


def test_delete_not_found(client: TestClient) -> None:
    assert client.delete("/api/v1/transactions/999").status_code == 404
