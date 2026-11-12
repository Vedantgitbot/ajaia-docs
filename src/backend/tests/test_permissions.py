import pytest

ACTIONS = {
    "read": lambda c, d: c.get(f"/api/documents/{d}"),
    "write": lambda c, d: c.patch(f"/api/documents/{d}", json={"version": 1, "title": "x"}),
    "share": lambda c, d: c.post(f"/api/documents/{d}/shares", json={"email": "erin@example.com", "role": "viewer"}),
    "delete": lambda c, d: c.delete(f"/api/documents/{d}"),
}
WHO = {"owner": "alice", "editor": "bob", "viewer": "carol", "stranger": "dave"}

MATRIX = [
    ("owner", "read", 200), ("editor", "read", 200), ("viewer", "read", 200), ("stranger", "read", 404),
    ("owner", "write", 200), ("editor", "write", 200), ("viewer", "write", 403), ("stranger", "write", 404),
    ("owner", "share", 201), ("editor", "share", 403), ("viewer", "share", 403), ("stranger", "share", 404),
    ("owner", "delete", 204), ("editor", "delete", 403), ("viewer", "delete", 403), ("stranger", "delete", 404),
]


@pytest.mark.parametrize("role,action,expected", MATRIX, ids=[f"{r}-{a}" for r, a, _ in MATRIX])
def test_permission_matrix(world, role, action, expected):
    resp = ACTIONS[action](world[WHO[role]], world["doc_id"])
    assert resp.status_code == expected


def test_unauthenticated_is_401(world):
    from fastapi.testclient import TestClient
    from app.main import app
    assert TestClient(app).get("/api/documents").status_code == 401


def test_stale_version_returns_409(world):
    c, d = world["alice"], world["doc_id"]
    assert c.patch(f"/api/documents/{d}", json={"version": 1, "title": "A"}).json()["version"] == 2
    assert c.patch(f"/api/documents/{d}", json={"version": 1, "title": "B"}).status_code == 409


def test_dashboard_labels_owned_vs_shared(world):
    assert world["alice"].get("/api/documents").json()[0]["access"] == "owner"
    assert world["bob"].get("/api/documents").json()[0]["access"] == "editor"
    assert world["carol"].get("/api/documents").json()[0]["access"] == "viewer"
    assert world["dave"].get("/api/documents").json() == []


def test_revoke_removes_access(world):
    d = world["doc_id"]
    bob_id = world["bob"].get("/api/auth/me").json()["id"]
    assert world["alice"].delete(f"/api/documents/{d}/shares/{bob_id}").status_code == 204
    assert world["bob"].get(f"/api/documents/{d}").status_code == 404