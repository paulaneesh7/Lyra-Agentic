from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.ai.prompts import get_prompt
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas.outputs import FLASHCARD_JSON_SCHEMA, FlashcardBatch


class FlashcardState(TypedDict, total=False):
    paper: str
    subject: str
    unit: str
    topic: str
    focus: str
    count: int
    notes: str
    difficulty: str
    include_complexity: bool
    include_traps: bool
    include_nat: bool
    include_mnemonics: bool
    include_compare: bool
    exam_weight: str
    card_format: str
    cards: list[dict[str, Any]]


def _generate(state: FlashcardState) -> FlashcardState:
    provider = get_ai_provider()
    _, system = get_prompt("flashcards")
    extras = []
    if state.get("include_complexity"):
        extras.append("Include time/space complexity where it is standard.")
    if state.get("include_traps"):
        extras.append("Include at least two common GATE traps or confusions.")
    if state.get("include_nat"):
        extras.append("Include 1-2 practice numerical (NAT-style) cards with working. Not official NAT.")
    if state.get("include_mnemonics"):
        extras.append("Where helpful, add a short mnemonic on the back.")
    if state.get("include_compare"):
        extras.append("Include 1-2 compare/contrast cards (e.g. TCP vs UDP, 3NF vs BCNF, DFA vs NFA).")
    weight = state.get("exam_weight") or "mixed"
    fmt = state.get("card_format") or "qa"
    extras.append(f"Exam-weight flavour: {weight} (1-mark = crisp recall; 2-mark = short derivation or reason; mixed = both).")
    extras.append(
        "Card format: "
        + {
            "cloze": "cloze/fill-in-the-blank fronts (hide the key term).",
            "compare": "mostly X vs Y fronts.",
            "formula": "mostly formula/complexity recall.",
        }.get(fmt, "standard Q&A fronts a student can answer in 20 seconds.")
    )
    user = (
        f"Paper: GATE {state.get('paper') or 'CS'}\n"
        f"Subject: {state.get('subject')}\nUnit: {state.get('unit') or 'n/a'}\n"
        f"Topic: {state.get('topic')}\nFocus: {state.get('focus')}\n"
        f"Difficulty mix: {state.get('difficulty') or 'mixed'}\n"
        f"Count: {state.get('count', 8)}\n"
        f"Extra requirements: {'; '.join(extras) or 'none'}\n"
        f"Optional notes:\n{state.get('notes') or 'None'}"
    )
    raw = provider.complete_json(
        system=system,
        user=user,
        schema_name="flashcards",
        schema=FLASHCARD_JSON_SCHEMA,
    )
    batch = FlashcardBatch.model_validate(raw)
    state["cards"] = [card.model_dump() for card in batch.cards[: state.get("count", 8)]]
    return state


def build_flashcard_graph():
    graph = StateGraph(FlashcardState)
    graph.add_node("generate", _generate)
    graph.set_entry_point("generate")
    graph.add_edge("generate", END)
    return graph.compile()


flashcard_graph = build_flashcard_graph()
