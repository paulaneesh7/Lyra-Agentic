from uuid import UUID

from fastapi import Depends, Header
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError()
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except (JWTError, ValueError) as exc:
        raise UnauthorizedError("Session expired. Please sign in again.") from exc
    if payload.get("type") != "access":
        raise UnauthorizedError()
    user = db.scalar(select(User).where(User.id == UUID(payload["sub"])))
    if user is None or not user.is_active:
        raise UnauthorizedError()
    return user


def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise ForbiddenError("Admin access required")
    return user
