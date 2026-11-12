from pathlib import PurePath

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import Document, User
from app.routers.documents import _out
from app.schemas import DocOut
from app.services.importer import text_to_doc
from app.services.permissions import Access

router = APIRouter(prefix="/api/uploads", tags=["uploads"])
MAX_BYTES = 1_000_000
ALLOWED = {".txt", ".md"}


@router.post("", response_model=DocOut, status_code=201)
def upload(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    name = PurePath(file.filename or "").name
    if PurePath(name).suffix.lower() not in ALLOWED:
        raise HTTPException(415, "Unsupported file type. Allowed: .txt, .md")
    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File too large (max 1 MB)")
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(422, "File must be UTF-8 text")
    if "\x00" in text:
        raise HTTPException(422, "File must be plain text")
    doc = Document(owner_id=user.id, title=(PurePath(name).stem or "Untitled")[:200], content=text_to_doc(text))
    db.add(doc)
    db.commit()
    return _out(doc, Access.owner, full=True)