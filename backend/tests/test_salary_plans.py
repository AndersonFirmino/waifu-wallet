from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Base payload — no increment pressure, no split, already at target
# ---------------------------------------------------------------------------
_PAYLOAD: dict[str, object] = {
    "employer": "ACME Corp",
    "current_salary": 5000.0,
    "target_salary": 5000.0,
    "increment": 0.0,
    "increment_interval_months": 1,
    "next_increment_date": "2099-01-01",
    "split_enabled": False,
    "split_first_pct": 100,
    "split_first_day": 5,
    "split_second_pct": 0,
    "split_second_day": 25,
    "active": True,
}


# ===========================================================================
# CRUD
# ===========================================================================


def test_create_salary_plan(client: TestClient) -> None:
    res = client.post("/api/v1/salary-plans/", json=_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["employer"] == "ACME Corp"
    assert body["current_salary"] == 5000.0
    assert body["target_salary"] == 5000.0
    assert body["split_enabled"] is False
    assert body["active"] is True
    assert isinstance(body["id"], int)


def test_list_salary_plans(client: TestClient) -> None:
    client.post("/api/v1/salary-plans/", json=_PAYLOAD)
    client.post("/api/v1/salary-plans/", json={**_PAYLOAD, "employer": "Other Co"})
    data = client.get("/api/v1/salary-plans/").json()
    assert len(data) == 2
    employers = {item["employer"] for item in data}
    assert employers == {"ACME Corp", "Other Co"}


def test_update_salary_plan(client: TestClient) -> None:
    created = client.post("/api/v1/salary-plans/", json=_PAYLOAD).json()
    plan_id = created["id"]
    updated_payload = {**_PAYLOAD, "current_salary": 6000.0, "employer": "New Corp"}
    res = client.put(f"/api/v1/salary-plans/{plan_id}", json=updated_payload)
    assert res.status_code == 200
    body = res.json()
    assert body["current_salary"] == 6000.0
    assert body["employer"] == "New Corp"
    assert body["id"] == plan_id


def test_delete_salary_plan(client: TestClient) -> None:
    created = client.post("/api/v1/salary-plans/", json=_PAYLOAD).json()
    plan_id = created["id"]
    res = client.delete(f"/api/v1/salary-plans/{plan_id}")
    assert res.status_code == 204
    remaining = client.get("/api/v1/salary-plans/").json()
    assert remaining == []


def test_delete_salary_plan_not_found(client: TestClient) -> None:
    assert client.delete("/api/v1/salary-plans/999").status_code == 404


def test_update_salary_plan_not_found(client: TestClient) -> None:
    assert client.put("/api/v1/salary-plans/999", json=_PAYLOAD).status_code == 404


# ===========================================================================
# Schedule projection
# ===========================================================================


def test_schedule_basic(client: TestClient) -> None:
    """No increment (already at target), no split — 3 months all return same salary."""
    created = client.post("/api/v1/salary-plans/", json=_PAYLOAD).json()
    plan_id = created["id"]

    res = client.get(f"/api/v1/salary-plans/{plan_id}/schedule", params={"months": 3})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 3
    for month_entry in data:
        assert month_entry["salary"] == 5000.0
        assert len(month_entry["payments"]) == 1
        assert month_entry["payments"][0]["amount"] == 5000.0


def test_schedule_with_increments(client: TestClient) -> None:
    """
    current=6000, target=12000, increment=2000, interval=2.
    next_increment_date = first of current month so it fires immediately on month 1.
    After firing, next_increment advances by 2 calendar months relative to itself,
    producing the alternating fire/skip pattern every 2 months.

    Month 1: fires → salary 6000→8000
    Month 2: next_inc is current+2 months → no fire → salary 8000
    Month 3: cursor reaches next_inc → fires → salary 8000→10000
    Month 4: no fire → salary 10000
    Month 5: fires → salary 10000→12000
    Month 6: target reached, no fire → salary 12000
    """
    today = date.today()
    # Set next_increment_date to the first of the current month so month 1 fires.
    next_increment_date = date(today.year, today.month, 1).isoformat()

    payload: dict[str, object] = {
        **_PAYLOAD,
        "current_salary": 6000.0,
        "target_salary": 12000.0,
        "increment": 2000.0,
        "increment_interval_months": 2,
        "next_increment_date": next_increment_date,
    }
    created = client.post("/api/v1/salary-plans/", json=payload).json()
    plan_id = created["id"]

    res = client.get(f"/api/v1/salary-plans/{plan_id}/schedule", params={"months": 6})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 6

    salaries = [entry["salary"] for entry in data]
    assert salaries[0] == 8000.0   # month 1: increment applied
    assert salaries[1] == 8000.0   # month 2: no increment yet
    assert salaries[2] == 10000.0  # month 3: increment applied
    assert salaries[3] == 10000.0  # month 4: no increment yet
    assert salaries[4] == 12000.0  # month 5: increment applied, hits target
    assert salaries[5] == 12000.0  # month 6: capped at target


def test_schedule_with_split(client: TestClient) -> None:
    """split_enabled=True, 60/40 on days 10/25 — each month must have 2 payments."""
    payload: dict[str, object] = {
        **_PAYLOAD,
        "current_salary": 10000.0,
        "target_salary": 10000.0,
        "split_enabled": True,
        "split_first_pct": 60,
        "split_first_day": 10,
        "split_second_pct": 40,
        "split_second_day": 25,
    }
    created = client.post("/api/v1/salary-plans/", json=payload).json()
    plan_id = created["id"]

    res = client.get(f"/api/v1/salary-plans/{plan_id}/schedule", params={"months": 3})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 3

    for month_entry in data:
        assert month_entry["salary"] == 10000.0
        payments = month_entry["payments"]
        assert len(payments) == 2

        first = payments[0]
        second = payments[1]

        assert first["day"] == 10
        assert first["amount"] == 6000.0
        assert "60%" in first["label"]

        assert second["day"] == 25
        assert second["amount"] == 4000.0
        assert "40%" in second["label"]


def test_schedule_caps_at_target(client: TestClient) -> None:
    """Increment would overshoot target — salary must clamp to target_salary."""
    payload: dict[str, object] = {
        **_PAYLOAD,
        "current_salary": 9500.0,
        "target_salary": 10000.0,
        "increment": 1000.0,        # would push to 10500, must clamp to 10000
        "increment_interval_months": 1,
        "next_increment_date": "2000-01-01",
    }
    created = client.post("/api/v1/salary-plans/", json=payload).json()
    plan_id = created["id"]

    res = client.get(f"/api/v1/salary-plans/{plan_id}/schedule", params={"months": 3})
    assert res.status_code == 200
    data = res.json()

    # First month: 9500 + 1000 = 10500 → clamped to 10000
    assert data[0]["salary"] == 10000.0
    # Subsequent months: stays at target
    assert data[1]["salary"] == 10000.0
    assert data[2]["salary"] == 10000.0


def test_schedule_not_found(client: TestClient) -> None:
    assert client.get("/api/v1/salary-plans/999/schedule").status_code == 404


# ===========================================================================
# Edge cases
# ===========================================================================


def test_schedule_already_at_target(client: TestClient) -> None:
    """current_salary == target_salary — no increments ever applied."""
    created = client.post("/api/v1/salary-plans/", json=_PAYLOAD).json()
    plan_id = created["id"]

    res = client.get(f"/api/v1/salary-plans/{plan_id}/schedule", params={"months": 6})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 6
    for month_entry in data:
        assert month_entry["salary"] == 5000.0


def test_create_plan_with_split_disabled(client: TestClient) -> None:
    """split_enabled=False — schedule returns exactly 1 payment per month."""
    payload: dict[str, object] = {
        **_PAYLOAD,
        "split_enabled": False,
        "split_first_day": 5,
    }
    created = client.post("/api/v1/salary-plans/", json=payload).json()
    plan_id = created["id"]

    res = client.get(f"/api/v1/salary-plans/{plan_id}/schedule", params={"months": 3})
    assert res.status_code == 200
    data = res.json()
    for month_entry in data:
        assert len(month_entry["payments"]) == 1
        assert month_entry["payments"][0]["amount"] == 5000.0
        assert month_entry["payments"][0]["label"] == "ACME Corp"
        assert month_entry["payments"][0]["day"] == 5
