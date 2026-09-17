from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_admin_user
from app.db.session import get_db
from app.models.credits import CreditCost, CreditTransaction
from app.models.evaluation import Evaluation
from app.models.flashcard import FlashcardDeck
from app.models.progress import UserProgress
from app.models.question import QuestionAttempt
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview")
def overview(_: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.scalar(select(func.count(User.id))) or 0
    attempts = db.scalar(select(func.count(QuestionAttempt.id))) or 0
    evals = db.scalar(select(func.count(Evaluation.id))) or 0
    decks = db.scalar(select(func.count(FlashcardDeck.id))) or 0
    spent = db.scalar(
        select(func.coalesce(func.sum(CreditTransaction.amount), 0)).where(CreditTransaction.amount < 0)
    ) or 0
    weak = db.scalars(
        select(UserProgress).where(UserProgress.topic_id.is_not(None)).order_by(UserProgress.accuracy.asc()).limit(5)
    ).all()
    return {
        "users": users,
        "questions_attempted": attempts,
        "evaluations": evals,
        "flashcard_generations": decks,
        "credits_consumed": abs(int(spent)),
        "revenue_placeholder": 0,
        "weak_topics": [
            {"topic_id": str(w.topic_id), "accuracy": w.accuracy, "attempted": w.questions_attempted}
            for w in weak
        ],
    }


@router.get("/credit-costs")
def credit_costs(_: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(CreditCost)).all()
    return [{"action_key": r.action_key, "credits": r.credits, "description": r.description} for r in rows]
