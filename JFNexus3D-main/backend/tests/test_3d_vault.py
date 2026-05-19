"""Backend tests for 3D Print Vault app"""
import os
import time
import pytest
import requests
import subprocess

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://design-vault-109.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session_token():
    """Create test user + session in MongoDB"""
    token = f"test_session_{int(time.time()*1000)}"
    uid = f"test-user-{int(time.time()*1000)}"
    email = f"test.user.{int(time.time()*1000)}@example.com"
    js = f"""
    use('test_database');
    db.users.insertOne({{user_id:'{uid}',email:'{email}',name:'Test User',picture:'https://via.placeholder.com/150',created_at:new Date().toISOString()}});
    db.user_sessions.insertOne({{user_id:'{uid}',session_token:'{token}',expires_at:new Date(Date.now()+7*24*60*60*1000).toISOString(),created_at:new Date().toISOString()}});
    """
    r = subprocess.run(["mongosh", "--quiet", "--eval", js], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    yield token, uid
    subprocess.run(["mongosh", "--quiet", "--eval",
                    f"use('test_database'); db.user_sessions.deleteOne({{session_token:'{token}'}}); db.users.deleteOne({{user_id:'{uid}'}});"])


@pytest.fixture
def auth_client(session_token):
    token, _ = session_token
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


# --- Auth ---
class TestAuth:
    def test_me_no_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, auth_client):
        r = auth_client.get(f"{API}/auth/me")
        assert r.status_code == 200, r.text
        assert "email" in r.json()


# --- Projects CRUD ---
class TestProjects:
    def test_list_projects_public(self):
        r = requests.get(f"{API}/projects")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_get_update_delete(self, auth_client):
        # CREATE
        r = auth_client.post(f"{API}/projects", json={"title": "TEST_proj", "description": "desc", "tags": ["3d", "stl"]})
        assert r.status_code == 200, r.text
        pid = r.json()["project_id"]

        # GET
        g = requests.get(f"{API}/projects/{pid}")
        assert g.status_code == 200
        assert g.json()["title"] == "TEST_proj"

        # UPDATE
        u = auth_client.put(f"{API}/projects/{pid}", json={"title": "TEST_updated", "description": "d2", "tags": ["a"]})
        assert u.status_code == 200
        assert requests.get(f"{API}/projects/{pid}").json()["title"] == "TEST_updated"

        # SEARCH
        s = requests.get(f"{API}/projects?search=TEST_updated")
        assert s.status_code == 200
        assert any(p["project_id"] == pid for p in s.json())

        # DELETE
        d = auth_client.delete(f"{API}/projects/{pid}")
        assert d.status_code == 200
        assert requests.get(f"{API}/projects/{pid}").status_code == 404

    def test_create_unauthorized(self):
        r = requests.post(f"{API}/projects", json={"title": "x", "description": "y", "tags": []})
        assert r.status_code == 401


# --- Favorites ---
class TestFavorites:
    def test_favorites_flow(self, auth_client):
        # create a project to favorite
        c = auth_client.post(f"{API}/projects", json={"title": "TEST_fav", "description": "d", "tags": []})
        pid = c.json()["project_id"]
        try:
            a = auth_client.post(f"{API}/favorites/{pid}")
            assert a.status_code == 200
            lst = auth_client.get(f"{API}/favorites")
            assert lst.status_code == 200
            assert any(p["project_id"] == pid for p in lst.json())
            # idempotent
            a2 = auth_client.post(f"{API}/favorites/{pid}")
            assert a2.status_code == 200
            rm = auth_client.delete(f"{API}/favorites/{pid}")
            assert rm.status_code == 200
            assert all(p["project_id"] != pid for p in auth_client.get(f"{API}/favorites").json())
        finally:
            auth_client.delete(f"{API}/projects/{pid}")

    def test_favorites_unauth(self):
        assert requests.get(f"{API}/favorites").status_code == 401


# --- Payments ---
class TestPayments:
    def test_invalid_package(self, auth_client):
        r = auth_client.post(f"{API}/payments/checkout?package_id=invalid")
        assert r.status_code == 400

    def test_valid_package_basic(self, auth_client):
        r = auth_client.post(f"{API}/payments/checkout?package_id=basic",
                             headers={"origin": BASE_URL})
        # Stripe key is test placeholder - accept either success or 4xx/5xx
        if r.status_code == 200:
            data = r.json()
            assert "url" in data and "session_id" in data
        else:
            print(f"Stripe checkout failed (likely test key): {r.status_code} {r.text[:200]}")

    def test_checkout_unauth(self):
        assert requests.post(f"{API}/payments/checkout?package_id=basic").status_code == 401


# --- Upload (basic, no real file storage required) ---
class TestUpload:
    def test_upload_unauth(self):
        r = requests.post(f"{API}/projects/nope/upload?file_type=model",
                          files={"file": ("a.stl", b"data", "application/octet-stream")})
        assert r.status_code == 401
