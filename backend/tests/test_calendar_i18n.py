from __future__ import annotations

from unittest.mock import patch

import routers.calendar as calendar_router
from fastapi.testclient import TestClient

_PATCH_TARGET = "routers.calendar._fetch_holidays"

_SALARY_PLAN: dict[str, object] = {
    "employer": "Acme Corp",
    "current_salary": 5000.0,
    "target_salary": 8000.0,
    "increment": 500.0,
    "increment_interval_months": 6,
    "next_increment_date": "2026-06-01",
    "split_enabled": False,
    "split_first_pct": 100,
    "split_first_day": 5,
    "split_second_pct": 0,
    "split_second_day": 20,
    "active": True,
}

_SALARY_PLAN_SPLIT: dict[str, object] = {
    "employer": "Split Corp",
    "current_salary": 6000.0,
    "target_salary": 9000.0,
    "increment": 500.0,
    "increment_interval_months": 6,
    "next_increment_date": "2026-06-01",
    "split_enabled": True,
    "split_first_pct": 40,
    "split_first_day": 5,
    "split_second_pct": 60,
    "split_second_day": 20,
    "active": True,
}

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
    "due_day": 22,  # March 22 2026 is a Sunday — shifted to Monday March 23
    "status": "open",
}

_DEBT: dict[str, object] = {
    "name": "Cartao Parcelado",
    "total": 3000.0,
    "remaining": 2000.0,
    "rate": 2.0,
    "due_date": "2026-03-20",  # Friday — no shift
    "installments": "3/12",
    "urgent": False,
}

_DEBT_SHIFTED: dict[str, object] = {
    "name": "Cartao Atrasado",
    "total": 3000.0,
    "remaining": 2000.0,
    "rate": 2.0,
    "due_date": "2026-03-15",  # Sunday — shifts to Monday March 16
    "installments": "3/12",
    "urgent": False,
}

_LOAN: dict[str, object] = {
    "name": "Emprestimo",
    "total": 5000.0,
    "remaining": 4000.0,
    "rate": 1.2,
    "installment": 300.0,
    "next_payment": "2026-03-20",  # Friday — no shift
    "installments": "5/24",
}

_LOAN_SHIFTED: dict[str, object] = {
    "name": "Emprestimo Atrasado",
    "total": 5000.0,
    "remaining": 4000.0,
    "rate": 1.2,
    "installment": 300.0,
    "next_payment": "2026-03-15",  # Sunday — shifts to Monday March 16
    "installments": "5/24",
}


def test_calendar_events_have_description_key(client: TestClient) -> None:
    """Salary plan events should include description_key."""
    calendar_router._holidays_cache.clear()
    client.post("/api/v1/salary-plans/", json=_SALARY_PLAN)

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    assert response.status_code == 200
    events = response.json()

    salary_events = [e for e in events if e.get("type") == "salary"]
    assert len(salary_events) > 0

    salary_event = salary_events[0]
    assert salary_event.get("description_key") == "calendar_event.salary"
    assert salary_event.get("description_params") == {"employer": "Acme Corp"}


def test_calendar_events_transaction_no_key(client: TestClient) -> None:
    """Transaction events should NOT have a description_key (user-entered text)."""
    calendar_router._holidays_cache.clear()
    client.post(
        "/api/v1/transactions/",
        json={
            "type": "expense",
            "description": "Groceries",
            "category": "Food",
            "emoji": "🛒",
            "amount": 150.0,
            "date": "2026-03-10",
        },
    )

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    assert response.status_code == 200
    events = response.json()

    tx_events = [e for e in events if e.get("description") == "Groceries"]
    assert len(tx_events) > 0
    assert tx_events[0].get("description_key") is None
    assert tx_events[0].get("description_params") is None


def test_holiday_has_description_key(client: TestClient) -> None:
    """Holiday events should have description_key and pass name as param."""
    calendar_router._holidays_cache.clear()
    mock_holidays = [
        {"date": "2026-03-08", "name": "Dia da Mulher", "type": "national"}
    ]

    with patch(_PATCH_TARGET, return_value=mock_holidays):
        response = client.get("/api/v1/calendar/2026/3")

    assert response.status_code == 200
    events = response.json()

    holiday_events = [e for e in events if e.get("type") == "holiday"]
    assert len(holiday_events) == 1
    assert holiday_events[0]["description_key"] == "calendar_event.holiday"
    assert holiday_events[0]["description_params"] == {"name": "Dia da Mulher"}


def test_debt_normal_has_description_key(client: TestClient) -> None:
    """Debt due on a business day should have description_key 'calendar_event.debt'."""
    calendar_router._holidays_cache.clear()
    client.post("/api/v1/debts/", json=_DEBT)

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    installments = [
        e
        for e in events
        if e.get("type") == "installment"
        and "Cartao Parcelado" in e.get("description", "")
    ]
    assert len(installments) == 1
    assert installments[0]["description_key"] == "calendar_event.debt"
    assert installments[0]["description_params"] == {"name": "Cartao Parcelado"}


def test_debt_postponed_has_description_key(client: TestClient) -> None:
    """Debt shifted due to weekend should have description_key 'calendar_event.debt_postponed'."""
    calendar_router._holidays_cache.clear()
    client.post("/api/v1/debts/", json=_DEBT_SHIFTED)

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    installments = [
        e
        for e in events
        if e.get("type") == "installment"
        and "Cartao Atrasado" in e.get("description", "")
    ]
    assert len(installments) == 1
    assert installments[0]["day"] == 16
    assert installments[0]["description_key"] == "calendar_event.debt_postponed"
    assert installments[0]["description_params"] == {
        "name": "Cartao Atrasado",
        "original_day": "15",
    }


def test_loan_normal_has_description_key(client: TestClient) -> None:
    """Loan due on a business day should have description_key 'calendar_event.loan'."""
    calendar_router._holidays_cache.clear()
    client.post("/api/v1/loans/", json=_LOAN)

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    installments = [
        e
        for e in events
        if e.get("type") == "installment"
        and "Emprestimo" in e.get("description", "")
        and "Atrasado" not in e.get("description", "")
    ]
    assert len(installments) == 1
    assert installments[0]["description_key"] == "calendar_event.loan"
    assert installments[0]["description_params"] == {"name": "Emprestimo"}


def test_loan_postponed_has_description_key(client: TestClient) -> None:
    """Loan shifted due to weekend should have description_key 'calendar_event.loan_postponed'."""
    calendar_router._holidays_cache.clear()
    client.post("/api/v1/loans/", json=_LOAN_SHIFTED)

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    installments = [
        e
        for e in events
        if e.get("type") == "installment"
        and "Emprestimo Atrasado" in e.get("description", "")
    ]
    assert len(installments) == 1
    assert installments[0]["day"] == 16
    assert installments[0]["description_key"] == "calendar_event.loan_postponed"
    assert installments[0]["description_params"] == {
        "name": "Emprestimo Atrasado",
        "original_day": "15",
    }


def test_card_bill_normal_has_description_key(client: TestClient) -> None:
    """Credit card bill on a business day should have description_key 'calendar_event.card_bill'."""
    calendar_router._holidays_cache.clear()
    # due_day=10 → March 10 2026 is Tuesday — no shift
    client.post("/api/v1/credit-cards/", json={**_CARD, "due_day": 10})

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    bill_events = [
        e
        for e in events
        if "Fatura" in e.get("description", "") and "Nubank" in e.get("description", "")
    ]
    assert len(bill_events) == 1
    assert bill_events[0]["description_key"] == "calendar_event.card_bill"
    assert bill_events[0]["description_params"] == {"name": "Nubank"}


def test_card_bill_postponed_has_description_key(client: TestClient) -> None:
    """Credit card bill shifted due to weekend should have description_key 'calendar_event.card_bill_postponed'."""
    calendar_router._holidays_cache.clear()
    # due_day=15 → March 15 2026 is Sunday — shifts to March 16
    client.post("/api/v1/credit-cards/", json={**_CARD, "due_day": 15})

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    bill_events = [
        e
        for e in events
        if "Fatura" in e.get("description", "") and "Nubank" in e.get("description", "")
    ]
    assert len(bill_events) == 1
    assert bill_events[0]["day"] == 16
    assert bill_events[0]["description_key"] == "calendar_event.card_bill_postponed"
    assert bill_events[0]["description_params"] == {
        "name": "Nubank",
        "original_day": "15",
    }


def test_subscription_normal_has_description_key(client: TestClient) -> None:
    """Subscription billed on a business day should have description_key 'calendar_event.subscription'."""
    calendar_router._holidays_cache.clear()
    res = client.post("/api/v1/credit-cards/", json={**_CARD, "due_day": 10})
    card_id = res.json()["id"]
    client.post(
        f"/api/v1/credit-cards/{card_id}/subscriptions",
        json={"name": "Netflix", "amount": 39.90, "billing_day": 10, "active": True},
    )

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    sub_events = [e for e in events if "Netflix" in e.get("description", "")]
    assert len(sub_events) == 1
    assert sub_events[0]["description_key"] == "calendar_event.subscription"
    assert sub_events[0]["description_params"] == {"name": "Netflix", "card": "Nubank"}


def test_subscription_postponed_has_description_key(client: TestClient) -> None:
    """Subscription shifted due to weekend should have description_key 'calendar_event.subscription_postponed'."""
    calendar_router._holidays_cache.clear()
    # billing_day=15 → March 15 2026 is Sunday — shifts to March 16
    res = client.post("/api/v1/credit-cards/", json={**_CARD, "due_day": 10})
    card_id = res.json()["id"]
    client.post(
        f"/api/v1/credit-cards/{card_id}/subscriptions",
        json={"name": "Spotify", "amount": 21.90, "billing_day": 15, "active": True},
    )

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    sub_events = [e for e in events if "Spotify" in e.get("description", "")]
    assert len(sub_events) == 1
    assert sub_events[0]["day"] == 16
    assert sub_events[0]["description_key"] == "calendar_event.subscription_postponed"
    assert sub_events[0]["description_params"] == {
        "name": "Spotify",
        "card": "Nubank",
        "original_day": "15",
    }


def test_salary_postponed_has_description_key(client: TestClient) -> None:
    """Salary shifted due to weekend should have description_key 'calendar_event.salary_postponed'."""
    calendar_router._holidays_cache.clear()
    # split_first_day=15 → March 15 2026 is Sunday — shifts to March 16
    client.post("/api/v1/salary-plans/", json={**_SALARY_PLAN, "split_first_day": 15})

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    salary_events = [e for e in events if e.get("type") == "salary"]
    assert len(salary_events) > 0
    shifted = [e for e in salary_events if e.get("day") == 16]
    assert len(shifted) == 1
    assert shifted[0]["description_key"] == "calendar_event.salary_postponed"
    assert shifted[0]["description_params"] == {
        "employer": "Acme Corp",
        "original_day": "15",
    }


def test_salary_split_has_description_keys(client: TestClient) -> None:
    """Split salary plan should produce two events with correct keys."""
    calendar_router._holidays_cache.clear()
    client.post("/api/v1/salary-plans/", json=_SALARY_PLAN_SPLIT)

    with patch(_PATCH_TARGET, return_value=[]):
        response = client.get("/api/v1/calendar/2026/3")

    events = response.json()
    salary_events = [e for e in events if e.get("type") == "salary"]
    assert len(salary_events) == 2

    keys = {e["description_key"] for e in salary_events}
    assert "calendar_event.salary_first" in keys
    assert "calendar_event.salary_second" in keys

    first = next(
        e
        for e in salary_events
        if e["description_key"] == "calendar_event.salary_first"
    )
    second = next(
        e
        for e in salary_events
        if e["description_key"] == "calendar_event.salary_second"
    )

    assert first["description_params"] == {"employer": "Split Corp"}
    assert second["description_params"] == {"employer": "Split Corp"}
