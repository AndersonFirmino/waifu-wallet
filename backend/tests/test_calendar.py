from __future__ import annotations

from datetime import date
from unittest.mock import patch

from fastapi.testclient import TestClient

import routers.calendar as calendar_router

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

# Patch target for holiday fetching
_PATCH_TARGET = "routers.calendar._fetch_holidays"


def test_empty_calendar(client: TestClient) -> None:
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        res = client.get("/api/v1/calendar/2026/3")
    assert res.status_code == 200
    assert res.json() == []


def test_calendar_includes_transactions(client: TestClient) -> None:
    # March 1 2026 is a Sunday but transactions are NOT shifted
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        client.post("/api/v1/transactions/", json=_TX)
        data = client.get("/api/v1/calendar/2026/3").json()
    assert len(data) == 1
    assert data[0]["day"] == 1
    assert data[0]["type"] == "expense"
    assert data[0]["description"] == "Aluguel"


def test_calendar_includes_debt_due_date(client: TestClient) -> None:
    # March 15 2026 is a Sunday — debt shifts to Monday March 16
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        client.post("/api/v1/debts/", json=_DEBT)
        data = client.get("/api/v1/calendar/2026/3").json()
    installments = [e for e in data if e["type"] == "installment"]
    assert len(installments) == 1
    assert installments[0]["day"] == 16
    assert "Cartao Parcelado" in installments[0]["description"]
    assert "adiado de 15" in installments[0]["description"]


def test_calendar_includes_loan_next_payment(client: TestClient) -> None:
    # March 20 2026 is a Friday — no shift
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        client.post("/api/v1/loans/", json=_LOAN)
        data = client.get("/api/v1/calendar/2026/3").json()
    installments = [e for e in data if e["type"] == "installment"]
    assert len(installments) == 1
    assert installments[0]["day"] == 20
    assert installments[0]["amount"] == 300.0


def test_calendar_sorted_by_day(client: TestClient) -> None:
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        client.post("/api/v1/transactions/", json={**_TX, "date": "2026-03-20"})
        client.post("/api/v1/transactions/", json={**_TX, "date": "2026-03-05"})
        data = client.get("/api/v1/calendar/2026/3").json()
    days = [e["day"] for e in data]
    assert days == sorted(days)


def test_calendar_excludes_other_months(client: TestClient) -> None:
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        client.post("/api/v1/transactions/", json={**_TX, "date": "2026-04-01"})
        data = client.get("/api/v1/calendar/2026/3").json()
    assert data == []


def test_calendar_mixed_events(client: TestClient) -> None:
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        client.post("/api/v1/transactions/", json=_TX)
        client.post("/api/v1/debts/", json=_DEBT)
        client.post("/api/v1/loans/", json=_LOAN)
        data = client.get("/api/v1/calendar/2026/3").json()
    assert len(data) == 3
    types = {e["type"] for e in data}
    assert "expense" in types
    assert "installment" in types


_CARD: dict[str, object] = {
    "name": "Nubank",
    "brand": "Mastercard",
    "last_four": "1234",
    "limit": 5000.0,
    "used": 1200.0,
    "gradient_from": "#8B5CF6",
    "gradient_to": "#6D28D9",
    "bill": 850.0,
    "closing_day": 8,
    "due_day": 15,
    "status": "open",
}


def test_calendar_includes_credit_card_bill(client: TestClient) -> None:
    # due_day=15 → March 15 2026 is Sunday → shifts to March 16 (Monday)
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        client.post("/api/v1/credit-cards/", json=_CARD)
        data = client.get("/api/v1/calendar/2026/3").json()
    bill_events = [
        e for e in data if "Fatura" in e["description"] and "Nubank" in e["description"]
    ]
    assert len(bill_events) == 1
    assert bill_events[0]["day"] == 16
    assert bill_events[0]["type"] == "expense"
    assert "Fatura Nubank" in bill_events[0]["description"]
    assert "adiado de 15" in bill_events[0]["description"]
    assert bill_events[0]["amount"] == 850.0


def test_calendar_excludes_card_with_zero_bill(client: TestClient) -> None:
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        client.post("/api/v1/credit-cards/", json={**_CARD, "bill": 0.0})
        data = client.get("/api/v1/calendar/2026/3").json()
    bill_events = [e for e in data if "Fatura" in e["description"]]
    assert len(bill_events) == 0


def test_calendar_includes_active_subscription(client: TestClient) -> None:
    # billing_day=10 → March 10 2026 is Tuesday → no shift
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        res = client.post("/api/v1/credit-cards/", json=_CARD)
        card_id = res.json()["id"]
        client.post(
            f"/api/v1/credit-cards/{card_id}/subscriptions",
            json={
                "name": "Netflix",
                "amount": 39.90,
                "billing_day": 10,
                "active": True,
            },
        )
        data = client.get("/api/v1/calendar/2026/3").json()
    sub_events = [e for e in data if "Netflix" in e["description"]]
    assert len(sub_events) == 1
    assert sub_events[0]["day"] == 10
    assert sub_events[0]["type"] == "expense"
    assert sub_events[0]["description"] == "Netflix (Nubank)"
    assert sub_events[0]["amount"] == 39.90


def test_calendar_excludes_inactive_subscription(client: TestClient) -> None:
    calendar_router._holidays_cache.clear()
    with patch(_PATCH_TARGET, return_value=[]):
        res = client.post("/api/v1/credit-cards/", json=_CARD)
        card_id = res.json()["id"]
        client.post(
            f"/api/v1/credit-cards/{card_id}/subscriptions",
            json={
                "name": "Spotify",
                "amount": 21.90,
                "billing_day": 5,
                "active": False,
            },
        )
        data = client.get("/api/v1/calendar/2026/3").json()
    sub_events = [e for e in data if "Spotify" in e["description"]]
    assert len(sub_events) == 0


# ─── New tests: holidays + shifting ───────────────────────────────────────────


def test_calendar_includes_holidays(client: TestClient) -> None:
    calendar_router._holidays_cache.clear()
    mock_holidays = [{"date": "2026-03-15", "name": "Test Holiday", "type": "national"}]
    with patch(_PATCH_TARGET, return_value=mock_holidays):
        data = client.get("/api/v1/calendar/2026/3").json()
    holidays = [e for e in data if e["type"] == "holiday"]
    assert len(holidays) == 1
    assert holidays[0]["day"] == 15
    assert holidays[0]["description"] == "Test Holiday"
    assert holidays[0]["amount"] == 0


def test_calendar_shifts_bill_on_holiday(client: TestClient) -> None:
    # Card due_day=15. Mock March 16 (Monday) as a holiday so it shifts to Tuesday March 17.
    # March 15 is already Sunday so first it shifts to 16, then 16 is a holiday so shifts to 17.
    calendar_router._holidays_cache.clear()
    mock_holidays = [
        {"date": "2026-03-16", "name": "Feriado Teste", "type": "national"}
    ]
    with patch(_PATCH_TARGET, return_value=mock_holidays):
        client.post("/api/v1/credit-cards/", json=_CARD)
        data = client.get("/api/v1/calendar/2026/3").json()
    bill_events = [
        e for e in data if "Fatura" in e["description"] and "Nubank" in e["description"]
    ]
    assert len(bill_events) == 1
    # March 15 (Sun) -> 16 (Mon, holiday) -> 17 (Tue)
    assert bill_events[0]["day"] == 17
    assert "adiado de 15" in bill_events[0]["description"]


def test_calendar_shifts_bill_on_weekend(client: TestClient) -> None:
    # Use due_day=7 → March 7 2026 is Saturday → should shift to Monday March 9
    calendar_router._holidays_cache.clear()
    # Verify: date(2026, 3, 7).weekday() == 5 (Saturday)
    assert date(2026, 3, 7).weekday() == 5
    card_saturday = {**_CARD, "due_day": 7, "bill": 500.0}
    with patch(_PATCH_TARGET, return_value=[]):
        client.post("/api/v1/credit-cards/", json=card_saturday)
        data = client.get("/api/v1/calendar/2026/3").json()
    bill_events = [
        e for e in data if "Fatura" in e["description"] and "Nubank" in e["description"]
    ]
    assert len(bill_events) == 1
    assert bill_events[0]["day"] == 9  # Saturday -> Sunday -> Monday
    assert "adiado de 7" in bill_events[0]["description"]


def test_calendar_transactions_not_shifted(client: TestClient) -> None:
    # March 15 2026 is a Sunday. Transaction on that day must NOT be shifted.
    calendar_router._holidays_cache.clear()
    mock_holidays = [{"date": "2026-03-15", "name": "Test Holiday", "type": "national"}]
    tx_sunday = {**_TX, "date": "2026-03-15"}
    with patch(_PATCH_TARGET, return_value=mock_holidays):
        client.post("/api/v1/transactions/", json=tx_sunday)
        data = client.get("/api/v1/calendar/2026/3").json()
    tx_events = [
        e for e in data if e["type"] == "expense" and e["description"] == "Aluguel"
    ]
    assert len(tx_events) == 1
    assert tx_events[0]["day"] == 15  # unchanged
