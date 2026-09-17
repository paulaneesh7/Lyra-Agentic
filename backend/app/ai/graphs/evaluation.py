from typing import Any, TypedDict

from langgraph.graph import END, StateGraph
from pydantic import ValidationError

from app.ai.prompts import get_prompt
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas.outputs import EVALUATION_JSON_SCHEMA, EvaluationResult
from app.core.logging import logger


class EvaluationState(TypedDict, total=False):
    question_text: str
    solution_text: str
    extracted_text: str
    question_type: str
    official_answer: str
    topic: str
    result: dict[str, Any]
    error: str


def _normalize(state: EvaluationState) -> EvaluationState:
    extracted = state.get("extracted_text", "").strip()
    if extracted and not state.get("solution_text"):
        state["solution_text"] = extracted
    return state


def _evaluate(state: EvaluationState) -> EvaluationState:
    provider = get_ai_provider()
    version, system = get_prompt("evaluation")
    user = (
        f"Question type: {state.get('question_type')}\n"
        f"Topic: {state.get('topic') or 'unspecified'}\n"
        f"Official answer if trusted (may be empty): {state.get('official_answer') or 'NONE'}\n\n"
        f"QUESTION:\n{state.get('question_text')}\n\n"
        f"STUDENT SOLUTION:\n{state.get('solution_text')}\n\n"
        f"OCR / extracted text (may be noisy):\n{state.get('extracted_text')}"
    )
    raw = provider.complete_json(
        system=system,
        user=user,
        schema_name="evaluation",
        schema=EVALUATION_JSON_SCHEMA,
    )
    try:
        parsed = EvaluationResult.model_validate(raw)
        state["result"] = parsed.model_dump()
        state["result"]["prompt_version"] = version
        state["result"]["provider"] = provider.name
    except ValidationError as exc:
        logger.warning("evaluation_validation_failed", error=str(exc))
        repaired = provider.complete_json(
            system=system + "\nYour previous JSON failed validation. Repair it.",
            user=f"Invalid payload: {raw}\nError: {exc}",
            schema_name="evaluation",
            schema=EVALUATION_JSON_SCHEMA,
        )
        parsed = EvaluationResult.model_validate(repaired)
        state["result"] = parsed.model_dump()
        state["result"]["prompt_version"] = version
        state["result"]["provider"] = provider.name
    return state


def build_evaluation_graph():
    graph = StateGraph(EvaluationState)
    graph.add_node("normalize", _normalize)
    graph.add_node("evaluate", _evaluate)
    graph.set_entry_point("normalize")
    graph.add_edge("normalize", "evaluate")
    graph.add_edge("evaluate", END)
    return graph.compile()


evaluation_graph = build_evaluation_graph()
