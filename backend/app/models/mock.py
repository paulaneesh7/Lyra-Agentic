from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import AttemptStatus


class MockTest(Base, TimestampMixin):
    __tablename__ = "mock_tests"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    paper_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exam_papers.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    kind: Mapped[str] = mapped_column(String(32), default="full")  # full | subject | topic | custom
    duration_minutes: Mapped[int] = mapped_column(Integer, default=180)
    total_marks: Mapped[float] = mapped_column(Float, default=100)
    scoring_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)

    questions: Mapped[list["MockTestQuestion"]] = relationship(
        back_populates="mock_test", cascade="all, delete-orphan"
    )


class MockTestQuestion(Base, TimestampMixin):
    __tablename__ = "mock_test_questions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    mock_test_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("mock_tests.id"), index=True, nullable=False
    )
    question_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    section_name: Mapped[str] = mapped_column(String(80), default="General")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    mock_test: Mapped[MockTest] = relationship(back_populates="questions")


class MockTestAttempt(Base, TimestampMixin):
    __tablename__ = "mock_test_attempts"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    mock_test_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("mock_tests.id"), index=True)
    status: Mapped[AttemptStatus] = mapped_column(
        Enum(AttemptStatus, name="attempt_status", native_enum=False), default=AttemptStatus.IN_PROGRESS
    )
    answers: Mapped[dict] = mapped_column(JSONB, default=dict)
    review_flags: Mapped[dict] = mapped_column(JSONB, default=dict)
    score: Mapped[float] = mapped_column(Float, default=0)
    accuracy: Mapped[float] = mapped_column(Float, default=0)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, default=0)
    analysis: Mapped[dict] = mapped_column(JSONB, default=dict)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
