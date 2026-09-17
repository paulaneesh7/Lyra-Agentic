from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.ai.prompts import get_prompt
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas.outputs import STUDY_PLAN_JSON_SCHEMA, StudyPlanDraft
from app.models.study import StudyPlan, StudyTask
from app.models.user import User
from app.services.recommendations import RecommendationEngine


class StudyPlanService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def generate(self, user: User) -> StudyPlan:
        profile = user.profile
        provider = get_ai_provider()
        _, system = get_prompt("study_plan")
        raw = provider.complete_json(
            system=system,
            user=(
                f"Level: {getattr(profile, 'preparation_level', None)}\n"
                f"Daily minutes: {getattr(profile, 'daily_study_minutes', 90)}\n"
                f"Target score: {getattr(profile, 'target_score', None)}\n"
                f"Mode: {getattr(profile, 'exam_mode', None)}"
            ),
            schema_name="study_plan",
            schema=STUDY_PLAN_JSON_SCHEMA,
        )
        draft = StudyPlanDraft.model_validate(raw)
        plan = StudyPlan(
            user_id=user.id,
            exam_date=getattr(profile, "exam_date", None),
            daily_hours=(getattr(profile, "daily_study_minutes", 120) or 120) / 60,
            plan_json=draft.model_dump(),
        )
        self.db.add(plan)
        self.db.flush()
        today = date.today()
        for item in draft.tasks:
            self.db.add(
                StudyTask(
                    plan_id=plan.id,
                    user_id=user.id,
                    scheduled_for=today + timedelta(days=int(item.get("day_offset", 0))),
                    title=item.get("title", "Study task"),
                    task_type=item.get("task_type", "practice"),
                )
            )
        self.db.flush()
        RecommendationEngine(self.db).refresh_for_user(user)
        return plan
