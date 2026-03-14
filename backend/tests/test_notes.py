from __future__ import annotations

from fastapi.testclient import TestClient

_PAYLOAD: dict[str, object] = {"date": "2026-03-15", "content": "Test note content"}


def test_list_empty(client: TestClient) -> None:
    assert client.get("/api/v1/notes/").json() == []


def test_create(client: TestClient) -> None:
    res = client.post("/api/v1/notes/", json=_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["content"] == "Test note content"
    assert isinstance(body["id"], int)


def test_list_ordered_by_date_desc(client: TestClient) -> None:
    client.post("/api/v1/notes/", json={**_PAYLOAD, "date": "2026-01-01"})
    client.post("/api/v1/notes/", json={**_PAYLOAD, "date": "2026-03-01"})
    data = client.get("/api/v1/notes/").json()
    assert data[0]["date"] == "2026-03-01"


def test_update(client: TestClient) -> None:
    created = client.post("/api/v1/notes/", json=_PAYLOAD).json()
    res = client.patch(
        f"/api/v1/notes/{created['id']}", json={"content": "Updated content"}
    )
    assert res.status_code == 200
    assert res.json()["content"] == "Updated content"


def test_update_not_found(client: TestClient) -> None:
    assert client.patch("/api/v1/notes/999", json={"content": "X"}).status_code == 404


def test_delete(client: TestClient) -> None:
    created = client.post("/api/v1/notes/", json=_PAYLOAD).json()
    assert client.delete(f"/api/v1/notes/{created['id']}").status_code == 204
    assert client.get("/api/v1/notes/").json() == []


def test_delete_not_found(client: TestClient) -> None:
    assert client.delete("/api/v1/notes/999").status_code == 404
