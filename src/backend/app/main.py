import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.errors import register_error_handlers
from app.routers import auth, documents

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(title="Ajaia Docs API")
app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
register_error_handlers(app)
app.include_router(auth.router)
app.include_router(documents.router)


@app.get("/health")
def health():
    return {"status": "ok"}
