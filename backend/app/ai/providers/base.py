from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    name: str

    @abstractmethod
    def complete_json(
        self,
        *,
        system: str,
        user: str,
        schema_name: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        """Return parsed JSON matching the provided schema."""

    @abstractmethod
    def complete_text(self, *, system: str, user: str) -> str:
        """Return a plain-text completion."""

    @abstractmethod
    def transcribe_images(self, image_bytes: list[bytes], hint: str = "") -> str:
        """OCR / vision transcription of handwritten pages."""
