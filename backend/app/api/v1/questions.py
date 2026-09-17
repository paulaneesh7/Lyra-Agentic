from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.enums import BookmarkTarget
from app.models.progress import Bookmark, Report
from app.models.question import Question
from app.models.user import User
from app.repositories.questions import QuestionRepository
from app.schemas import PracticeStartRequest, PracticeSubmitRequest
from app.services.assessments import PracticeService

router = APIRouter(tags=["questions"])


def _question_out(question: Question, hide_answer: bool = True) -> dict:
    data = {
        "id": str(question.id),
        "stem": question.stem,
        "question_type": question.question_type,
        "difficulty": question.difficulty,
        "marks": question.marks,
        "year": question.year,
        "source_type": question.source_type,
        "source_reference": question.source_reference,
        "is_ai_generated": question.is_ai_generated,
        "tags": question.tags,
        "subject_id": str(question.subject_id),
        "topic_id": str(question.topic_id) if question.topic_id else None,
        "options": [
            {"id": str(opt.id), "label": opt.label, "text": opt.text}
            for opt in question.options
        ],
    }
    if not hide_answer:
        data["explanation"] = question.explanation
        data["correct_option_ids"] = [str(opt.id) for opt in question.options if opt.is_correct]
        data["nat_answer"] = question.nat_answer
        data["official_answer_available"] = question.official_answer_available
    return data


@router.get("/questions")
def list_questions(
    subject_id: UUID | None = None,
    topic_id: UUID | None = None,
    year: int | None = None,
    question_type: str | None = None,
    difficulty: str | None = None,
    limit: int = Query(20, le=50),
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows, total = QuestionRepository(db).list_filtered(
        {
            "subject_id": subject_id,
            "topic_id": topic_id,
            "year": year,
            "question_type": question_type,
            "difficulty": difficulty,
        },
        limit=limit,
        offset=offset,
    )
    return {"total": total, "items": [_question_out(q) for q in rows]}


@router.get("/questions/{question_id}")
def get_question(question_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    question = db.scalar(
        select(Question).options(selectinload(Question.options)).where(Question.id == question_id)
    )
    if not question:
        raise NotFoundError("Question not found")
    return _question_out(question, hide_answer=True)


@router.post("/questions/{question_id}/bookmark")
def bookmark_question(
    question_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    db.add(Bookmark(user_id=user.id, target_type=BookmarkTarget.QUESTION, target_id=question_id))
    db.commit()
    return {"ok": True}


@router.post("/questions/{question_id}/report")
def report_question(
    question_id: UUID,
    reason: str = "incorrect",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.add(Report(user_id=user.id, question_id=question_id, reason=reason))
    db.commit()
    return {"ok": True}


@router.post("/practice/start")
def start_practice(
    payload: PracticeStartRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from sqlalchemy import select

    from app.models.exam import ExamPaper

    stmt = select(Question).options(selectinload(Question.options))
    if payload.subject_id:
        stmt = stmt.where(Question.subject_id == payload.subject_id)
    if payload.topic_id:
        stmt = stmt.where(Question.topic_id == payload.topic_id)
    if payload.difficulty:
        stmt = stmt.where(Question.difficulty == payload.difficulty)
    if payload.question_type:
        stmt = stmt.where(Question.question_type == payload.question_type)
    questions = db.scalars(stmt.limit(payload.count)).all()
    paper = db.scalar(select(ExamPaper).where(ExamPaper.code == "CS"))
    session = PracticeService(db).start(user, payload.model_dump(), list(questions), paper.id)
    db.commit()
    return {
        "session_id": str(session.id),
        "questions": [_question_out(q) for q in questions],
    }


@router.post("/practice/{session_id}/submit")
def submit_practice(
    session_id: UUID,
    payload: PracticeSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = PracticeService(db).submit(
        user,
        session_id,
        [item.model_dump() for item in payload.answers],
    )
    db.commit()
    return result
