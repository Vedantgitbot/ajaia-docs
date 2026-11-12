from enum import IntEnum

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Document, Share, User


class Access(IntEnum):
    none = 0
    viewer = 1
    editor = 2
    owner = 3


def get_access(db: Session, doc: Document, user: User) -> Access:
    if doc.owner_id == user.id:
        return Access.owner
    share = db.scalar(
        select(Share).where(Share.document_id == doc.id, Share.user_id == user.id)
    )
    if share is None:
        return Access.none
    return Access.editor if share.role.value == "editor" else Access.viewer


def require_access(db: Session, doc_id: str, user: User, minimum: Access) -> tuple[Document, Access]:
    """Loads a doc and enforces a minimum access level.
    Returns 404 (not 403) when the user has no access at all, so doc ids don't leak."""
    doc = db.get(Document, doc_id)
    access = get_access(db, doc, user) if doc else Access.none
    if access == Access.none:
        raise HTTPException(status_code=404, detail="Document not found")
    if access < minimum:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return doc, access