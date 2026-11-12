# Ajaia Docs

A lightweight collaborative document editor inspired by Google Docs. Users can create, rename, edit and reopen rich-text documents, upload `.txt` / `.md` files as new documents, and share documents with other users as an editor or viewer.

**Live app:** https://ajaia-docs-web.onrender.com
**API:** https://ajaia-docs-api-4nq8.onrender.com (`/health`)

> Hosted on Render's free tier. After ~15 minutes idle the first request can take ~50 seconds to wake up. Data is stored in SQLite on an ephemeral disk, so documents created on the live site may be reset when the service restarts. The three demo users are re-seeded on every boot.

## Test accounts

All accounts use the password `password123`.

| User  | Email               |
|-------|---------------------|
| Alice | alice@example.com   |
| Bob   | bob@example.com     |
| Carol | carol@example.com   |

The login page has buttons that prefill each of these. Alice owns a seeded document, "Welcome to Ajaia Docs", which is shared with Bob as an editor. You can also register a new account.

## Features

- **Create, rename, edit, save and reopen documents.** The title is editable inline.
- **Rich text (TipTap):** bold, italic, underline, H1/H2/H3, bulleted and numbered lists, with active states in the toolbar.
- **Autosave:** debounced at about 1 second, with a "Saving… / Saved" indicator.
- **Conflict handling:** every save sends the last known `version`. If the document changed elsewhere, the server returns `409` and the editor shows a "Changed elsewhere, reload" banner instead of overwriting.
- **File upload:** `.txt` and `.md` only, max 1 MB. The file becomes a new editable document. Supported types are stated next to the Upload button.
- **Sharing:** the owner can share by email as **editor** or **viewer**, see current shares and remove access.
- **Owned vs shared:** the dashboard has "Owned by me" and "Shared with me" sections, the latter showing the owner and a role badge.
- **Viewer mode:** viewers get a read-only editor and a locked title. Only the owner can share or delete.
- **Validation and errors:** the API returns `{"error": {"status", "message", "details"}}` and the UI shows `message` in a toast. Loading, empty and error states are handled.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, TipTap v3 |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite (`database/data/app.db`) |
| Auth | Email + password (argon2), JWT in an HttpOnly cookie |
| Tests | pytest + FastAPI TestClient |
| Hosting | Render (two web services, see `render.yaml`) |

## Repository layout

```
database/
  seed.py              # seeds Alice, Bob, Carol and a shared demo doc
src/
  backend/
    app/               # FastAPI app: routers, models, schemas, services
    tests/             # permission matrix, upload and conflict tests
    requirements.txt
  frontend/
    app/               # /login, / (dashboard), /docs/[id] (editor)
    components/        # toolbar, share dialog, document list
    lib/               # API client and types
render.yaml            # Render blueprint (API + web)
pytest.ini
```

## Run locally

Requirements: Python 3.12 and Node 20+.

**Tip:** keep the project outside iCloud-synced folders such as Desktop or Documents. Syncing can corrupt `node_modules` and virtualenvs.

### 1. Backend

```bash
cd src/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# create the SQLite folder and tables, then seed demo users
mkdir -p ../../database/data
python -c "import app.models; from app.db import engine, Base; Base.metadata.create_all(engine)"
python ../../database/seed.py

# run the API on http://localhost:8000
python -m uvicorn app.main:app --reload --port 8000
```

Start the API from `src/backend`. Check it with `curl localhost:8000/health`.

### 2. Frontend

```bash
cd src/frontend
npm ci
npm run dev
```

Open http://localhost:3000/login.

The frontend proxies `/api/*` to the backend through a Next.js rewrite, so the auth cookie stays first-party and no CORS setup is needed. The backend URL comes from `BACKEND_URL` and defaults to `http://localhost:8000`.

### 3. Tests

From the repository root, with the backend virtualenv active:

```bash
python -m pytest -q
```

The suite has 23 tests: a permission matrix (owner, editor, viewer, stranger across read, write, share and delete), 401 for unauthenticated requests, stale-version `409` handling, dashboard owned vs shared labelling, share revocation, and upload validation (valid `.md`, unsupported type, oversized file).

## API summary

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register`, `/api/auth/login` | return `{id, email, name}` and set the cookie |
| POST | `/api/auth/logout` | |
| GET | `/api/auth/me` | `401` if not logged in |
| GET / POST | `/api/documents` | list with `access` of owner, editor or viewer; create |
| GET / PATCH / DELETE | `/api/documents/{id}` | PATCH needs `version`, `409` if stale; DELETE is owner only |
| GET / POST | `/api/documents/{id}/shares` | owner only |
| DELETE | `/api/documents/{id}/shares/{userId}` | owner only |
| POST | `/api/uploads` | multipart `file`, `.txt` or `.md`, max 1 MB |

## Deployment (Render)

`render.yaml` defines two services:

- **ajaia-docs-api:** Python web service. The start command creates the database folder and tables, seeds the demo users, then starts uvicorn. `COOKIE_SECURE=true` and a generated `JWT_SECRET` are set.
- **ajaia-docs-web:** Node web service running `next build` and `next start`. `BACKEND_URL` must point at the API service URL. It is read at build time, so changing it requires a rebuild.

## Known limitations and tradeoffs

- **SQLite on an ephemeral disk.** Free-tier disks reset on restart, so live-site documents are not durable. Demo users are re-seeded on boot.
- **Cold starts.** Free services sleep when idle.
- **Last-write conflict policy.** On a version mismatch the user must reload. There is no merge and no real-time collaboration.
- **Upload scope.** Only `.txt` and `.md`. `.docx` import is not supported.
- **Basic sharing.** Two roles (editor, viewer), shared by existing user email only. No invitations or link sharing.

## What I would build next with another 2-4 hours

1. Move to Render Postgres so data survives restarts.
2. Real-time collaboration indicators, or a merge flow in place of the reload banner.
3. `.docx` import and Markdown / PDF export.
4. Version history, using the existing `version` field as the base.
5. Frontend tests for autosave and the 409 flow.