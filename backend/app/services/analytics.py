from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.evaluation import Evaluation
from app.models.flashcard import Flashcard
from app.models.mock import MockTestAttempt
from app.models.progress import UserProgress
from app.models.question import PracticeSession, QuestionAttempt
from app.models.user import User


class AnalyticsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def dashboard(self, user: User) -> dict:
        attempts = self.db.scalar(
            select(func.count(QuestionAttempt.id)).where(QuestionAttempt.user_id == user.id)
        ) or 0
        correct = self.db.scalar(
            select(func.count(QuestionAttempt.id)).where(
                QuestionAttempt.user_id == user.id, QuestionAttempt.is_correct.is_(True)
            )
        ) or 0
        accuracy = (correct / attempts) if attempts else 0
        topics = self.db.scalars(
            select(UserProgress)
            .where(UserProgress.user_id == user.id)
            .order_by(UserProgress.accuracy.asc())
            .limit(5)
        ).all()
        recent = self.db.scalars(
            select(PracticeSession)
            .where(PracticeSession.user_id == user.id)
            .order_by(PracticeSession.created_at.desc())
            .limit(5)
        ).all()
        wallet = user.wallet
        return {
            "greeting_name": user.full_name.split(" ")[0],
            "questions_solved": attempts,
            "accuracy": round(accuracy * 100, 1),
            "credits": wallet.balance if wallet else 0,
            "streak_days": topics[0].streak_days if topics else 0,
            "weak_topics": [
                {
                    "topic_id": str(row.topic_id) if row.topic_id else None,
                    "accuracy": round(row.accuracy * 100, 1),
                    "attempted": row.questions_attempted,
                    "trend": row.trend,
                }
                for row in topics
            ],
            "recent_sessions": [
                {
                    "id": str(row.id),
                    "score": row.score,
                    "accuracy": row.accuracy,
                    "status": row.status,
                }
                for row in recent
            ],
        }

    def full(self, user: User) -> dict:
        dash = self.dashboard(user)
        mocks = self.db.scalars(
            select(MockTestAttempt)
            .where(MockTestAttempt.user_id == user.id)
            .order_by(MockTestAttempt.created_at.desc())
            .limit(10)
        ).all()
        cards = self.db.scalar(
            select(func.count(Flashcard.id)).where(Flashcard.user_id == user.id)
        ) or 0
        evals = self.db.scalar(
            select(func.count(Evaluation.id)).where(Evaluation.user_id == user.id)
        ) or 0
        dash.update(
            {
                "mock_scores": [{"score": m.score, "accuracy": m.accuracy} for m in mocks],
                "flashcards": cards,
                "evaluations": evals,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        return dash
