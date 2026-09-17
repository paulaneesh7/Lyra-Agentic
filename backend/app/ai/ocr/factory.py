from app.ai.ocr.base import OCRProvider
from app.ai.ocr.providers import AzureOCRProvider, StubOCRProvider, VisionLLMOCRProvider
from app.core.config import settings


def get_ocr_provider() -> OCRProvider:
    if settings.ocr_provider == "azure" and settings.azure_document_intelligence_key:
        return AzureOCRProvider()
    if settings.ocr_provider == "vision_llm":
        return VisionLLMOCRProvider()
    return StubOCRProvider()
