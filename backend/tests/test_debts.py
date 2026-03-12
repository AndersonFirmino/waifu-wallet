from __future__ import annotations

from fastapi.testclient import TestClient

_DEBT: dict[str, object] = {
    "name": "Test Debt",
    "total": 5000.0,
    "remaining": 3000.0,
    "rate": 2.5,
    "due_date": "2026-06-01",
    "installments": "3/12",
    "urgent": False,
}

_LOAN: dict[str, object] = {
    "name": "Test Loan",
    "total": 10000.0,
    "remaining": 8000.0,
    "rate": 1.2,
    "installment": 500.0,
    "next_payment": "2026-03-20",
    "installments": "5/24",
}


class TestDebts:
    def test_list_empty(self, client: TestClient) -> None:
        assert client.get("/api/v1/debts/").json() == []

    def test_create(self, client: TestClient) -> None:
        res = client.post("/api/v1/debts/", json=_DEBT)
        assert res.status_code == 201
        body = res.json()
        assert body["name"] == "Test Debt"
        assert isinstance(body["id"], int)

    def test_list_returns_created(self, client: TestClient) -> None:
        client.post("/api/v1/debts/", json=_DEBT)
        assert len(client.get("/api/v1/debts/").json()) == 1

    def test_update(self, client: TestClient) -> None:
        created = client.post("/api/v1/debts/", json=_DEBT).json()
        res = client.put(f"/api/v1/debts/{created['id']}", json={**_DEBT, "remaining": 2000.0})
        assert res.status_code == 200
        assert res.json()["remaining"] == 2000.0

    def test_update_not_found(self, client: TestClient) -> None:
        assert client.put("/api/v1/debts/999", json=_DEBT).status_code == 404

    def test_delete(self, client: TestClient) -> None:
        created = client.post("/api/v1/debts/", json=_DEBT).json()
        assert client.delete(f"/api/v1/debts/{created['id']}").status_code == 204
        assert client.get("/api/v1/debts/").json() == []

    def test_delete_not_found(self, client: TestClient) -> None:
        assert client.delete("/api/v1/debts/999").status_code == 404


class TestLoans:
    def test_list_empty(self, client: TestClient) -> None:
        assert client.get("/api/v1/loans/").json() == []

    def test_create(self, client: TestClient) -> None:
        res = client.post("/api/v1/loans/", json=_LOAN)
        assert res.status_code == 201
        body = res.json()
        assert body["name"] == "Test Loan"
        assert isinstance(body["id"], int)

    def test_list_returns_created(self, client: TestClient) -> None:
        client.post("/api/v1/loans/", json=_LOAN)
        assert len(client.get("/api/v1/loans/").json()) == 1

    def test_update(self, client: TestClient) -> None:
        created = client.post("/api/v1/loans/", json=_LOAN).json()
        res = client.put(f"/api/v1/loans/{created['id']}", json={**_LOAN, "remaining": 6000.0})
        assert res.status_code == 200
        assert res.json()["remaining"] == 6000.0

    def test_update_not_found(self, client: TestClient) -> None:
        assert client.put("/api/v1/loans/999", json=_LOAN).status_code == 404

    def test_delete(self, client: TestClient) -> None:
        created = client.post("/api/v1/loans/", json=_LOAN).json()
        assert client.delete(f"/api/v1/loans/{created['id']}").status_code == 204
        assert client.get("/api/v1/loans/").json() == []

    def test_delete_not_found(self, client: TestClient) -> None:
        assert client.delete("/api/v1/loans/999").status_code == 404
