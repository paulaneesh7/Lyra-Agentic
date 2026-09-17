from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.question import Question


class QuestionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_filtered(self, filters: dict, limit: int = 20, offset: int = 0) -> tuple[list[Question], int]:
        stmt = select(Question).options(selectinload(Question.options))
        count_stmt = select(func.count(Question.id))
        mapping = {
            "subject_id": Question.subject_id,
            "topic_id": Question.topic_id,
            "subtopic_id": Question.subtopic_id,
            "year": Question.year,
            "question_type": Question.question_type,
            "difficulty": Question.difficulty,
            "marks": Question.marks,
        }
        for key, column in mapping.items():
            value = filters.get(key)
            if value is not None:
                stmt = stmt.where(column == value)
                count_stmt = count_stmt.where(column == value)
        total = self.db.scalar(count_stmt) or 0
        rows = self.db.scalars(stmt.order_by(Question.created_at.desc()).offset(offset).limit(limit)).all()
        return list(rows), total
