from app.ai.prompts.library import (
    EVALUATION_V1,
    FLASHCARDS_V1,
    FOLLOWUP_V1,
    OCR_POSTPROCESS_V1,
    RECOMMENDATIONS_V1,
    STUDY_PLAN_V1,
    TUTOR_V1,
    WEAKNESS_V1,
)

PROMPT_REGISTRY = {
    "evaluation_v1": EVALUATION_V1,
    "flashcards_v1": FLASHCARDS_V1,
    "tutor_v1": TUTOR_V1,
    "followup_v1": FOLLOWUP_V1,
    "ocr_postprocess_v1": OCR_POSTPROCESS_V1,
    "study_plan_v1": STUDY_PLAN_V1,
    "weakness_v1": WEAKNESS_V1,
    "recommendations_v1": RECOMMENDATIONS_V1,
}

ACTIVE_PROMPTS = {
    "evaluation": "evaluation_v1",
    "flashcards": "flashcards_v1",
    "tutor": "tutor_v1",
    "followup": "followup_v1",
    "ocr_postprocess": "ocr_postprocess_v1",
    "study_plan": "study_plan_v1",
    "weakness": "weakness_v1",
    "recommendations": "recommendations_v1",
}


def get_prompt(kind: str) -> tuple[str, str]:
    version = ACTIVE_PROMPTS[kind]
    return version, PROMPT_REGISTRY[version]
