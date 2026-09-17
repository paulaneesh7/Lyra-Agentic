from abc import ABC, abstractmethod


class OCRProvider(ABC):
    name: str

    @abstractmethod
    def extract_text(self, images: list[bytes]) -> str:
        raise NotImplementedError
