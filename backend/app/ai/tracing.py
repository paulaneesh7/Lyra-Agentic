"""Langfuse tracing helpers for LangChain / LangGraph.

Credentials come from Settings (backend/.env). When keys are missing, helpers
are no-ops so local/stub runs stay quiet.
"""

from __future__ import annotations

from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

from app.core.config import settings
from app.core.logging import logger

_user_id: ContextVar[str | None] = ContextVar("langfuse_user_id", default=None)
_session_id: ContextVar[str | None] = ContextVar("langfuse_session_id", default=None)
_tags: ContextVar[tuple[str, ...] | None] = ContextVar("langfuse_tags", default=None)

_client_ready = False
_handler: Any | None = None


def langfuse_enabled() -> bool:
    return settings.langfuse_enabled


def _ensure_client() -> bool:
    """Initialize the Langfuse singleton from Settings (not only os.environ)."""
    global _client_ready
    if not langfuse_enabled():
        return False
    if _client_ready:
        return True
    try:
        from langfuse import Langfuse

        Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            base_url=settings.langfuse_base_url or None,
            environment=settings.app_env,
        )
        _client_ready = True
        return True
    except Exception:
        logger.exception("langfuse_init_failed")
        return False


def get_callback_handler() -> Any | None:
    """Reusable LangChain CallbackHandler (one per process)."""
    global _handler
    if not _ensure_client():
        return None
    if _handler is None:
        try:
            from langfuse.langchain import CallbackHandler

            _handler = CallbackHandler()
        except Exception:
            logger.exception("langfuse_handler_init_failed")
            return None
    return _handler


def langchain_config(
    *,
    run_name: str | None = None,
    metadata: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build an invoke/stream config that attaches Langfuse when enabled."""
    handler = get_callback_handler()
    if handler is None:
        return {}

    meta: dict[str, Any] = dict(metadata or {})
    user_id = _user_id.get()
    session_id = _session_id.get()
    tags = _tags.get()
    if user_id:
        meta["langfuse_user_id"] = user_id
    if session_id:
        meta["langfuse_session_id"] = session_id
    if tags:
        meta["langfuse_tags"] = list(tags)

    config: dict[str, Any] = {"callbacks": [handler], "metadata": meta}
    if run_name:
        config["run_name"] = run_name
    return config


@contextmanager
def tracing_context(
    *,
    user_id: str | None = None,
    session_id: str | None = None,
    tags: list[str] | None = None,
) -> Iterator[None]:
    """Optionally bind user/session/tags for nested LLM calls in this request."""
    tokens: list[tuple[ContextVar[Any], Any]] = []
    if user_id is not None:
        tokens.append((_user_id, _user_id.set(str(user_id))))
    if session_id is not None:
        tokens.append((_session_id, _session_id.set(str(session_id))))
    if tags is not None:
        tokens.append((_tags, _tags.set(tuple(tags))))
    try:
        yield
    finally:
        for var, token in reversed(tokens):
            var.reset(token)


def traced_invoke(runnable: Any, payload: Any, *, name: str, **kwargs: Any) -> Any:
    """Invoke a LangChain/LangGraph runnable with Langfuse callbacks attached."""
    config = langchain_config(run_name=name)
    if config:
        return runnable.invoke(payload, config=config, **kwargs)
    return runnable.invoke(payload, **kwargs)


def flush_langfuse() -> None:
    if not langfuse_enabled() or not _client_ready:
        return
    try:
        from langfuse import get_client

        get_client().flush()
    except Exception:
        logger.exception("langfuse_flush_failed")
