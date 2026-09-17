from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import Profile, User
from app.schemas import TokenResponse
from app.services.credits import CreditService


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def signup(self, email: str, password: str, full_name: str) -> TokenResponse:
        existing = self.db.scalar(select(User).where(User.email == email.lower()))
        if existing:
            raise UnauthorizedError("An account with this email already exists.")
        user = User(
            email=email.lower(),
            hashed_password=hash_password(password),
            full_name=full_name,
            onboarding_completed=True,
        )
        self.db.add(user)
        self.db.flush()
        self.db.add(Profile(user_id=user.id))
        CreditService(self.db).ensure_wallet(user)
        self.db.commit()
        self.db.refresh(user)
        return self._tokens(user)

    def login(self, email: str, password: str) -> TokenResponse:
        user = self.db.scalar(select(User).where(User.email == email.lower()))
        if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Incorrect email or password.")
        return self._tokens(user)

    def upsert_google_user(self, *, email: str, full_name: str, sub: str, avatar: str | None) -> TokenResponse:
        user = self.db.scalar(select(User).where(User.google_sub == sub))
        if user is None:
            user = self.db.scalar(select(User).where(User.email == email.lower()))
        if user is None:
            user = User(email=email.lower(), full_name=full_name, google_sub=sub, avatar_url=avatar, onboarding_completed=True)
            self.db.add(user)
            self.db.flush()
            self.db.add(Profile(user_id=user.id))
            CreditService(self.db).ensure_wallet(user)
        else:
            user.google_sub = sub
            user.full_name = full_name or user.full_name
            user.avatar_url = avatar or user.avatar_url
        self.db.commit()
        self.db.refresh(user)
        return self._tokens(user)

    def _tokens(self, user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user.id, user.role.value),
            refresh_token=create_refresh_token(user.id),
            onboarding_completed=user.onboarding_completed,
        )
