from datetime import date
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import (
    Difficulty,
    ExamMode,
    FlashcardFocus,
    PreparationLevel,
    QuestionType,
    ReviewRating,
)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    onboarding_completed: bool


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OnboardingRequest(BaseModel):
    paper_code: str = "CS"
    target_year: int = 2027
    preparation_level: PreparationLevel
    target_score: float | None = None
    target_rank: int | None = None
    prioritized_subject_ids: list[UUID] = Field(default_factory=list)
    daily_study_minutes: int = 120
    exam_mode: ExamMode
    exam_date: date | None = None


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    onboarding_completed: bool
    avatar_url: str | None = None
    credits: int = 0

    model_config = {"from_attributes": True}


class PracticeStartRequest(BaseModel):
    subject_id: UUID | None = None
    topic_id: UUID | None = None
    difficulty: Difficulty | None = None
    question_type: QuestionType | None = None
    count: int = Field(default=5, ge=1, le=30)
    timer_seconds: int | None = None


class PracticeAnswer(BaseModel):
    question_id: UUID
    selected_option_ids: list[UUID] = Field(default_factory=list)
    nat_response: str | None = None
    skipped: bool = False
    time_spent_seconds: int = 0


class PracticeSubmitRequest(BaseModel):
    answers: list[PracticeAnswer]


class EvaluationCreateRequest(BaseModel):
    question_text: str = ""
    solution_text: str = ""
    question_type: QuestionType = QuestionType.DESCRIPTIVE
    subject_id: UUID | None = None
    topic_id: UUID | None = None


class EvaluationRunRequest(BaseModel):
    extracted_text: str | None = None
    question_text: str | None = None
    solution_text: str | None = None
    paper: str | None = None
    topic: str | None = None
    mark_weight: str | None = None
    word_target: int | None = None


class ChatRequest(BaseModel):
    message: str
    mode: str = "explain"
    thread_id: UUID | None = None


class FlashcardGenerateRequest(BaseModel):
    paper_id: UUID | None = None
    subject_id: UUID | None = None
    topic_id: UUID | None = None
    paper_code: str = "CS"
    subject_name: str = ""
    unit_name: str = ""
    topic_name: str = ""
    focus: FlashcardFocus = FlashcardFocus.KEY_CONCEPTS
    custom_focus: str | None = None
    count: int = Field(default=8, ge=5, le=20)
    notes: str = ""
    title: str | None = None
    difficulty: str = "mixed"
    include_complexity: bool = True
    include_traps: bool = True
    include_nat: bool = False
    include_mnemonics: bool = False
    include_compare: bool = True
    exam_weight: str = "mixed"
    card_format: str = "qa"


class FlashcardReviewRequest(BaseModel):
    rating: ReviewRating


class FlashcardFlagRequest(BaseModel):
    bookmarked: bool | None = None
    known: bool | None = None
    marked_difficult: bool | None = None


class FlashcardUpdateRequest(BaseModel):
    front: str | None = None
    back: str | None = None
    explanation: str | None = None


class MockSubmitRequest(BaseModel):
    answers: dict[str, Any]
