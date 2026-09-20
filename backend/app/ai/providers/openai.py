import json
from collections.abc import Iterator
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import AzureChatOpenAI, ChatOpenAI

from app.ai.providers.base import AIProvider
from app.ai.tracing import langchain_config
from app.core.config import settings


class OpenAIProvider(AIProvider):
    name = "openai"

    def __init__(self) -> None:
        chat_kwargs: dict[str, Any] = {
            "api_key": settings.openai_api_key,
            "model": settings.openai_model,
        }
        vision_kwargs: dict[str, Any] = {
            "api_key": settings.openai_api_key,
            "model": settings.openai_vision_model,
        }
        if not settings.openai_model.startswith("gpt-5"):
            chat_kwargs["temperature"] = 0.2
        if not settings.openai_vision_model.startswith("gpt-5"):
            vision_kwargs["temperature"] = 0
        self.chat = ChatOpenAI(**chat_kwargs)
        self.vision = ChatOpenAI(**vision_kwargs)

    def complete_json(
        self,
        *,
        system: str,
        user: str,
        schema_name: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        prompt = (
            f"{user}\n\nReturn ONLY valid JSON that matches this JSON Schema "
            f"({schema_name}):\n{json.dumps(schema)}"
        )
        result = self.chat.invoke(
            [SystemMessage(content=system), HumanMessage(content=prompt)],
            config=langchain_config(run_name=f"complete_json:{schema_name}"),
        )
        return _parse_json(str(result.content))

    async def acomplete_json(
        self,
        *,
        system: str,
        user: str,
        schema_name: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        prompt = (
            f"{user}\n\nReturn ONLY valid JSON that matches this JSON Schema "
            f"({schema_name}):\n{json.dumps(schema)}"
        )
        result = await self.chat.ainvoke(
            [SystemMessage(content=system), HumanMessage(content=prompt)],
            config=langchain_config(run_name=f"acomplete_json:{schema_name}"),
        )
        return _parse_json(str(result.content))

    def complete_text(self, *, system: str, user: str) -> str:
        result = self.chat.invoke(
            [SystemMessage(content=system), HumanMessage(content=user)],
            config=langchain_config(run_name="complete_text"),
        )
        return str(result.content)

    async def acomplete_text(self, *, system: str, user: str) -> str:
        result = await self.chat.ainvoke(
            [SystemMessage(content=system), HumanMessage(content=user)],
            config=langchain_config(run_name="acomplete_text"),
        )
        return str(result.content)

    def stream_text(self, *, system: str, user: str) -> Iterator[str]:
        yield from _stream_chat(self.chat, system, user, run_name="stream_text")

    def transcribe_images(self, image_bytes: list[bytes], hint: str = "") -> str:
        import base64

        parts: list[dict[str, Any]] = [
            {
                "type": "text",
                "text": (
                    "Transcribe handwritten GATE solutions faithfully. "
                    "Do not solve the problem. Do not invent missing text. "
                    f"{hint}"
                ),
            }
        ]
        for raw in image_bytes:
            b64 = base64.b64encode(raw).decode("ascii")
            parts.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                }
            )
        result = self.vision.invoke(
            [HumanMessage(content=parts)],
            config=langchain_config(run_name="transcribe_images"),
        )
        return str(result.content)


class AzureOpenAIProvider(AIProvider):
    name = "azure_openai"

    def __init__(self) -> None:
        self.chat = AzureChatOpenAI(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
            azure_deployment=settings.azure_openai_deployment,
            temperature=0.2,
        )

    def complete_json(
        self,
        *,
        system: str,
        user: str,
        schema_name: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        prompt = (
            f"{user}\n\nReturn ONLY valid JSON matching schema {schema_name}:\n"
            f"{json.dumps(schema)}"
        )
        result = self.chat.invoke(
            [SystemMessage(content=system), HumanMessage(content=prompt)],
            config=langchain_config(run_name=f"complete_json:{schema_name}"),
        )
        return _parse_json(str(result.content))

    def complete_text(self, *, system: str, user: str) -> str:
        result = self.chat.invoke(
            [SystemMessage(content=system), HumanMessage(content=user)],
            config=langchain_config(run_name="complete_text"),
        )
        return str(result.content)

    def stream_text(self, *, system: str, user: str) -> Iterator[str]:
        yield from _stream_chat(self.chat, system, user, run_name="stream_text")

    def transcribe_images(self, image_bytes: list[bytes], hint: str = "") -> str:
        helper = OpenAIProvider.__new__(OpenAIProvider)
        helper.vision = self.chat
        return OpenAIProvider.transcribe_images(helper, image_bytes, hint)


def _stream_chat(
    chat: Any,
    system: str,
    user: str,
    *,
    run_name: str = "stream_text",
) -> Iterator[str]:
    config = langchain_config(run_name=run_name)
    stream = (
        chat.stream([SystemMessage(content=system), HumanMessage(content=user)], config=config)
        if config
        else chat.stream([SystemMessage(content=system), HumanMessage(content=user)])
    )
    for chunk in stream:
        content = getattr(chunk, "content", None)
        if isinstance(content, str) and content:
            yield content
        elif isinstance(content, list):
            for part in content:
                if isinstance(part, str) and part:
                    yield part
                elif isinstance(part, dict) and part.get("type") == "text" and part.get("text"):
                    yield str(part["text"])


def _parse_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    return json.loads(cleaned)
