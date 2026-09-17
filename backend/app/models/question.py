from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import AttemptStatus, Difficulty, QuestionType, SourceType


class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    exam_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exams.id"), index=True)
    paper_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exam_papers.id"), index=True)
    subject_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subjects.id"), index=True)
    topic_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("topics.id"), index=True)
    subtopic_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subtopics.id"))
    question_type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, name="question_type", native_enum=False), nullable=False, index=True
    )
    stem: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, default="")
    difficulty: Mapped[Difficulty] = mapped_column(
        Enum(Difficulty, name="difficulty", native_enum=False), default=Difficulty.MEDIUM, index=True
    )
    marks: Mapped[float] = mapped_column(Float, default=1)
    negative_marks: Mapped[float] = mapped_column(Float, default=0)
    year: Mapped[int | None] = mapped_column(Integer, index=True)
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, name="source_type", native_enum=False), default=SourceType.DEMO, index=True
    )
    source_reference: Mapped[str] = mapped_column(String(255), default="Sample Question")
    tags: Mapped[list] = mapped_column(ARRAY(String), default=list)
    nat_answer: Mapped[str | None] = mapped_column(String(64))
    nat_tolerance: Mapped[float | None] = mapped_column(Float)
    official_answer_available: Mapped[bool] = mapped_column(Boolean, default=False)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)

    options: Mapped[list["QuestionOption"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class QuestionOption(Base, TimestampMixin):
    __tablename__ = "question_options"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    question_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("questions.id"), index=True, nullable=False
    )
    label: Mapped[str] = mapped_column(String(8), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)

    question: Mapped[Question] = relationship(back_populates="options")


class PracticeSession(Base, TimestampMixin):
    __tablename__ = "practice_sessions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    paper_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exam_papers.id"))
    subject_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subjects.id"))
    topic_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("topics.id"))
    question_type: Mapped[QuestionType | None] = mapped_column(
        Enum(QuestionType, name="question_type", native_enum=False)
    )
    difficulty: Mapped[Difficulty | None] = mapped_column(
        Enum(Difficulty, name="difficulty", native_enum=False)
    )
    question_count: Mapped[int] = mapped_column(Integer, default=10)
    timer_seconds: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[AttemptStatus] = mapped_column(
        Enum(AttemptStatus, name="attempt_status", native_enum=False), default=AttemptStatus.IN_PROGRESS
    )
    score: Mapped[float] = mapped_column(Float, default=0)
    accuracy: Mapped[float] = mapped_column(Float, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    incorrect_count: Mapped[int] = mapped_column(Integer, default=0)
    skipped_count: Mapped[int] = mapped_column(Integer, default=0)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, default=0)
    summary: Mapped[dict] = mapped_column(JSONB, default=dict)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    attempts: Mapped[list["QuestionAttempt"]] = relationship(back_populates="practice_session")


class QuestionAttempt(Base, TimestampMixin):
    __tablename__ = "question_attempts"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    question_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("questions.id"), index=True)
    practice_session_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("practice_sessions.id")
    )
    mock_attempt_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("mock_test_attempts.id")
    )
    selected_option_ids: Mapped[list] = mapped_column(JSONB, default=list)
    nat_response: Mapped[str | None] = mapped_column(String(64))
    descriptive_response: Mapped[str | None] = mapped_column(Text)
    is_correct: Mapped[bool | None] = mapped_column(Boolean)
    marks_obtained: Mapped[float] = mapped_column(Float, default=0)
    negative_marks: Mapped[float] = mapped_column(Float, default=0)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0)
    marked_for_review: Mapped[bool] = mapped_column(Boolean, default=False)
    skipped: Mapped[bool] = mapped_column(Boolean, default=False)

    practice_session: Mapped[PracticeSession | None] = relationship(back_populates="attempts")
