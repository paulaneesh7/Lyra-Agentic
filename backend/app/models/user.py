from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import ExamMode, PreparationLevel, UserRole


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=False), default=UserRole.STUDENT
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False)
    wallet: Mapped["CreditWallet"] = relationship(back_populates="user", uselist=False)  # noqa: F821


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"
    __table_args__ = (UniqueConstraint("user_id"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    exam_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exams.id"))
    paper_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exam_papers.id"))
    target_year: Mapped[int | None] = mapped_column(Integer)
    preparation_level: Mapped[PreparationLevel | None] = mapped_column(
        Enum(PreparationLevel, name="preparation_level", native_enum=False)
    )
    target_score: Mapped[float | None] = mapped_column(Float)
    target_rank: Mapped[int | None] = mapped_column(Integer)
    daily_study_minutes: Mapped[int | None] = mapped_column(Integer)
    exam_mode: Mapped[ExamMode | None] = mapped_column(
        Enum(ExamMode, name="exam_mode", native_enum=False)
    )
    exam_date: Mapped[date | None] = mapped_column(Date)
    prioritized_subject_ids: Mapped[list] = mapped_column(JSONB, default=list)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")
    bio: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="profile")
