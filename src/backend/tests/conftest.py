import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base
from app.deps import get_db
from app.main import app
from app import models  # noqa: F401


@pytest.fixture()
def make_user():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override

    def make(name: str) -> TestClient:
        c = TestClient(app)  # own cookie jar per user
        r = c.post("/api/auth/register", json={"email": f"{name}@example.com", "name": name.title(), "password": "password123"})
        assert r.status_code == 201
        return c

    yield make
    app.dependency_overrides.clear()


@pytest.fixture()
def world(make_user):
    """alice owns a doc; bob=editor, carol=viewer, dave=stranger; erin exists as a share target."""
    w = {n: make_user(n) for n in ["alice", "bob", "carol", "dave", "erin"]}
    doc_id = w["alice"].post("/api/documents", json={"title": "Plan"}).json()["id"]
    assert w["alice"].post(f"/api/documents/{doc_id}/shares", json={"email": "bob@example.com", "role": "editor"}).status_code == 201
    assert w["alice"].post(f"/api/documents/{doc_id}/shares", json={"email": "carol@example.com", "role": "viewer"}).status_code == 201
    w["doc_id"] = doc_id
    return w