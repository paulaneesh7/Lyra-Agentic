from datetime import datetime, timezone
from collections.abc import Iterator
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.ai.graphs.evaluation import evaluation_graph
from app.ai.graphs.followup import followup_graph
from app.ai.ocr.factory import get_ocr_provider
from app.ai.providers.factory import get_ai_provider
from app.ai.storage import get_storage
from app.core.exceptions import AppError, NotFoundError
from app.models.enums import CreditTransactionType, EvaluationStatus
from app.models.evaluation import ChatMessage, Evaluation, EvaluationChat, EvaluationImage
from app.models.user import User
from app.services.credits import CreditService

FOLLOW_UP_LIMIT = 5


class EvaluationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.credits = CreditService(db)
        self.storage = get_storage()

    def create_draft(self, user: User, payload: dict) -> Evaluation:
        evaluation = Evaluation(
            user_id=user.id,
            question_text=payload.get("question_text", ""),
            solution_text=payload.get("solution_text", ""),
            question_type=payload.get("question_type", "DESCRIPTIVE"),
            subject_id=payload.get("subject_id"),
            topic_id=payload.get("topic_id"),
            question_id=payload.get("question_id"),
            status=EvaluationStatus.DRAFT,
        )
        self.db.add(evaluation)
        self.db.flush()
        return evaluation

    def attach_image(self, evaluation: Evaluation, data: bytes, content_type: str) -> EvaluationImage:
        key = self.storage.save(data, content_type, folder=f"evaluations/{evaluation.id}")
        image = EvaluationImage(
            evaluation_id=evaluation.id,
            storage_key=key,
            content_type=content_type,
            sort_order=len(evaluation.images),
        )
        self.db.add(image)
        self.db.flush()
        return image

    def run_ocr(self, evaluation: Evaluation) -> Evaluation:
        evaluation.status = EvaluationStatus.OCR_PENDING
        self.db.flush()
        images = [self.storage.load(img.storage_key) for img in evaluation.images]
        text = get_ocr_provider().extract_text(images) if images else ""
        for img in evaluation.images:
            img.ocr_text = text
            img.ocr_status = "completed"
        evaluation.extracted_text = text
        evaluation.status = EvaluationStatus.READY_FOR_REVIEW
        self.db.flush()
        return evaluation

    def evaluate(
        self,
        user: User,
        evaluation_id: UUID,
        extracted_text: str | None,
        paper: str | None = None,
        topic: str | None = None,
        mark_weight: str | None = None,
        word_target: int | None = None,
        question_text: str | None = None,
        solution_text: str | None = None,
    ) -> Evaluation:
        evaluation = self.get(user, evaluation_id)
        if extracted_text is not None:
            evaluation.extracted_text = extracted_text
        if question_text is not None:
            evaluation.question_text = question_text
        if solution_text is not None:
            evaluation.solution_text = solution_text
        tx = self.credits.charge(
            user,
            "evaluation",
            CreditTransactionType.AI_EVALUATION,
            reference_id=str(evaluation.id),
        )
        evaluation.credit_transaction_id = tx.id
        evaluation.status = EvaluationStatus.EVALUATING
        self.db.flush()
        started = datetime.now(timezone.utc)
        try:
            result = evaluation_graph.invoke(
                {
                    "question_text": evaluation.question_text,
                    "solution_text": evaluation.solution_text,
                    "extracted_text": evaluation.extracted_text,
                    "question_type": getattr(evaluation.question_type, "value", evaluation.question_type),
                    "topic": topic or "",
                    "paper": paper or "GATE CS",
                    "mark_weight": mark_weight or "",
                    "word_target": word_target or 0,
                }
            )
            payload = result["result"]
            if topic:
                payload["subject"] = topic
            if paper:
                payload["paper"] = paper
            if mark_weight:
                payload["mark_weight"] = mark_weight
            evaluation.result = payload
            evaluation.score = payload.get("score")
            raw_verdict = str(payload.get("verdict") or "")
            evaluation.verdict = raw_verdict
            evaluation.confidence = payload.get("confidence")
            evaluation.prompt_version = payload.get("prompt_version", "evaluation_v1")
            evaluation.model_name = (payload.get("provider") or "")[:80] or None
            evaluation.status = EvaluationStatus.COMPLETED
        except Exception:
            evaluation.status = EvaluationStatus.FAILED
            evaluation.error_message = "We could not complete this evaluation. Credits will be refunded."
            self.credits.refund(
                user,
                abs(tx.amount),
                reference_id=str(evaluation.id),
                note="evaluation_failed",
            )
        finally:
            evaluation.latency_ms = int(
                (datetime.now(timezone.utc) - started).total_seconds() * 1000
            )
            self.db.flush()
        if evaluation.status != EvaluationStatus.COMPLETED:
            return evaluation
        chat = EvaluationChat(evaluation_id=evaluation.id, user_id=user.id)
        self.db.add(chat)
        self.db.flush()
        return evaluation

    def follow_up(self, user: User, evaluation_id: UUID, message: str) -> ChatMessage:
        system, user_prompt, evaluation = self._prepare_follow_up(user, evaluation_id, message)
        if evaluation.chat is None:
            raise AppError("Follow-up chat is not available.", 500, "chat_missing")
        reply = get_ai_provider().complete_text(system=system, user=user_prompt)
        assistant = ChatMessage(chat_id=evaluation.chat.id, role="assistant", content=reply)
        self.db.add(assistant)
        self.db.flush()
        return assistant

    def iter_follow_up(self, user: User, evaluation_id: UUID, message: str) -> Iterator[dict]:
        system, user_prompt, evaluation = self._prepare_follow_up(user, evaluation_id, message)
        if evaluation.chat is None:
            raise AppError("Follow-up chat is not available.", 500, "chat_missing")
        chunks: list[str] = []
        for delta in get_ai_provider().stream_text(system=system, user=user_prompt):
            if not delta:
                continue
            chunks.append(delta)
            yield {"delta": delta}
        assistant = ChatMessage(
            chat_id=evaluation.chat.id,
            role="assistant",
            content="".join(chunks).strip() or "I could not generate a follow-up. Please try again.",
        )
        self.db.add(assistant)
        self.db.flush()
        yield {"done": True}

    def delete(self, user: User, evaluation_id: UUID) -> None:
        evaluation = self.get(user, evaluation_id)
        self.db.delete(evaluation)
        self.db.flush()

    def _prepare_follow_up(self, user: User, evaluation_id: UUID, message: str) -> tuple[str, str, Evaluation]:
        evaluation = self.get(user, evaluation_id)
        if evaluation.chat is None:
            evaluation.chat = EvaluationChat(evaluation_id=evaluation.id, user_id=user.id)
            self.db.add(evaluation.chat)
            self.db.flush()
        used = sum(1 for m in evaluation.chat.messages if m.role == "user")
        if used >= FOLLOW_UP_LIMIT:
            raise AppError(
                f"This evaluation has used all {FOLLOW_UP_LIMIT} follow-ups.",
                429,
                "followup_limit",
            )
        self.credits.charge(
            user,
            "ai_tutor_message",
            CreditTransactionType.AI_TUTOR,
            reference_id=str(evaluation.id),
        )
        user_msg = ChatMessage(chat_id=evaluation.chat.id, role="user", content=message)
        self.db.add(user_msg)
        self.db.flush()
        history = [
            {"role": m.role, "content": m.content} for m in evaluation.chat.messages if m.role in {"user", "assistant"}
        ]
        packet = followup_graph.invoke(
            {
                "question_text": evaluation.question_text or "",
                "solution_text": evaluation.solution_text or "",
                "extracted_text": evaluation.extracted_text or "",
                "score": evaluation.score,
                "verdict": evaluation.verdict or "",
                "result": evaluation.result or {},
                "history": history[:-1],
                "user_message": message,
            }
        )
        return packet["system_prompt"], packet["user_prompt"], evaluation

    def get(self, user: User, evaluation_id: UUID) -> Evaluation:
        row = self.db.scalar(
            select(Evaluation)
            .options(
                selectinload(Evaluation.images),
                selectinload(Evaluation.chat).selectinload(EvaluationChat.messages),
            )
            .where(Evaluation.id == evaluation_id, Evaluation.user_id == user.id)
        )
        if not row:
            raise NotFoundError("Evaluation not found")
        return row
