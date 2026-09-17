from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import NotFoundError
from app.models.enums import AttemptStatus
from app.models.mock import MockTest, MockTestAttempt
from app.models.question import Question
from app.models.user import User
from app.scoring.engine import ScoringEngine
from app.services.recommendations import RecommendationEngine


class PracticeService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def start(self, user: User, payload: dict, questions: list[Question], paper_id: UUID):
        from app.models.question import PracticeSession, QuestionAttempt

        session = PracticeSession(
            user_id=user.id,
            paper_id=paper_id,
            subject_id=payload.get("subject_id"),
            topic_id=payload.get("topic_id"),
            question_type=payload.get("question_type"),
            difficulty=payload.get("difficulty"),
            question_count=len(questions),
            timer_seconds=payload.get("timer_seconds"),
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(session)
        self.db.flush()
        for question in questions:
            self.db.add(
                QuestionAttempt(
                    user_id=user.id,
                    question_id=question.id,
                    practice_session_id=session.id,
                    skipped=True,
                )
            )
        self.db.flush()
        return session

    def submit(self, user: User, session_id: UUID, answers: list[dict]) -> dict:
        from app.models.question import PracticeSession, QuestionAttempt

        session = self.db.scalar(
            select(PracticeSession)
            .options(selectinload(PracticeSession.attempts))
            .where(PracticeSession.id == session_id, PracticeSession.user_id == user.id)
        )
        if not session:
            raise NotFoundError("Practice session not found")
        engine = ScoringEngine()
        rec = RecommendationEngine(self.db)
        by_q = {str(a["question_id"]): a for a in answers}
        correct = incorrect = skipped = 0
        score = 0.0
        for attempt in session.attempts:
            payload = by_q.get(str(attempt.question_id), {})
            question = self.db.get(Question, attempt.question_id)
            if question is None:
                continue
            question = self.db.scalar(
                select(Question)
                .options(selectinload(Question.options))
                .where(Question.id == attempt.question_id)
            )
            correct_ids = [str(opt.id) for opt in question.options if opt.is_correct]
            result = engine.score(
                question_type=question.question_type,
                marks=question.marks,
                negative_marks=question.negative_marks,
                correct_option_ids=correct_ids,
                selected_option_ids=payload.get("selected_option_ids"),
                nat_answer=question.nat_answer,
                nat_response=payload.get("nat_response"),
                nat_tolerance=question.nat_tolerance,
                skipped=payload.get("skipped", False) or not payload,
            )
            attempt.selected_option_ids = [str(x) for x in (payload.get("selected_option_ids") or [])]
            attempt.nat_response = payload.get("nat_response")
            attempt.is_correct = result.correct
            attempt.marks_obtained = result.marks_obtained
            attempt.negative_marks = result.negative_marks
            attempt.skipped = result.unanswered
            attempt.time_spent_seconds = int(payload.get("time_spent_seconds") or 0)
            score += result.marks_obtained
            if result.correct:
                correct += 1
            elif result.incorrect:
                incorrect += 1
            else:
                skipped += 1
            rec.update_topic_progress(
                user.id,
                question.topic_id,
                question.subject_id,
                result.correct,
                attempt.time_spent_seconds,
            )
        attempted = correct + incorrect
        session.score = score
        session.correct_count = correct
        session.incorrect_count = incorrect
        session.skipped_count = skipped
        session.accuracy = (correct / attempted) if attempted else 0
        session.status = AttemptStatus.SUBMITTED
        session.submitted_at = datetime.now(timezone.utc)
        session.summary = {
            "weak_topics": "See recommendations",
            "recommended_revision": "Review incorrect questions and generate flashcards.",
        }
        rec.refresh_for_user(user)
        self.db.flush()
        return {
            "score": session.score,
            "accuracy": session.accuracy,
            "correct": correct,
            "incorrect": incorrect,
            "skipped": skipped,
        }


class MockService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def start(self, user: User, mock_id: UUID) -> MockTestAttempt:
        mock = self.db.get(MockTest, mock_id)
        if not mock:
            raise NotFoundError("Mock test not found")
        attempt = MockTestAttempt(
            user_id=user.id,
            mock_test_id=mock.id,
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(attempt)
        self.db.flush()
        return attempt

    def submit(self, user: User, attempt_id: UUID, answers: dict) -> MockTestAttempt:
        attempt = self.db.scalar(
            select(MockTestAttempt).where(
                MockTestAttempt.id == attempt_id, MockTestAttempt.user_id == user.id
            )
        )
        if not attempt:
            raise NotFoundError("Attempt not found")
        mock = self.db.scalar(
            select(MockTest)
            .options(selectinload(MockTest.questions))
            .where(MockTest.id == attempt.mock_test_id)
        )
        engine = ScoringEngine(mock.scoring_config or None)
        rec = RecommendationEngine(self.db)
        score = 0.0
        correct = 0
        attempted = 0
        for item in mock.questions:
            question = self.db.scalar(
                select(Question)
                .options(selectinload(Question.options))
                .where(Question.id == item.question_id)
            )
            payload = answers.get(str(item.question_id), {})
            result = engine.score(
                question_type=question.question_type,
                marks=question.marks,
                negative_marks=question.negative_marks,
                correct_option_ids=[str(o.id) for o in question.options if o.is_correct],
                selected_option_ids=payload.get("selected_option_ids"),
                nat_answer=question.nat_answer,
                nat_response=payload.get("nat_response"),
                nat_tolerance=question.nat_tolerance,
                skipped=payload.get("skipped", False),
            )
            score += result.marks_obtained
            if not result.unanswered:
                attempted += 1
            if result.correct:
                correct += 1
            rec.update_topic_progress(
                user.id, question.topic_id, question.subject_id, result.correct, 0
            )
        attempt.answers = answers
        attempt.score = score
        attempt.accuracy = (correct / attempted) if attempted else 0
        attempt.status = AttemptStatus.SUBMITTED
        attempt.submitted_at = datetime.now(timezone.utc)
        attempt.analysis = {"engine": "ScoringEngine"}
        rec.refresh_for_user(user)
        self.db.flush()
        return attempt
