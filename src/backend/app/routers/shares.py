from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import Role, Share, User
from app.schemas import ShareIn, ShareOut, UserOut
from app.services.permissions import Access, require_access

router = APIRouter(prefix="/api/documents/{doc_id}/shares", tags=["shares"])


def _out(s: Share) -> ShareOut:
    return ShareOut(user=UserOut.model_validate(s.user), role=s.role.value)


@router.get("", response_model=list[ShareOut])
def list_shares(doc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc, _ = require_access(db, doc_id, user, Access.owner)
    return [_out(s) for s in doc.shares]


@router.post("", response_model=ShareOut, status_code=201)
def grant(doc_id: str, body: ShareIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc, _ = require_access(db, doc_id, user, Access.owner)
    target = db.scalar(select(User).where(User.email == body.email.lower()))
    if target is None:
        raise HTTPException(404, "No user with that email")
    if target.id == user.id:
        raise HTTPException(422, "You already own this document")
    share = db.scalar(select(Share).where(Share.document_id == doc.id, Share.user_id == target.id))
    if share:
        share.role = Role(body.role)          # re-sharing updates the role
    else:
        share = Share(document_id=doc.id, user_id=target.id, role=Role(body.role))
        db.add(share)
    db.commit()
    return _out(share)


@router.delete("/{user_id}", status_code=204)
def revoke(doc_id: str, user_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc, _ = require_access(db, doc_id, user, Access.owner)
    share = db.scalar(select(Share).where(Share.document_id == doc.id, Share.user_id == user_id))
    if share is None:
        raise HTTPException(404, "Share not found")
    db.delete(share)
    db.commit()