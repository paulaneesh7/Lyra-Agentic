from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.ai.prompts import get_prompt
from app.ai.providers.factory import get_ai_provider


class TutorState(TypedDict, total=False):
    mode: str
    paper: str
    subject: str
    weak_topics: list[str]
    history: list[dict[str, str]]
    user_message: str
    reply: str


def _respond(state: TutorState) -> TutorState:
    provider = get_ai_provider()
    _, system = get_prompt("tutor")
    weak = ", ".join(state.get("weak_topics") or []) or "none supplied"
    transcript = "\n".join(
        f"{item['role']}: {item['content']}" for item in state.get("history") or []
    )
    user = (
        f"Mode: {state.get('mode')}\nPaper: {state.get('paper')}\n"
        f"Subject: {state.get('subject') or 'general'}\nWeak topics: {weak}\n\n"
        f"Conversation:\n{transcript}\n\nStudent: {state.get('user_message')}"
    )
    state["reply"] = provider.complete_text(system=system, user=user)
    return state


def build_tutor_graph():
    graph = StateGraph(TutorState)
    graph.add_node("respond", _respond)
    graph.set_entry_point("respond")
    graph.add_edge("respond", END)
    return graph.compile()


tutor_graph = build_tutor_graph()
