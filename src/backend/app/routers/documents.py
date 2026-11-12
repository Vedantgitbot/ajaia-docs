from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select, update
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import Document, Share, User
from app.schemas import DocCreate, DocOut, DocSummary, DocUpdate
from app.services.permissions import Access, require_access

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _out(doc: Document, access: Access, full: bool = False):
    schema = DocOut if full else DocSummary
    data = {"id": doc.id, "title": doc.title, "owner": doc.owner,
            "updated_at": doc.updated_at, "access": access.name}
    if full:
        data |= {"content": doc.content, "version": doc.version}
    return schema.model_validate(data)


@router.get("", response_model=list[DocSummary])
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = (
        select(Document, Share.role)
        .outerjoin(Share, (Share.document_id == Document.id) & (Share.user_id == user.id))
        .where(or_(Document.owner_id == user.id, Share.id.is_not(None)))
        .order_by(Document.updated_at.desc())
    )
    out = []
    for doc, role in db.execute(stmt).all():
        access = Access.owner if doc.owner_id == user.id else Access[role.value]
        out.append(_out(doc, access))
    return out


@router.post("", response_model=DocOut, status_code=201)
def create_document(body: DocCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc = Document(owner_id=user.id, title=body.title)
    if body.content is not None:
        doc.content = body.content
    db.add(doc)
    db.commit()
    return _out(doc, Access.owner, full=True)


@router.get("/{doc_id}", response_model=DocOut)
def get_document(doc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc, access = require_access(db, doc_id, user, Access.viewer)
    return _out(doc, access, full=True)


@router.patch("/{doc_id}", response_model=DocOut)
def update_document(doc_id: str, body: DocUpdate, db: Session = Depends(get_db),
                    user: User = Depends(get_current_user)):
    doc, access = require_access(db, doc_id, user, Access.editor)
    changes = body.model_dump(exclude_unset=True, exclude={"version"})
    if not changes:
        raise HTTPException(422, "Nothing to update")

    # Atomic compare-and-swap: only applies if the version is still the one the client saw.
    result = db.execute(
        update(Document)
        .where(Document.id == doc_id, Document.version == body.version)
        .values(**changes, version=Document.version + 1)
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(409, "Document was changed by someone else. Reload to get the latest version.")
    db.refresh(doc)
    return _out(doc, access, full=True)


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc, _ = require_access(db, doc_id, user, Access.owner)
    db.delete(doc)
    db.commit()