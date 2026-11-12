from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]  # ajaia-docs/

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = f"sqlite:///{ROOT / 'database' / 'data' / 'app.db'}"
    jwt_secret: str = "dev-only-secret-change-me-in-production-0123456789abcdef"
    jwt_alg: str = "HS256"
    jwt_ttl_minutes: int = 720
    cookie_secure: bool = False  # True in production (HTTPS)
    cors_origins: list[str] = ["http://localhost:3000"]

settings = Settings()