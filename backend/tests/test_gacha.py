from __future__ import annotations

from fastapi.testclient import TestClient

_PAYLOAD: dict[str, object] = {
    "game": "Genshin Impact",
    "banner": "Test Banner",
    "cost": 160.0,
    "start_date": "2026-03-01",
    "end_date": "2026-03-31",
    "priority": 1,
    "pulls": 0,
}


def test_list_empty(client: TestClient) -> None:
    assert client.get("/api/v1/gacha/banners/").json() == []


def test_create(client: TestClient) -> None:
    res = client.post("/api/v1/gacha/banners/", json=_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["game"] == "Genshin Impact"
    assert isinstance(body["id"], int)


def test_list_returns_created(client: TestClient) -> None:
    client.post("/api/v1/gacha/banners/", json=_PAYLOAD)
    assert len(client.get("/api/v1/gacha/banners/").json()) == 1


def test_list_ordered_by_priority(client: TestClient) -> None:
    client.post("/api/v1/gacha/banners/", json={**_PAYLOAD, "priority": 3})
    client.post("/api/v1/gacha/banners/", json={**_PAYLOAD, "priority": 1})
    data = client.get("/api/v1/gacha/banners/").json()
    assert data[0]["priority"] == 1


def test_update(client: TestClient) -> None:
    created = client.post("/api/v1/gacha/banners/", json=_PAYLOAD).json()
    res = client.put(f"/api/v1/gacha/banners/{created['id']}", json={**_PAYLOAD, "cost": 200.0})
    assert res.status_code == 200
    assert res.json()["cost"] == 200.0


def test_update_not_found(client: TestClient) -> None:
    assert client.put("/api/v1/gacha/banners/999", json=_PAYLOAD).status_code == 404


def test_update_pulls(client: TestClient) -> None:
    created = client.post("/api/v1/gacha/banners/", json=_PAYLOAD).json()
    res = client.patch(f"/api/v1/gacha/banners/{created['id']}/pulls", json={"pulls": 45})
    assert res.status_code == 200
    assert res.json()["pulls"] == 45


def test_update_pulls_not_found(client: TestClient) -> None:
    assert client.patch("/api/v1/gacha/banners/999/pulls", json={"pulls": 10}).status_code == 404


def test_delete(client: TestClient) -> None:
    created = client.post("/api/v1/gacha/banners/", json=_PAYLOAD).json()
    assert client.delete(f"/api/v1/gacha/banners/{created['id']}").status_code == 204
    assert client.get("/api/v1/gacha/banners/").json() == []


def test_delete_not_found(client: TestClient) -> None:
    assert client.delete("/api/v1/gacha/banners/999").status_code == 404


# ─── Multi-game stash ────────────────────────────────────────────────────────

def test_list_stashes_empty(client: TestClient) -> None:
    assert client.get("/api/v1/gacha/stashes").json() == []


def test_get_game_stash_auto_create(client: TestClient) -> None:
    res = client.get("/api/v1/gacha/stash/game", params={"game": "Genshin Impact"})
    assert res.status_code == 200
    body = res.json()
    assert body["game"] == "Genshin Impact"
    assert body["premium_currency"] == 0
    assert body["passes"] == 0


def test_update_game_stash(client: TestClient) -> None:
    client.get("/api/v1/gacha/stash/game", params={"game": "Genshin Impact"})
    res = client.patch(
        "/api/v1/gacha/stash/game",
        params={"game": "Genshin Impact"},
        json={"premium_currency": 12800, "passes": 5},
    )
    assert res.status_code == 200
    assert res.json()["premium_currency"] == 12800
    assert res.json()["passes"] == 5


def test_stash_isolation(client: TestClient) -> None:
    client.patch(
        "/api/v1/gacha/stash/game",
        params={"game": "Genshin Impact"},
        json={"premium_currency": 5000},
    )
    res = client.get("/api/v1/gacha/stash/game", params={"game": "Honkai: Star Rail"})
    assert res.json()["premium_currency"] == 0


def test_list_stashes_returns_all(client: TestClient) -> None:
    client.get("/api/v1/gacha/stash/game", params={"game": "Genshin Impact"})
    client.get("/api/v1/gacha/stash/game", params={"game": "Honkai: Star Rail"})
    data = client.get("/api/v1/gacha/stashes").json()
    assert len(data) == 2


# ─── char_current / weapon_current ───────────────────────────────────────────

_PAYLOAD_WITH_CURRENT: dict[str, object] = {
    "game": "Genshin Impact",
    "banner": "Chasca",
    "cost": 0,
    "start_date": "2026-03-01",
    "end_date": "2026-03-31",
    "priority": 1,
    "pulls": 0,
    "char_current": "E3",
    "weapon_current": "S1",
}


def test_create_banner_with_current(client: TestClient) -> None:
    res = client.post("/api/v1/gacha/banners/", json=_PAYLOAD_WITH_CURRENT)
    assert res.status_code == 201
    body = res.json()
    assert body["char_current"] == "E3"
    assert body["weapon_current"] == "S1"


def test_create_banner_current_nullable(client: TestClient) -> None:
    payload = {**_PAYLOAD, "char_current": None, "weapon_current": None}
    res = client.post("/api/v1/gacha/banners/", json=payload)
    assert res.status_code == 201
    assert res.json()["char_current"] is None
    assert res.json()["weapon_current"] is None


def test_update_banner_current(client: TestClient) -> None:
    created = client.post("/api/v1/gacha/banners/", json=_PAYLOAD_WITH_CURRENT).json()
    updated_payload = {**_PAYLOAD_WITH_CURRENT, "char_current": "E5", "weapon_current": "S3"}
    res = client.put(f"/api/v1/gacha/banners/{created['id']}", json=updated_payload)
    assert res.status_code == 200
    assert res.json()["char_current"] == "E5"
    assert res.json()["weapon_current"] == "S3"
