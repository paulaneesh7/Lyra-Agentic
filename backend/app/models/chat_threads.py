from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.evaluation import ChatMessage


class TutorThread(Base, TimestampMixin):
    __tablename__ = "tutor_threads"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), default="New tutoring session")
    mode: Mapped[str] = mapped_column(String(40), default="explain")
    subject_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("subjects.id"))
    topic_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("topics.id"))
    context: Mapped[dict] = mapped_column(JSONB, default=dict)

    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="tutor_thread",
        foreign_keys="ChatMessage.tutor_thread_id",
    )
