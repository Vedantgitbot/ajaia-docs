from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- auth ---
class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)

class UserOut(ORM):
    id: str
    email: str
    name: str


# --- documents ---
class DocCreate(BaseModel):
    title: str = Field(default="Untitled", min_length=1, max_length=200)
    content: dict[str, Any] | None = None

class DocUpdate(BaseModel):
    version: int = Field(ge=1)                      # version the client last saw
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: dict[str, Any] | None = None

class DocSummary(ORM):
    id: str
    title: str
    owner: UserOut
    updated_at: datetime
    access: Literal["owner", "editor", "viewer"]

class DocOut(DocSummary):
    content: dict[str, Any]
    version: int

class ShareIn(BaseModel):
    email: EmailStr
    role: Literal["editor", "viewer"]

class ShareOut(BaseModel):
    user: UserOut
    role: Literal["editor", "viewer"]