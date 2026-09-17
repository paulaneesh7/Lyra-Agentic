from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.flashcard import Flashcard, FlashcardDeck
from app.models.user import User
from app.schemas import ChatRequest, FlashcardFlagRequest, FlashcardGenerateRequest, FlashcardReviewRequest, FlashcardUpdateRequest
from app.services.credits import CreditService
from app.services.study_ai import FlashcardService, TutorService
from app.services.study_plan import StudyPlanService

router = APIRouter(tags=["study"])


@router.post("/flashcards/generate")
def generate_flashcards(
    payload: FlashcardGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deck = FlashcardService(db).generate(user, payload.model_dump())
    db.commit()
    deck = db.scalar(
        select(FlashcardDeck)
        .options(selectinload(FlashcardDeck.cards))
        .where(FlashcardDeck.id == deck.id)
    )
    wallet = CreditService(db).ensure_wallet(user)
    out = _deck_out(deck)
    out["credits_left"] = wallet.balance
    return out


@router.get("/flashcards/decks")
def list_decks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    decks = db.scalars(
        select(FlashcardDeck)
        .options(selectinload(FlashcardDeck.cards))
        .where(FlashcardDeck.user_id == user.id)
        .order_by(FlashcardDeck.created_at.desc())
    ).all()
    return [_deck_out(deck) for deck in decks]


@router.get("/flashcards/decks/{deck_id}")
def get_deck(deck_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _deck_out(FlashcardService(db).get_deck(user, deck_id))


@router.delete("/flashcards/decks/{deck_id}")
def delete_deck(deck_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    FlashcardService(db).delete_deck(user, deck_id)
    db.commit()
    return {"ok": True}


@router.get("/flashcards/due")
def due_cards(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    cards = db.scalars(
        select(Flashcard)
        .where(Flashcard.user_id == user.id)
        .where((Flashcard.next_review_at.is_(None)) | (Flashcard.next_review_at <= now))
        .limit(40)
    ).all()
    return [_card_out(card) for card in cards]


@router.post("/flashcards/{card_id}/review")
def review_card(
    card_id: UUID,
    payload: FlashcardReviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    card = FlashcardService(db).review(user, card_id, payload.rating)
    db.commit()
    return _card_out(card)


@router.post("/flashcards/{card_id}/flags")
def flag_card(
    card_id: UUID,
    payload: FlashcardFlagRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    card = FlashcardService(db).flag_card(user, card_id, payload.model_dump())
    db.commit()
    return _card_out(card)


@router.patch("/flashcards/{card_id}")
def update_card(
    card_id: UUID,
    payload: FlashcardUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    card = FlashcardService(db).update_card(user, card_id, payload.model_dump(exclude_unset=True))
    db.commit()
    return _card_out(card)


@router.post("/tutor/message")
def tutor_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    thread, message = TutorService(db).send(user, payload.thread_id, payload.message, payload.mode)
    db.commit()
    return {"thread_id": str(thread.id), "role": message.role, "content": message.content}


@router.post("/study-plan/generate")
def generate_plan(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = StudyPlanService(db).generate(user)
    db.commit()
    return {"id": str(plan.id), "plan": plan.plan_json}


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _card_out(card: Flashcard) -> dict:
    now = datetime.now(timezone.utc)
    nxt = _aware(card.next_review_at)
    if card.known and card.repetitions >= 4:
        status = "mastered"
    elif nxt is None or nxt <= now:
        status = "due"
    else:
        status = "learning"
    return {
        "id": str(card.id),
        "front": card.front,
        "back": card.back,
        "explanation": card.explanation,
        "ease": card.ease,
        "interval_days": card.interval_days,
        "repetitions": card.repetitions,
        "next_review_at": card.next_review_at.isoformat() if card.next_review_at else None,
        "status": status,
        "source": card.source,
        "bookmarked": card.bookmarked,
        "known": card.known,
        "marked_difficult": card.marked_difficult,
        "difficulty": card.difficulty.value if hasattr(card.difficulty, "value") else str(card.difficulty),
        "tags": card.tags or [],
    }


def _deck_out(deck: FlashcardDeck) -> dict:
    now = datetime.now(timezone.utc)
    due = 0
    bookmarked = 0
    known = 0
    shaky = 0
    for card in deck.cards or []:
        if card.bookmarked:
            bookmarked += 1
        if card.known:
            known += 1
        if card.marked_difficult:
            shaky += 1
        nxt = _aware(card.next_review_at)
        if nxt is None or nxt <= now:
            due += 1
    focus = deck.focus.value if hasattr(deck.focus, "value") else str(deck.focus)
    total = len(deck.cards or [])
    return {
        "id": str(deck.id),
        "title": deck.title,
        "focus": focus,
        "subject": getattr(deck, "subject_name", "") or "",
        "unit": getattr(deck, "unit_name", "") or "",
        "paper": getattr(deck, "paper_code", "") or "CS",
        "card_count": total,
        "due_count": due,
        "bookmarked_count": bookmarked,
        "known_count": known,
        "shaky_count": shaky,
        "created_at": deck.created_at.isoformat() if deck.created_at else None,
        "cards": [_card_out(card) for card in (deck.cards or [])],
    }
