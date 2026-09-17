from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class StudyPlan(Base, TimestampMixin):
    __tablename__ = "study_plans"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), default="GATE CS study plan")
    exam_date: Mapped[date | None] = mapped_column(Date)
    daily_hours: Mapped[float] = mapped_column(Float, default=2)
    plan_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    tasks: Mapped[list["StudyTask"]] = relationship(back_populates="plan", cascade="all, delete-orphan")


class StudyTask(Base, TimestampMixin):
    __tablename__ = "study_tasks"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    plan_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("study_plans.id"), index=True)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    scheduled_for: Mapped[date] = mapped_column(Date, index=True)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    task_type: Mapped[str] = mapped_column(String(40), default="practice")
    subject_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subjects.id"))
    topic_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("topics.id"))
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    extra: Mapped[dict] = mapped_column(JSONB, default=dict)

    plan: Mapped[StudyPlan] = relationship(back_populates="tasks")
