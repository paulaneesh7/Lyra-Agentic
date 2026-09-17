from urllib.parse import quote

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.exceptions import AppError
from app.core.logging import logger
from app.db.session import get_db
from app.models.exam import Exam, ExamPaper, Subject
from app.models.user import Profile, User
from app.schemas import LoginRequest, OnboardingRequest, SignupRequest, TokenResponse, UserOut
from app.services.auth import AuthService
from app.services.credits import CreditService

router = APIRouter(prefix="/auth", tags=["auth"])

oauth = OAuth()
_google_registered = False


def _ensure_google() -> None:
    global _google_registered
    current = get_settings()
    if not current.google_oauth_configured:
        raise AppError(
            "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
            503,
            "oauth_unconfigured",
        )
    if not _google_registered:
        oauth.register(
            name="google",
            client_id=current.google_client_id,
            client_secret=current.google_client_secret,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )
        _google_registered = True


@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService(db).signup(payload.email, payload.password, payload.full_name)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return AuthService(db).login(payload.email, payload.password)


@router.get("/google")
async def google_login(request: Request):
    _ensure_google()
    current = get_settings()
    redirect_uri = f"{current.api_url}/api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    _ensure_google()
    current = get_settings()
    fail = RedirectResponse(f"{current.app_url}/login?error=google")
    try:
        token = await oauth.google.authorize_access_token(request)
        info = token.get("userinfo") or {}
        if not info.get("email") or not info.get("sub"):
            id_token = token.get("id_token")
            if id_token:
                from jose import jwt as jose_jwt

                info = jose_jwt.get_unverified_claims(id_token)
        if not info.get("email") or not info.get("sub"):
            logger.warning("google_oauth_missing_profile")
            return fail
        tokens = AuthService(db).upsert_google_user(
            email=info["email"],
            full_name=info.get("name") or info["email"].split("@")[0],
            sub=info["sub"],
            avatar=info.get("picture"),
        )
    except Exception:
        logger.exception("google_oauth_callback_failed")
        return fail
    dest = f"{current.app_url}/auth/callback#access_token={quote(tokens.access_token)}"
    return RedirectResponse(dest, status_code=302)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    wallet = CreditService(db).ensure_wallet(user)
    db.commit()
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=role,
        onboarding_completed=user.onboarding_completed,
        avatar_url=user.avatar_url,
        credits=wallet.balance,
    )


@router.post("/onboarding")
def onboarding(
    payload: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.code == "GATE").one()
    paper = db.query(ExamPaper).filter(ExamPaper.code == payload.paper_code).one()
    profile = db.query(Profile).filter(Profile.user_id == user.id).one()
    profile.exam_id = exam.id
    profile.paper_id = paper.id
    profile.target_year = payload.target_year
    profile.preparation_level = payload.preparation_level
    profile.target_score = payload.target_score
    profile.target_rank = payload.target_rank
    profile.prioritized_subject_ids = [str(s) for s in payload.prioritized_subject_ids]
    profile.daily_study_minutes = payload.daily_study_minutes
    profile.exam_mode = payload.exam_mode
    profile.exam_date = payload.exam_date
    user.onboarding_completed = True
    db.commit()
    return {"ok": True}
