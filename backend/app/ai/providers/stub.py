import json
from collections.abc import Iterator
from typing import Any

from app.ai.providers.base import AIProvider


class StubAIProvider(AIProvider):
    name = "stub"

    def complete_json(
        self,
        *,
        system: str,
        user: str,
        schema_name: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        if schema_name == "evaluation":
            return {
                "score": 7.5,
                "verdict": "Mostly correct",
                "correctness": 4,
                "approach": 4,
                "reasoning": 3,
                "efficiency": 4,
                "strengths": [
                    "Identified the right core idea",
                    "Kept the solution structured",
                ],
                "mistakes": ["A boundary condition was not discussed"],
                "missing_concepts": ["Worst-case vs average-case complexity"],
                "corrected_solution": "Restate the algorithm, handle empty input, then derive complexity.",
                "better_approach": "Prefer a standard textbook method and mention edge cases explicitly.",
                "key_takeaways": ["State assumptions.", "Prove correctness on a small example."],
                "common_trap": "Skipping the empty/null input case.",
                "final_answer": "See corrected solution. This is an AI explanation, not an official GATE key.",
                "confidence": 0.46,
                "uncertainty_notes": "No official answer key was supplied. Treat the score as formative feedback.",
                "is_official_answer": False,
            }
        if schema_name == "flashcards":
            cards = []
            for i in range(5):
                cards.append(
                    {
                        "front": f"Sample concept prompt {i + 1}",
                        "back": "Concise definition. Label: AI-generated study aid.",
                        "explanation": "Use this to revise, not as an official GATE statement.",
                        "difficulty": "medium",
                        "tags": ["demo"],
                    }
                )
            return {"cards": cards}
        if schema_name == "study_plan":
            return {
                "weekly_targets": ["Finish OS scheduling", "Revise DBMS normalization"],
                "tasks": [
                    {
                        "title": "Practice 8 medium questions on Scheduling",
                        "task_type": "practice",
                        "day_offset": 0,
                    },
                    {
                        "title": "Review due flashcards",
                        "task_type": "flashcards",
                        "day_offset": 0,
                    },
                ],
            }
        return {"text": "stub"}

    def complete_text(self, *, system: str, user: str) -> str:
        return (
            "I am Qubrix's study companion in demo mode. "
            "Connect an OpenAI or Azure OpenAI key to enable live tutoring. "
            f"You asked: {user[:280]}"
        )

    def stream_text(self, *, system: str, user: str) -> Iterator[str]:
        text = self.complete_text(system=system, user=user)
        for word in text.split(" "):
            yield word + " "

    def transcribe_images(self, image_bytes: list[bytes], hint: str = "") -> str:
        return (
            "[Demo OCR] Handwriting could not be read because no OCR provider key is configured. "
            "Please type or paste the extracted text before evaluation."
        )
