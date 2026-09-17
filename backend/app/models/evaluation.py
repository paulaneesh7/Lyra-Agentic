from uuid import UUID, uuid4

from sqlalchemy import Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import EvaluationStatus, QuestionType


class Evaluation(Base, TimestampMixin):
    __tablename__ = "evaluations"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    question_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("questions.id"))
    subject_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subjects.id"))
    topic_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("topics.id"))
    question_type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, name="question_type", native_enum=False), default=QuestionType.DESCRIPTIVE
    )
    question_text: Mapped[str] = mapped_column(Text, default="")
    solution_text: Mapped[str] = mapped_column(Text, default="")
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[EvaluationStatus] = mapped_column(
        Enum(EvaluationStatus, name="evaluation_status", native_enum=False), default=EvaluationStatus.DRAFT, index=True
    )
    score: Mapped[float | None] = mapped_column(Float)
    max_score: Mapped[float] = mapped_column(Float, default=10)
    verdict: Mapped[str | None] = mapped_column(String(80))
    result: Mapped[dict] = mapped_column(JSONB, default=dict)
    confidence: Mapped[float | None] = mapped_column(Float)
    credit_transaction_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True))
    error_message: Mapped[str | None] = mapped_column(Text)
    prompt_version: Mapped[str] = mapped_column(String(40), default="evaluation_v1")
    model_name: Mapped[str | None] = mapped_column(String(80))
    latency_ms: Mapped[int | None] = mapped_column(Integer)

    images: Mapped[list["EvaluationImage"]] = relationship(
        back_populates="evaluation", cascade="all, delete-orphan"
    )
    chat: Mapped["EvaluationChat | None"] = relationship(back_populates="evaluation", uselist=False)


class EvaluationImage(Base, TimestampMixin):
    __tablename__ = "evaluation_images"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    evaluation_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("evaluations.id"), index=True, nullable=False
    )
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str] = mapped_column(String(80), default="image/jpeg")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    ocr_text: Mapped[str] = mapped_column(Text, default="")
    ocr_status: Mapped[str] = mapped_column(String(32), default="pending")

    evaluation: Mapped[Evaluation] = relationship(back_populates="images")


class EvaluationChat(Base, TimestampMixin):
    __tablename__ = "evaluation_chats"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    evaluation_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("evaluations.id"), unique=True, nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)

    evaluation: Mapped[Evaluation] = relationship(back_populates="chat")
    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="chat",
        cascade="all, delete-orphan",
        foreign_keys="ChatMessage.chat_id",
    )


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    chat_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("evaluation_chats.id"))
    tutor_thread_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("tutor_threads.id"))
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_usage: Mapped[dict] = mapped_column(JSONB, default=dict)

    chat: Mapped[EvaluationChat | None] = relationship(
        back_populates="messages", foreign_keys=[chat_id]
    )
    tutor_thread: Mapped["TutorThread | None"] = relationship(
        back_populates="messages", foreign_keys=[tutor_thread_id]
    )
