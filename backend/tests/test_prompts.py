from app.ai.prompts import ACTIVE_PROMPTS, get_prompt


def test_prompts_are_versioned_and_central():
    version, body = get_prompt("evaluation")
    assert version == "evaluation_v1"
    assert "Never invent" in body
    assert set(ACTIVE_PROMPTS) >= {"evaluation", "flashcards", "tutor", "followup"}
