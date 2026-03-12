from __future__ import annotations

from fastapi.testclient import TestClient

_CARD: dict[str, object] = {
    "name": "Test Card",
    "brand": "Mastercard",
    "last_four": "1234",
    "limit": 5000.0,
    "used": 2000.0,
    "gradient_from": "#000000",
    "gradient_to": "#ffffff",
    "bill": 1000.0,
    "closing_day": 25,
    "due_day": 10,
    "status": "open",
}

_HISTORY: dict[str, object] = {"month": "2026-03", "amount": 800.0, "status": "open"}
_ITEM: dict[str, object] = {"description": "Netflix", "amount": 45.9, "date": "2026-03-01"}


def test_list_empty(client: TestClient) -> None:
    assert client.get("/api/v1/credit-cards/").json() == []


def test_create(client: TestClient) -> None:
    res = client.post("/api/v1/credit-cards/", json=_CARD)
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Test Card"
    assert body["history"] == []
    assert body["items"] == []


def test_list_returns_created(client: TestClient) -> None:
    client.post("/api/v1/credit-cards/", json=_CARD)
    assert len(client.get("/api/v1/credit-cards/").json()) == 1


def test_update(client: TestClient) -> None:
    created = client.post("/api/v1/credit-cards/", json=_CARD).json()
    res = client.put(f"/api/v1/credit-cards/{created['id']}", json={**_CARD, "used": 3000.0})
    assert res.status_code == 200
    assert res.json()["used"] == 3000.0


def test_update_not_found(client: TestClient) -> None:
    assert client.put("/api/v1/credit-cards/999", json=_CARD).status_code == 404


def test_delete(client: TestClient) -> None:
    created = client.post("/api/v1/credit-cards/", json=_CARD).json()
    assert client.delete(f"/api/v1/credit-cards/{created['id']}").status_code == 204
    assert client.get("/api/v1/credit-cards/").json() == []


def test_delete_not_found(client: TestClient) -> None:
    assert client.delete("/api/v1/credit-cards/999").status_code == 404


# ─── Bill history ─────────────────────────────────────────────────────────────

def test_add_history(client: TestClient) -> None:
    card = client.post("/api/v1/credit-cards/", json=_CARD).json()
    res = client.post(f"/api/v1/credit-cards/{card['id']}/history", json=_HISTORY)
    assert res.status_code == 201
    body = res.json()
    assert body["month"] == "2026-03"
    assert body["card_id"] == card["id"]


def test_add_history_card_not_found(client: TestClient) -> None:
    assert client.post("/api/v1/credit-cards/999/history", json=_HISTORY).status_code == 404


def test_delete_history(client: TestClient) -> None:
    card = client.post("/api/v1/credit-cards/", json=_CARD).json()
    hist = client.post(f"/api/v1/credit-cards/{card['id']}/history", json=_HISTORY).json()
    assert client.delete(f"/api/v1/credit-cards/{card['id']}/history/{hist['id']}").status_code == 204


def test_delete_history_wrong_card(client: TestClient) -> None:
    card1 = client.post("/api/v1/credit-cards/", json=_CARD).json()
    card2 = client.post("/api/v1/credit-cards/", json=_CARD).json()
    hist = client.post(f"/api/v1/credit-cards/{card1['id']}/history", json=_HISTORY).json()
    assert client.delete(f"/api/v1/credit-cards/{card2['id']}/history/{hist['id']}").status_code == 404


# ─── Bill items ───────────────────────────────────────────────────────────────

def test_add_item(client: TestClient) -> None:
    card = client.post("/api/v1/credit-cards/", json=_CARD).json()
    res = client.post(f"/api/v1/credit-cards/{card['id']}/items", json=_ITEM)
    assert res.status_code == 201
    body = res.json()
    assert body["description"] == "Netflix"
    assert body["card_id"] == card["id"]


def test_add_item_card_not_found(client: TestClient) -> None:
    assert client.post("/api/v1/credit-cards/999/items", json=_ITEM).status_code == 404


def test_delete_item(client: TestClient) -> None:
    card = client.post("/api/v1/credit-cards/", json=_CARD).json()
    item = client.post(f"/api/v1/credit-cards/{card['id']}/items", json=_ITEM).json()
    assert client.delete(f"/api/v1/credit-cards/{card['id']}/items/{item['id']}").status_code == 204


def test_delete_item_wrong_card(client: TestClient) -> None:
    card1 = client.post("/api/v1/credit-cards/", json=_CARD).json()
    card2 = client.post("/api/v1/credit-cards/", json=_CARD).json()
    item = client.post(f"/api/v1/credit-cards/{card1['id']}/items", json=_ITEM).json()
    assert client.delete(f"/api/v1/credit-cards/{card2['id']}/items/{item['id']}").status_code == 404
