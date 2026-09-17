from uuid import UUID, uuid4

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import QuestionType


class Exam(Base, TimestampMixin):
    __tablename__ = "exams"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    scoring_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    question_types: Mapped[list] = mapped_column(JSONB, default=list)

    papers: Mapped[list["ExamPaper"]] = relationship(back_populates="exam")


class ExamPaper(Base, TimestampMixin):
    __tablename__ = "exam_papers"
    __table_args__ = (UniqueConstraint("exam_id", "code"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    exam_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exams.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=False)
    coming_soon: Mapped[bool] = mapped_column(Boolean, default=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=180)
    total_marks: Mapped[int] = mapped_column(Integer, default=100)
    scoring_config: Mapped[dict] = mapped_column(JSONB, default=dict)

    exam: Mapped[Exam] = relationship(back_populates="papers")
    sections: Mapped[list["ExamSection"]] = relationship(back_populates="paper")
    subjects: Mapped[list["Subject"]] = relationship(back_populates="paper")


class ExamSection(Base, TimestampMixin):
    __tablename__ = "exam_sections"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    paper_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exam_papers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    question_types: Mapped[list] = mapped_column(
        JSONB, default=lambda: [QuestionType.MCQ, QuestionType.MSQ, QuestionType.NAT]
    )

    paper: Mapped[ExamPaper] = relationship(back_populates="sections")


class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("paper_id", "slug"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    paper_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exam_papers.id"), nullable=False)
    section_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("exam_sections.id"))
    slug: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    weight_hint: Mapped[int | None] = mapped_column(Integer)

    paper: Mapped[ExamPaper] = relationship(back_populates="subjects")
    topics: Mapped[list["Topic"]] = relationship(back_populates="subject")


class Topic(Base, TimestampMixin):
    __tablename__ = "topics"
    __table_args__ = (UniqueConstraint("subject_id", "slug"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    subject_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    subject: Mapped[Subject] = relationship(back_populates="topics")
    subtopics: Mapped[list["Subtopic"]] = relationship(back_populates="topic")


class Subtopic(Base, TimestampMixin):
    __tablename__ = "subtopics"
    __table_args__ = (UniqueConstraint("topic_id", "slug"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    topic_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("topics.id"), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    topic: Mapped[Topic] = relationship(back_populates="subtopics")
