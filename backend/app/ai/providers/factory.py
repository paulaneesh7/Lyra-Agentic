from app.ai.providers.base import AIProvider
from app.ai.providers.openai import AzureOpenAIProvider, OpenAIProvider
from app.ai.providers.stub import StubAIProvider
from app.core.config import settings


def get_ai_provider() -> AIProvider:
    if settings.ai_provider == "openai" and settings.openai_api_key:
        return OpenAIProvider()
    if settings.ai_provider == "azure_openai" and settings.azure_openai_api_key:
        return AzureOpenAIProvider()
    return StubAIProvider()
