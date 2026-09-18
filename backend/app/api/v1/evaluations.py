from uuid import UUID
import json

from fastapi import APIRouter, Depends, File, Response, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.evaluation import Evaluation
from app.models.user import User
from app.schemas import ChatRequest, EvaluationCreateRequest, EvaluationRunRequest
from app.services.evaluations import FOLLOW_UP_LIMIT, EvaluationService

router = APIRouter(prefix="/evaluations", tags=["evaluations"])

ALLOWED = {"image/jpeg", "image/png", "image/webp"}


@router.post("")
def create_evaluation(
    payload: EvaluationCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    evaluation = EvaluationService(db).create_draft(user, payload.model_dump())
    db.commit()
    return {"id": str(evaluation.id), "status": evaluation.status}


@router.post("/{evaluation_id}/images")
def upload_images(
    evaluation_id: UUID,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = EvaluationService(db)
    evaluation = service.get(user, evaluation_id)
    for file in files:
        if file.content_type not in ALLOWED:
            raise AppError("Please upload JPG, PNG, or WEBP images.", 400, "invalid_file")
        data = file.file.read()
        if len(data) > settings.max_upload_mb * 1024 * 1024:
            raise AppError("Each image must be under 8 MB.", 400, "file_too_large")
        service.attach_image(evaluation, data, file.content_type or "image/jpeg")
    service.run_ocr(evaluation)
    db.commit()
    return {
        "id": str(evaluation.id),
        "extracted_text": evaluation.extracted_text,
        "status": evaluation.status,
        "progress": "Extracting handwriting...",
    }


@router.post("/{evaluation_id}/run")
def run_evaluation(
    evaluation_id: UUID,
    payload: EvaluationRunRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    evaluation = EvaluationService(db).evaluate(
        user,
        evaluation_id,
        payload.extracted_text,
        paper=payload.paper,
        topic=payload.topic,
        mark_weight=payload.mark_weight,
        word_target=payload.word_target,
        question_text=payload.question_text,
        solution_text=payload.solution_text,
    )
    db.commit()
    return _eval_out(evaluation)


@router.get("/{evaluation_id}")
def get_evaluation(
    evaluation_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return _eval_out(EvaluationService(db).get(user, evaluation_id))


@router.get("")
def list_evaluations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(
        select(Evaluation)
        .where(Evaluation.user_id == user.id)
        .order_by(Evaluation.created_at.desc())
        .limit(30)
    ).all()
    return [
        {
            "id": str(row.id),
            "score": row.score,
            "verdict": row.verdict,
            "status": row.status.value if hasattr(row.status, "value") else str(row.status),
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "subject": (row.result or {}).get("subject") if isinstance(row.result, dict) else None,
            "preview": (row.question_text or row.extracted_text or "")[:90],
        }
        for row in rows
    ]


@router.post("/{evaluation_id}/chat")
def follow_up(
    evaluation_id: UUID,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    message = EvaluationService(db).follow_up(user, evaluation_id, payload.message)
    db.commit()
    return {"role": message.role, "content": message.content}


@router.post("/{evaluation_id}/chat/stream")
def stream_follow_up(
    evaluation_id: UUID,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    def generate():
        try:
            for event in EvaluationService(db).iter_follow_up(user, evaluation_id, payload.message):
                yield f"data: {json.dumps(event)}\n\n"
            db.commit()
        except AppError as exc:
            db.rollback()
            yield f"data: {json.dumps({'error': exc.message, 'code': exc.code})}\n\n"
        except Exception:
            db.rollback()
            yield f"data: {json.dumps({'error': 'Follow-up failed. Please try again.'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.delete("/{evaluation_id}")
def delete_evaluation(
    evaluation_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    EvaluationService(db).delete(user, evaluation_id)
    db.commit()
    return Response(status_code=204)


def _eval_out(evaluation: Evaluation) -> dict:
    return {
        "id": str(evaluation.id),
        "status": evaluation.status,
        "score": evaluation.score,
        "max_score": evaluation.max_score,
        "verdict": evaluation.verdict,
        "question_text": evaluation.question_text,
        "solution_text": evaluation.solution_text,
        "extracted_text": evaluation.extracted_text,
        "result": evaluation.result,
        "confidence": evaluation.confidence,
        "error_message": evaluation.error_message,
        "messages": [
            {"role": m.role, "content": m.content}
            for m in (evaluation.chat.messages if evaluation.chat else [])
        ],
        "follow_up_limit": FOLLOW_UP_LIMIT,
    }
