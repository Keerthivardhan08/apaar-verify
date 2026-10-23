def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["demo_mode"] is True


def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@aicte.gov.in", "password": "Demo@1234"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "testadmin@aicte.gov.in"


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@aicte.gov.in", "password": "WrongPassword"},
    )
    assert response.status_code == 401


def test_get_me(client, admin_token):
    response = client.get(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testadmin@aicte.gov.in"
    roles = [r["role"] for r in data["roles"]]
    assert "aicte_admin" in roles


def test_unauthorized_access(client):
    response = client.get("/api/v1/me")
    assert response.status_code in (401, 403)
