from uuid import UUID, uuid4

from sqlalchemy import Boolean, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.models.enums import BookmarkTarget


class UserProgress(Base, TimestampMixin):
    __tablename__ = "user_progress"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    subject_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subjects.id"))
    topic_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("topics.id"))
    questions_attempted: Mapped[int] = mapped_column(Integer, default=0)
    questions_correct: Mapped[int] = mapped_column(Integer, default=0)
    questions_incorrect: Mapped[int] = mapped_column(Integer, default=0)
    accuracy: Mapped[float] = mapped_column(Float, default=0)
    average_time_seconds: Mapped[float] = mapped_column(Float, default=0)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[str | None] = mapped_column(String(16))
    weakness_score: Mapped[float] = mapped_column(Float, default=0)
    trend: Mapped[str] = mapped_column(String(20), default="stable")


class Recommendation(Base, TimestampMixin):
    __tablename__ = "recommendations"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(String(40), default="next_topic")
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    rationale: Mapped[str] = mapped_column(Text, default="")
    action_path: Mapped[str] = mapped_column(String(240), default="/dashboard")
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[int] = mapped_column(Integer, default=0)


class Bookmark(Base, TimestampMixin):
    __tablename__ = "bookmarks"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    target_type: Mapped[BookmarkTarget] = mapped_column(
        Enum(BookmarkTarget, name="bookmark_target", native_enum=False)
    )
    target_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), index=True)


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    question_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("questions.id"))
    reason: Mapped[str] = mapped_column(String(80), nullable=False)
    details: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="open")


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, default="")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    link: Mapped[str | None] = mapped_column(String(240))


class PurchasePlan(Base, TimestampMixin):
    __tablename__ = "purchase_plans"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    name: Mapped[str] = mapped_column(String(80))
    price_inr: Mapped[int] = mapped_column(Integer)
    credits: Mapped[int] = mapped_column(Integer)
    badge: Mapped[str | None] = mapped_column(String(40))
    is_placeholder: Mapped[bool] = mapped_column(Boolean, default=True)
