from __future__ import annotations

from fastapi.testclient import TestClient

_INCOME: dict[str, object] = {
    "type": "income",
    "description": "Salary",
    "category": "Salary",
    "emoji": "💼",
    "amount": 5000.0,
    "date": "2026-03-05",
}

_EXPENSE: dict[str, object] = {
    "type": "expense",
    "description": "Rent",
    "category": "Housing",
    "emoji": "🏠",
    "amount": 1500.0,
    "date": "2026-03-01",
}


def test_forecast_returns_200(client: TestClient) -> None:
    assert client.get("/api/v1/forecast/").status_code == 200


def test_forecast_default_is_3m(client: TestClient) -> None:
    assert len(client.get("/api/v1/forecast/").json()) == 3


def test_forecast_1m(client: TestClient) -> None:
    assert len(client.get("/api/v1/forecast/", params={"period": "1m"}).json()) == 1


def test_forecast_3m(client: TestClient) -> None:
    assert len(client.get("/api/v1/forecast/", params={"period": "3m"}).json()) == 3


def test_forecast_6m(client: TestClient) -> None:
    assert len(client.get("/api/v1/forecast/", params={"period": "6m"}).json()) == 6


def test_forecast_invalid_period_defaults_to_3m(client: TestClient) -> None:
    assert (
        len(client.get("/api/v1/forecast/", params={"period": "invalid"}).json()) == 3
    )


def test_forecast_has_required_fields(client: TestClient) -> None:
    points = client.get("/api/v1/forecast/").json()
    for point in points:
        assert "month" in point
        assert "optimistic" in point
        assert "base" in point
        assert "pessimistic" in point


def test_forecast_month_label_format(client: TestClient) -> None:
    points = client.get("/api/v1/forecast/").json()
    for point in points:
        assert isinstance(point["month"], str)
        assert "/" in point["month"]


def test_forecast_optimistic_gt_base_gt_pessimistic(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json=_INCOME)
    client.post("/api/v1/transactions/", json=_EXPENSE)
    points = client.get("/api/v1/forecast/", params={"period": "1m"}).json()
    p = points[0]
    assert p["optimistic"] > p["base"]
    assert p["base"] > p["pessimistic"]


def test_forecast_empty_db_returns_zero_balance(client: TestClient) -> None:
    points = client.get("/api/v1/forecast/", params={"period": "1m"}).json()
    assert points[0]["base"] == 0.0
