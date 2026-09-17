from pathlib import Path

from app.ai.storage import get_storage


class JobQueue:
    """In-process job runner. Swap for Redis/RQ or Celery without changing services."""

    def submit(self, fn, *args, **kwargs):
        return fn(*args, **kwargs)


job_queue = JobQueue()
storage_root = Path("storage")
