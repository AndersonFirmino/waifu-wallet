from __future__ import annotations

from fastapi.testclient import TestClient


def test_get_settings_returns_language_and_currency(client: TestClient) -> None:
    response = client.get("/api/v1/settings/")
    assert response.status_code == 200
    data = response.json()
    assert "language" in data
    assert "currency" in data
    assert data["language"] == "pt-BR"
    assert data["currency"] == "BRL"


def test_patch_settings_language(client: TestClient) -> None:
    response = client.patch("/api/v1/settings/", json={"language": "en"})
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "en"


def test_patch_settings_currency(client: TestClient) -> None:
    response = client.patch("/api/v1/settings/", json={"currency": "USD"})
    assert response.status_code == 200
    data = response.json()
    assert data["currency"] == "USD"


def test_patch_preserves_other_fields(client: TestClient) -> None:
    # Set language first
    client.patch("/api/v1/settings/", json={"language": "en"})
    # Now update only currency
    response = client.patch("/api/v1/settings/", json={"currency": "EUR"})
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "en"
    assert data["currency"] == "EUR"
