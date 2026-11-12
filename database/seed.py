import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src" / "backend"))
from sqlalchemy import select
from app.core.security import hash_password
from app.db import SessionLocal
from app.models import Document, Role, Share, User

USERS = [("alice@example.com", "Alice"), ("bob@example.com", "Bob"), ("carol@example.com", "Carol")]


def run() -> None:
    with SessionLocal() as db:
        ids = {}
        for email, name in USERS:
            u = db.scalar(select(User).where(User.email == email))
            if not u:
                u = User(email=email, name=name, password_hash=hash_password("password123"))
                db.add(u)
                db.flush()
            ids[name] = u.id
        if not db.scalar(select(Document).where(Document.owner_id == ids["Alice"])):
            doc = Document(owner_id=ids["Alice"], title="Welcome to Ajaia Docs", content={
                "type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Shared with Bob as an editor."}]}]})
            db.add(doc)
            db.flush()
            db.add(Share(document_id=doc.id, user_id=ids["Bob"], role=Role.editor))
        db.commit()


if __name__ == "__main__":
    run()
