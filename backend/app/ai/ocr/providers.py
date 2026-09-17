from app.ai.ocr.base import OCRProvider
from app.ai.providers.factory import get_ai_provider


class StubOCRProvider(OCRProvider):
    name = "stub"

    def extract_text(self, images: list[bytes]) -> str:
        return (
            "[Demo OCR] No OCR credentials configured. "
            "Edit the extracted text with what you wrote, then evaluate."
        )


class VisionLLMOCRProvider(OCRProvider):
    name = "vision_llm"

    def extract_text(self, images: list[bytes]) -> str:
        return get_ai_provider().transcribe_images(images, hint="Preserve math and code layout.")


class AzureOCRProvider(OCRProvider):
    name = "azure"

    def __init__(self) -> None:
        from azure.ai.documentintelligence import DocumentIntelligenceClient
        from azure.core.credentials import AzureKeyCredential

        from app.core.config import settings

        self.client = DocumentIntelligenceClient(
            endpoint=settings.azure_document_intelligence_endpoint,
            credential=AzureKeyCredential(settings.azure_document_intelligence_key),
        )

    def extract_text(self, images: list[bytes]) -> str:
        chunks: list[str] = []
        for image in images:
            poller = self.client.begin_analyze_document(
                "prebuilt-read", body=image, content_type="application/octet-stream"
            )
            result = poller.result()
            chunks.append(result.content or "")
        return "\n\n".join(chunks)
