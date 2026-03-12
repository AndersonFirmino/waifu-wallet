from __future__ import annotations

from fastapi.testclient import TestClient

_TX: dict[str, object] = {
    "type": "expense",
    "description": "Aluguel",
    "category": "Moradia",
    "emoji": "🏠",
    "amount": 1200.0,
    "date": "2026-03-01",
}

_DEBT: dict[str, object] = {
    "name": "Cartao Parcelado",
    "total": 3000.0,
    "remaining": 2000.0,
    "rate": 2.0,
    "due_date": "2026-03-15",
    "installments": "3/12",
    "urgent": False,
}

_LOAN: dict[str, object] = {
    "name": "Emprestimo",
    "total": 5000.0,
    "remaining": 4000.0,
    "rate": 1.2,
    "installment": 300.0,
    "next_payment": "2026-03-20",
    "installments": "5/24",
}


def test_empty_calendar(client: TestClient) -> None:
    res = client.get("/api/v1/calendar/2026/3")
    assert res.status_code == 200
    assert res.json() == []


def test_calendar_includes_transactions(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json=_TX)
    data = client.get("/api/v1/calendar/2026/3").json()
    assert len(data) == 1
    assert data[0]["day"] == 1
    assert data[0]["type"] == "expense"
    assert data[0]["description"] == "Aluguel"


def test_calendar_includes_debt_due_date(client: TestClient) -> None:
    client.post("/api/v1/debts/", json=_DEBT)
    data = client.get("/api/v1/calendar/2026/3").json()
    installments = [e for e in data if e["type"] == "installment"]
    assert len(installments) == 1
    assert installments[0]["day"] == 15
    assert installments[0]["description"] == "Cartao Parcelado"


def test_calendar_includes_loan_next_payment(client: TestClient) -> None:
    client.post("/api/v1/loans/", json=_LOAN)
    data = client.get("/api/v1/calendar/2026/3").json()
    installments = [e for e in data if e["type"] == "installment"]
    assert len(installments) == 1
    assert installments[0]["day"] == 20
    assert installments[0]["amount"] == 300.0


def test_calendar_sorted_by_day(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json={**_TX, "date": "2026-03-20"})
    client.post("/api/v1/transactions/", json={**_TX, "date": "2026-03-05"})
    data = client.get("/api/v1/calendar/2026/3").json()
    days = [e["day"] for e in data]
    assert days == sorted(days)


def test_calendar_excludes_other_months(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json={**_TX, "date": "2026-04-01"})
    assert client.get("/api/v1/calendar/2026/3").json() == []


def test_calendar_mixed_events(client: TestClient) -> None:
    client.post("/api/v1/transactions/", json=_TX)
    client.post("/api/v1/debts/", json=_DEBT)
    client.post("/api/v1/loans/", json=_LOAN)
    data = client.get("/api/v1/calendar/2026/3").json()
    assert len(data) == 3
    types = {e["type"] for e in data}
    assert "expense" in types
    assert "installment" in types
