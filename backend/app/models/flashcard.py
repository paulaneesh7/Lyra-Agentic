from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import Difficulty, FlashcardFocus, ReviewRating


class FlashcardDeck(Base, TimestampMixin):
    __tablename__ = "flashcard_decks"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    paper_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exam_papers.id"))
    subject_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subjects.id"))
    topic_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("topics.id"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    focus: Mapped[FlashcardFocus] = mapped_column(
        Enum(FlashcardFocus, name="flashcard_focus", native_enum=False), default=FlashcardFocus.KEY_CONCEPTS
    )
    custom_focus: Mapped[str | None] = mapped_column(String(200))
    context_notes: Mapped[str] = mapped_column(Text, default="")
    card_count: Mapped[int] = mapped_column(Integer, default=0)
    subject_name: Mapped[str] = mapped_column(String(200), default="")
    unit_name: Mapped[str] = mapped_column(String(200), default="")
    paper_code: Mapped[str] = mapped_column(String(16), default="CS")

    cards: Mapped[list["Flashcard"]] = relationship(back_populates="deck", cascade="all, delete-orphan")


class Flashcard(Base, TimestampMixin):
    __tablename__ = "flashcards"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    deck_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("flashcard_decks.id"), index=True)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    subject_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subjects.id"))
    topic_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("topics.id"))
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, default="")
    difficulty: Mapped[Difficulty] = mapped_column(
        Enum(Difficulty, name="difficulty", native_enum=False), default=Difficulty.MEDIUM
    )
    tags: Mapped[list] = mapped_column(ARRAY(String), default=list)
    source: Mapped[str] = mapped_column(String(40), default="ai")
    bookmarked: Mapped[bool] = mapped_column(Boolean, default=False)
    known: Mapped[bool] = mapped_column(Boolean, default=False)
    marked_difficult: Mapped[bool] = mapped_column(Boolean, default=False)
    ease: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, default=0)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    deck: Mapped[FlashcardDeck] = relationship(back_populates="cards")
    reviews: Mapped[list["FlashcardReview"]] = relationship(back_populates="card", cascade="all, delete-orphan")


class FlashcardReview(Base, TimestampMixin):
    __tablename__ = "flashcard_reviews"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    card_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("flashcards.id"), index=True)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    rating: Mapped[ReviewRating] = mapped_column(
        Enum(ReviewRating, name="review_rating", native_enum=False)
    )
    ease_after: Mapped[float] = mapped_column(Float)
    interval_after: Mapped[int] = mapped_column(Integer)

    card: Mapped[Flashcard] = relationship(back_populates="reviews")
