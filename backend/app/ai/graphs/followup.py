from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.ai.prompts import get_prompt

INTENT_GUIDES = {
    "diagnose": (
        "Intent: diagnose a mistake. Explain what was wrong, why it loses marks, "
        "and the one-line safer phrasing."
    ),
    "approach": (
        "Intent: better answer-sheet approach. Give a compact GATE-style write-up "
        "the student could actually write under time pressure."
    ),
    "complexity": (
        "Intent: complexity. State time and space only if the topic warrants it; "
        "otherwise say why complexity is not the scoring point."
    ),
    "trap": (
        "Intent: GATE trap. Name the common confusion, the wrong instinct, and the check."
    ),
    "explain": (
        "Intent: general follow-up. Answer the student's question using the evaluation context."
    ),
}


class FollowUpState(TypedDict, total=False):
    question_text: str
    solution_text: str
    extracted_text: str
    score: float
    verdict: str
    result: dict[str, Any]
    history: list[dict[str, str]]
    user_message: str
    intent: str
    brief: str
    system_prompt: str
    user_prompt: str


def route_intent(message: str) -> str:
    text = (message or "").lower()
    if any(token in text for token in ("trap", "pitfall", "confused with")):
        return "trap"
    if any(token in text for token in ("wrong", "mistake", "error", "why is this")):
        return "diagnose"
    if any(token in text for token in ("complex", "big-o", "runtime", "space")):
        return "complexity"
    if any(token in text for token in ("better", "approach", "rewrite", "model answer")):
        return "approach"
    return "explain"


def _retrieve(state: FollowUpState) -> FollowUpState:
    result = state.get("result") or {}
    strengths = result.get("strengths") or []
    mistakes = result.get("mistakes") or []
    state["verdict"] = state.get("verdict") or ""
    state["brief"] = (
        f"Score {state.get('score')}/10 · {state.get('verdict')}\n"
        f"Strengths: {'; '.join(str(s) for s in strengths[:4])}\n"
        f"Mistakes: {'; '.join(str(s) for s in mistakes[:4])}\n"
        f"Better approach: {(result.get('better_approach') or '')[:700]}\n"
        f"Trap: {(result.get('common_trap') or '')[:400]}\n"
        f"Correction: {(result.get('corrected_solution') or '')[:900]}"
    )
    return state


def _route(state: FollowUpState) -> FollowUpState:
    state["intent"] = route_intent(state.get("user_message") or "")
    return state


def _assemble(state: FollowUpState) -> FollowUpState:
    _, system = get_prompt("followup")
    intent = state.get("intent") or "explain"
    transcript = "\n".join(
        f"{item.get('role')}: {item.get('content')}" for item in (state.get("history") or [])[-8:]
    )
    state["system_prompt"] = f"{system}\n\n{INTENT_GUIDES.get(intent, INTENT_GUIDES['explain'])}"
    state["user_prompt"] = (
        f"{state.get('brief')}\n\n"
        f"Question:\n{(state.get('question_text') or '')[:1500]}\n\n"
        f"Student solution:\n{(state.get('solution_text') or state.get('extracted_text') or '')[:1800]}\n\n"
        f"Recent chat:\n{transcript or '(none)'}\n\n"
        f"Student follow-up:\n{state.get('user_message')}"
    )
    return state


def build_followup_graph():
    graph = StateGraph(FollowUpState)
    graph.add_node("retrieve", _retrieve)
    graph.add_node("route", _route)
    graph.add_node("assemble", _assemble)
    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "route")
    graph.add_edge("route", "assemble")
    graph.add_edge("assemble", END)
    return graph.compile()


followup_graph = build_followup_graph()
