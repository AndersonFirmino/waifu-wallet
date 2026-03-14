from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient

_today = date.today().isoformat()

_TX_INCOME: dict[str, object] = {
    "type": "income",
    "description": "Salary",
    "category": "Salary",
    "emoji": "💼",
    "amount": 5000.0,
    "date": _today,
}

_TX_EXPENSE: dict[str, object] = {
    "type": "expense",
    "description": "Rent",
    "category": "Housing",
    "emoji": "🏠",
    "amount": 1500.0,
    "date": _today,
}

_CARD: dict[str, object] = {
    "name": "Test Card",
    "brand": "Visa",
    "last_four": "1234",
    "limit": 5000.0,
    "used": 2000.0,
    "gradient_from": "#000",
    "gradient_to": "#fff",
    "bill": 500.0,
    "closing_day": 25,
    "due_day": 10,
    "status": "open",
}

_HIGH_CARD: dict[str, object] = {
    **_CARD,
    "name": "High Card",
    "used": 4600.0,
}  # 92% → urgent

_DEBT: dict[str, object] = {
    "name": "Normal Debt",
    "total": 3000.0,
    "remaining": 2000.0,
    "rate": 2.0,
    "due_date": "2099-12-01",
    "installments": "3/12",
    "urgent": False,
}

_URGENT_DEBT: dict[str, object] = {
    **_DEBT,
    "name": "Urgent Debt",
    "urgent": True,
    "due_date": _today,
}


def test_summary_returns_200(client: TestClient) -> None:
    assert client.get("/api/v1/summary/").status_code == 200


def test_summary_has_required_keys(client: TestClient) -> None:
    body = client.get("/api/v1/summary/").json()
    assert "queried_at" in body
    assert "current_month" in body
    assert "monthly_finances" in body
    assert "wealth" in body
    assert "cards" in body
    assert "fixed_costs" in body
    assert "gacha" in body
    assert "alerts" in body


def test_summary_empty_db_returns_zeros(client: TestClient) -> None:
    body = client.get("/api/v1/summary/").json()
    assert body["monthly_finances"]["income"] == 0.0
    assert body["monthly_finances"]["expenses"] == 0.0
    assert body["monthly_finances"]["balance"] == 0.0
    assert body["wealth"]["total_debt"] == 0.0
    assert body["wealth"]["total_loans"] == 0.0
    assert body["gacha"]["active_banners"] == 0
    assert body["gacha"]["next_due_date"] is None


def test_summary_monthly_finances(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json=_TX_INCOME)
    client.post("/api/v1/transactions/", json=_TX_EXPENSE)
    body = client.get("/api/v1/summary/").json()
    mf = body["monthly_finances"]
    assert mf["income"] == 5000.0
    assert mf["expenses"] == 1500.0
    assert mf["balance"] == 3500.0


def test_summary_negative_balance_triggers_alert(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json={**_TX_EXPENSE, "amount": 9999.0})
    alerts = client.get("/api/v1/summary/").json()["alerts"]
    assert any(a["message"] == "Saldo negativo no mes atual" for a in alerts)


def test_summary_no_alert_when_positive_balance(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json=_TX_INCOME)
    alerts = client.get("/api/v1/summary/").json()["alerts"]
    assert not any(a["message"] == "Saldo negativo no mes atual" for a in alerts)


def test_summary_urgent_debt_alert(client: TestClient) -> None:
    client.post("/api/v1/debts/", json=_URGENT_DEBT)
    alerts = client.get("/api/v1/summary/").json()["alerts"]
    assert any(a["level"] == "urgent" and "Urgent Debt" in a["message"] for a in alerts)


def test_summary_no_urgent_alert_for_normal_debt(client: TestClient) -> None:
    client.post("/api/v1/debts/", json=_DEBT)
    alerts = client.get("/api/v1/summary/").json()["alerts"]
    assert not any(
        a["level"] == "urgent" and "Normal Debt" in a["message"] for a in alerts
    )


def test_summary_high_card_usage_urgent_alert(client: TestClient) -> None:
    client.post("/api/v1/credit-cards/", json=_HIGH_CARD)
    alerts = client.get("/api/v1/summary/").json()["alerts"]
    assert any(a["level"] == "urgent" and "High Card" in a["message"] for a in alerts)


def test_summary_card_overview_used_pct(client: TestClient) -> None:
    client.post("/api/v1/credit-cards/", json=_CARD)
    body = client.get("/api/v1/summary/").json()
    assert len(body["cards"]) == 1
    card = body["cards"][0]
    assert card["name"] == "Test Card"
    assert card["used_pct"] == 40.0  # 2000 / 5000 * 100


def test_summary_wealth_totals(client: TestClient) -> None:
    client.post("/api/v1/debts/", json=_DEBT)
    body = client.get("/api/v1/summary/").json()
    assert body["wealth"]["total_debt"] == 2000.0
