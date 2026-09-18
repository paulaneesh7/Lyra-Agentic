from app.ai.graphs.followup import followup_graph, route_intent
from app.ai.prompts import ACTIVE_PROMPTS, get_prompt


def test_followup_prompt_is_registered():
    version, body = get_prompt("followup")
    assert version == "followup_v1"
    assert "evaluation" in body.lower()
    assert "followup" in ACTIVE_PROMPTS


def test_followup_intent_routing():
    assert route_intent("Why is this wrong?") == "diagnose"
    assert route_intent("Better approach") == "approach"
    assert route_intent("GATE trap") == "trap"
    assert route_intent("What is the time complexity?") == "complexity"
    assert route_intent("Can you explain circular wait?") == "explain"


def test_followup_graph_assembles_prompts():
    packet = followup_graph.invoke(
        {
            "question_text": "Differentiate deadlock and starvation.",
            "solution_text": "Deadlock is circular wait.",
            "score": 9,
            "verdict": "Strong",
            "result": {
                "strengths": ["Named circular wait"],
                "mistakes": ["Skipped other Coffman conditions"],
                "better_approach": "List all four conditions.",
                "common_trap": "Treating circular wait as sufficient.",
                "corrected_solution": "Define both, then Coffman.",
            },
            "history": [],
            "user_message": "Better approach",
        }
    )
    assert packet["intent"] == "approach"
    assert "student follow-up" in packet["user_prompt"].lower()
    assert packet["system_prompt"]
