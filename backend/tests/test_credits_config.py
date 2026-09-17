from app.services.credits import DEFAULT_COSTS


def test_default_costs_are_centralized():
    assert DEFAULT_COSTS["evaluation"][0] == 10
    assert DEFAULT_COSTS["flashcard_generation"][0] == 5
    assert DEFAULT_COSTS["ai_tutor_message"][0] == 1
    assert "question_generation" in DEFAULT_COSTS
