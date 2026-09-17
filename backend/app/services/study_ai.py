from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.ai.graphs.flashcards import flashcard_graph
from app.ai.graphs.tutor import tutor_graph
from app.core.exceptions import AppError, NotFoundError
from app.models.chat_threads import TutorThread
from app.models.enums import CreditTransactionType, Difficulty, FlashcardFocus, ReviewRating
from app.models.evaluation import ChatMessage
from app.models.flashcard import Flashcard, FlashcardDeck, FlashcardReview
from app.models.user import User
from app.services.credits import CreditService
from app.services.srs import review_card


class FlashcardService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.credits = CreditService(db)

    def generate(self, user: User, payload: dict) -> FlashcardDeck:
        self.credits.charge(
            user,
            "flashcard_generation",
            CreditTransactionType.FLASHCARD_GENERATION,
        )
        result = flashcard_graph.invoke(
            {
                "paper": payload.get("paper_code", "CS"),
                "subject": payload.get("subject_name", ""),
                "unit": payload.get("unit_name", ""),
                "topic": payload.get("topic_name", ""),
                "focus": payload.get("focus", "key_concepts"),
                "count": payload.get("count", 8),
                "notes": payload.get("notes", ""),
                "difficulty": payload.get("difficulty", "mixed"),
                "include_complexity": payload.get("include_complexity", True),
                "include_traps": payload.get("include_traps", True),
                "include_nat": payload.get("include_nat", False),
                "include_mnemonics": payload.get("include_mnemonics", False),
                "include_compare": payload.get("include_compare", True),
                "exam_weight": payload.get("exam_weight", "mixed"),
                "card_format": payload.get("card_format", "qa"),
            }
        )
        topic = (payload.get("topic_name") or "Topic").strip()
        deck = FlashcardDeck(
            user_id=user.id,
            paper_id=payload.get("paper_id"),
            subject_id=payload.get("subject_id"),
            topic_id=payload.get("topic_id"),
            title=payload.get("title") or topic,
            focus=FlashcardFocus(payload.get("focus", "key_concepts")),
            custom_focus=payload.get("custom_focus"),
            context_notes=payload.get("notes", ""),
            card_count=len(result["cards"]),
            subject_name=payload.get("subject_name") or "",
            unit_name=payload.get("unit_name") or "",
            paper_code=payload.get("paper_code") or "CS",
        )
        self.db.add(deck)
        self.db.flush()
        for card in result["cards"]:
            try:
                difficulty = Difficulty(card.get("difficulty", "medium"))
            except ValueError:
                difficulty = Difficulty.MEDIUM
            self.db.add(
                Flashcard(
                    deck_id=deck.id,
                    user_id=user.id,
                    subject_id=payload.get("subject_id"),
                    topic_id=payload.get("topic_id"),
                    front=card["front"],
                    back=card["back"],
                    explanation=card.get("explanation", ""),
                    difficulty=difficulty,
                    tags=card.get("tags") or ["ai-generated"],
                    source="ai",
                )
            )
        self.db.flush()
        return deck

    def get_deck(self, user: User, deck_id: UUID) -> FlashcardDeck:
        deck = self.db.scalar(
            select(FlashcardDeck)
            .options(selectinload(FlashcardDeck.cards))
            .where(FlashcardDeck.id == deck_id, FlashcardDeck.user_id == user.id)
        )
        if not deck:
            raise NotFoundError("Deck not found")
        return deck

    def delete_deck(self, user: User, deck_id: UUID) -> None:
        deck = self.get_deck(user, deck_id)
        self.db.delete(deck)
        self.db.flush()

    def flag_card(self, user: User, card_id: UUID, payload: dict) -> Flashcard:
        card = self.db.scalar(
            select(Flashcard).where(Flashcard.id == card_id, Flashcard.user_id == user.id)
        )
        if not card:
            raise NotFoundError("Flashcard not found")
        if payload.get("bookmarked") is not None:
            card.bookmarked = bool(payload["bookmarked"])
        if payload.get("known") is not None:
            card.known = bool(payload["known"])
            if card.known:
                card.marked_difficult = False
                now = datetime.now(timezone.utc)
                if card.next_review_at is None or card.next_review_at <= now:
                    card.next_review_at = now + timedelta(days=1)
                card.repetitions = max(card.repetitions, 1)
            else:
                card.next_review_at = None
        if payload.get("marked_difficult") is not None:
            card.marked_difficult = bool(payload["marked_difficult"])
            if card.marked_difficult:
                card.known = False
                card.next_review_at = None
        self.db.flush()
        return card

    def update_card(self, user: User, card_id: UUID, payload: dict) -> Flashcard:
        card = self.db.scalar(
            select(Flashcard).where(Flashcard.id == card_id, Flashcard.user_id == user.id)
        )
        if not card:
            raise NotFoundError("Flashcard not found")
        if payload.get("front") is not None:
            front = str(payload["front"]).strip()
            if not front:
                raise AppError("Question text cannot be empty.", 400, "empty_front")
            card.front = front
        if payload.get("back") is not None:
            back = str(payload["back"]).strip()
            if not back:
                raise AppError("Answer text cannot be empty.", 400, "empty_back")
            card.back = back
        if payload.get("explanation") is not None:
            card.explanation = str(payload["explanation"]).strip()
        self.db.flush()
        return card

    def review(self, user: User, card_id: UUID, rating: ReviewRating) -> Flashcard:
        card = self.db.scalar(
            select(Flashcard).where(Flashcard.id == card_id, Flashcard.user_id == user.id)
        )
        if not card:
            raise NotFoundError("Flashcard not found")
        ease, interval, reps, next_at = review_card(
            rating=rating,
            ease=card.ease,
            interval_days=card.interval_days,
            repetitions=card.repetitions,
        )
        card.ease = ease
        card.interval_days = interval
        card.repetitions = reps
        card.next_review_at = next_at
        card.last_reviewed_at = next_at
        if rating in (ReviewRating.GOOD, ReviewRating.EASY):
            card.known = True
            card.marked_difficult = False
        else:
            card.known = False
            card.marked_difficult = True
        self.db.add(
            FlashcardReview(
                card_id=card.id,
                user_id=user.id,
                rating=rating,
                ease_after=ease,
                interval_after=interval,
            )
        )
        self.db.flush()
        return card


class TutorService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.credits = CreditService(db)

    def send(self, user: User, thread_id: UUID | None, message: str, mode: str) -> tuple[TutorThread, ChatMessage]:
        if thread_id:
            thread = self.db.scalar(
                select(TutorThread)
                .options(selectinload(TutorThread.messages))
                .where(TutorThread.id == thread_id, TutorThread.user_id == user.id)
            )
            if not thread:
                raise NotFoundError("Thread not found")
        else:
            thread = TutorThread(user_id=user.id, mode=mode, title=message[:80])
            self.db.add(thread)
            self.db.flush()
        self.credits.charge(
            user, "ai_tutor_message", CreditTransactionType.AI_TUTOR, reference_id=str(thread.id)
        )
        self.db.add(ChatMessage(tutor_thread_id=thread.id, role="user", content=message))
        history = [{"role": m.role, "content": m.content} for m in (thread.messages or [])]
        reply = tutor_graph.invoke(
            {
                "mode": mode,
                "paper": "GATE CS",
                "history": history,
                "user_message": message,
            }
        )["reply"]
        assistant = ChatMessage(tutor_thread_id=thread.id, role="assistant", content=reply)
        self.db.add(assistant)
        self.db.flush()
        return thread, assistant
