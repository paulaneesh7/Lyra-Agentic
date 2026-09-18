from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings, settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import RequestContextMiddleware, configure_logging
from app.db.base import Base
from app.db.session import engine
from app.seed import seed_if_needed


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(
        title=settings.app_name,
        description=settings.app_tagline,
        version="0.1.0",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
    )
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(api_router, prefix="/api")

    @app.on_event("startup")
    def _startup() -> None:
        import app.models  # noqa: F401
        from app.core.logging import logger

        Base.metadata.create_all(bind=engine)
        _ensure_flashcard_columns()
        _ensure_evaluation_columns()
        try:
            seed_if_needed()
        except Exception:
            logger.exception("seed_failed")


    @app.get("/health")
    def health() -> dict:
        current = get_settings()
        return {
            "status": "ok",
            "app": current.app_name,
            "google_oauth": current.google_oauth_configured,
        }

    return app


def _ensure_flashcard_columns() -> None:
    from sqlalchemy import text

    statements = [
        "ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS subject_name VARCHAR(200) DEFAULT ''",
        "ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS unit_name VARCHAR(200) DEFAULT ''",
        "ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS paper_code VARCHAR(16) DEFAULT 'CS'",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


def _ensure_evaluation_columns() -> None:
    from sqlalchemy import text
    from app.core.logging import logger

    try:
        with engine.begin() as conn:
            conn.execute(text("SET lock_timeout = '4s'"))
            conn.execute(text("ALTER TABLE evaluations ALTER COLUMN verdict TYPE TEXT"))
    except Exception:
        logger.exception("evaluation_verdict_column_migrate_skipped")


app = create_app()
