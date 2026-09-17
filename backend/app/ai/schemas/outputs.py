from pydantic import BaseModel, Field


class EvaluationResult(BaseModel):
    score: float = Field(ge=0, le=10)
    verdict: str
    correctness: int = Field(ge=1, le=5)
    approach: int = Field(ge=1, le=5)
    reasoning: int = Field(ge=1, le=5)
    efficiency: int = Field(ge=1, le=5)
    strengths: list[str]
    mistakes: list[str]
    missing_concepts: list[str]
    corrected_solution: str
    better_approach: str
    key_takeaways: list[str]
    common_trap: str
    final_answer: str
    confidence: float = Field(ge=0, le=1)
    uncertainty_notes: str
    is_official_answer: bool = False


class FlashcardDraft(BaseModel):
    front: str
    back: str
    explanation: str = ""
    difficulty: str = "medium"
    tags: list[str] = Field(default_factory=list)


class FlashcardBatch(BaseModel):
    cards: list[FlashcardDraft]


class StudyPlanDraft(BaseModel):
    weekly_targets: list[str]
    tasks: list[dict]


EVALUATION_JSON_SCHEMA = EvaluationResult.model_json_schema()
FLASHCARD_JSON_SCHEMA = FlashcardBatch.model_json_schema()
STUDY_PLAN_JSON_SCHEMA = StudyPlanDraft.model_json_schema()
