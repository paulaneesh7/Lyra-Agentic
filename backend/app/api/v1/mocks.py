from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.mock import MockTest
from app.models.question import Question
from app.models.user import User
from app.schemas import MockSubmitRequest
from app.services.assessments import MockService

router = APIRouter(prefix="/mock-tests", tags=["mock-tests"])


@router.get("")
def list_mocks(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    mocks = db.scalars(select(MockTest).where(MockTest.is_published.is_(True))).all()
    return [
        {
            "id": str(m.id),
            "title": m.title,
            "kind": m.kind,
            "duration_minutes": m.duration_minutes,
            "total_marks": m.total_marks,
            "description": m.description,
        }
        for m in mocks
    ]


@router.post("/{mock_id}/start")
def start_mock(
    mock_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    attempt = MockService(db).start(user, mock_id)
    mock = db.scalar(
        select(MockTest)
        .options(selectinload(MockTest.questions))
        .where(MockTest.id == mock_id)
    )
    questions = []
    for item in sorted(mock.questions, key=lambda q: q.sort_order):
        q = db.scalar(
            select(Question).options(selectinload(Question.options)).where(Question.id == item.question_id)
        )
        questions.append(
            {
                "id": str(q.id),
                "stem": q.stem,
                "question_type": q.question_type,
                "marks": q.marks,
                "section": item.section_name,
                "options": [{"id": str(o.id), "label": o.label, "text": o.text} for o in q.options],
            }
        )
    db.commit()
    return {
        "attempt_id": str(attempt.id),
        "duration_minutes": mock.duration_minutes,
        "questions": questions,
    }


@router.post("/attempts/{attempt_id}/submit")
def submit_mock(
    attempt_id: UUID,
    payload: MockSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    attempt = MockService(db).submit(user, attempt_id, payload.answers)
    db.commit()
    return {"score": attempt.score, "accuracy": attempt.accuracy, "analysis": attempt.analysis}
