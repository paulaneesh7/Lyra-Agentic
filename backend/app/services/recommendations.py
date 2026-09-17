from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.progress import Recommendation, UserProgress
from app.models.question import QuestionAttempt
from app.models.user import User


class RecommendationEngine:
    """Rule-based next actions. Replace internals later with an ML ranker."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def refresh_for_user(self, user: User) -> list[Recommendation]:
        self.db.query(Recommendation).filter(
            Recommendation.user_id == user.id, Recommendation.is_dismissed.is_(False)
        ).delete()
        rows = self.db.scalars(
            select(UserProgress)
            .where(UserProgress.user_id == user.id, UserProgress.topic_id.is_not(None))
            .order_by(UserProgress.accuracy.asc())
        ).all()
        created: list[Recommendation] = []
        if rows:
            weakest = rows[0]
            rec = Recommendation(
                user_id=user.id,
                kind="weak_topic",
                title="Recurring weakness detected",
                rationale="Accuracy on this topic is below your other topics.",
                action_path="/practice",
                payload={"topic_id": str(weakest.topic_id), "accuracy": weakest.accuracy},
                priority=10,
            )
            self.db.add(rec)
            created.append(rec)
            for title, path, kind in [
                ("Revise the concept notes", "/tutor", "revise"),
                ("Review related flashcards", "/flashcards", "flashcards"),
                ("Solve 5 easy questions", "/practice", "easy_drill"),
                ("Solve 5 medium questions", "/practice", "medium_drill"),
                ("Take a short topic test", "/mock-tests", "mini_test"),
            ]:
                item = Recommendation(
                    user_id=user.id,
                    kind=kind,
                    title=title,
                    rationale="Close the loop: practice → evaluate → revise → retest.",
                    action_path=path,
                    payload={"topic_id": str(weakest.topic_id)},
                    priority=5,
                )
                self.db.add(item)
                created.append(item)
        else:
            rec = Recommendation(
                user_id=user.id,
                kind="start",
                title="Start with a focused practice set",
                rationale="No attempts yet. Begin with a core GATE CS subject.",
                action_path="/practice",
                payload={},
                priority=1,
            )
            self.db.add(rec)
            created.append(rec)
        self.db.flush()
        return created

    def update_topic_progress(
        self, user_id, topic_id, subject_id, correct: bool, time_spent: int
    ) -> None:
        row = self.db.scalar(
            select(UserProgress).where(
                UserProgress.user_id == user_id, UserProgress.topic_id == topic_id
            )
        )
        if row is None:
            row = UserProgress(user_id=user_id, topic_id=topic_id, subject_id=subject_id)
            self.db.add(row)
            self.db.flush()
        row.questions_attempted += 1
        if correct:
            row.questions_correct += 1
        else:
            row.questions_incorrect += 1
        row.accuracy = (
            row.questions_correct / row.questions_attempted if row.questions_attempted else 0
        )
        if row.questions_attempted:
            row.average_time_seconds = (
                (row.average_time_seconds * (row.questions_attempted - 1)) + time_spent
            ) / row.questions_attempted
        row.weakness_score = 1 - row.accuracy
        row.trend = "declining" if row.accuracy < 0.5 else ("improving" if row.accuracy > 0.7 else "stable")
