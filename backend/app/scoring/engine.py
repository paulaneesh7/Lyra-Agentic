from dataclasses import dataclass

from app.models.enums import QuestionType

DEFAULT_GATE_SCORING = {
    "MCQ": {"correct": "marks", "wrong": "negative_marks", "unanswered": 0},
    "MSQ": {"correct": "marks", "partial": False, "wrong": 0, "unanswered": 0},
    "NAT": {"correct": "marks", "wrong": 0, "unanswered": 0},
    "DESCRIPTIVE": {"correct": "marks", "wrong": 0, "unanswered": 0},
}


@dataclass(frozen=True)
class ScoreResult:
    marks_obtained: float
    correct: bool
    incorrect: bool
    unanswered: bool
    negative_marks: float


class ScoringEngine:
    """Exam-configurable scoring. Never hard-code GATE rules in UI components."""

    def __init__(self, config: dict | None = None) -> None:
        self.config = config or DEFAULT_GATE_SCORING

    def score(
        self,
        *,
        question_type: QuestionType | str,
        marks: float,
        negative_marks: float,
        correct_option_ids: list[str] | None,
        selected_option_ids: list[str] | None,
        nat_answer: str | None,
        nat_response: str | None,
        nat_tolerance: float | None = None,
        skipped: bool = False,
    ) -> ScoreResult:
        qtype = QuestionType(question_type)
        if skipped or (
            not selected_option_ids
            and (nat_response is None or str(nat_response).strip() == "")
            and qtype != QuestionType.DESCRIPTIVE
        ):
            return ScoreResult(0.0, False, False, True, 0.0)

        if qtype in {QuestionType.MCQ, QuestionType.MSQ}:
            selected = {str(item) for item in (selected_option_ids or [])}
            expected = {str(item) for item in (correct_option_ids or [])}
            is_correct = selected == expected and len(expected) > 0
            if is_correct:
                return ScoreResult(float(marks), True, False, False, 0.0)
            penalty = float(negative_marks) if qtype == QuestionType.MCQ else 0.0
            return ScoreResult(-penalty if penalty else 0.0, False, True, False, penalty)

        if qtype == QuestionType.NAT:
            if nat_response is None or nat_answer is None:
                return ScoreResult(0.0, False, False, True, 0.0)
            if self._nat_matches(nat_answer, nat_response, nat_tolerance):
                return ScoreResult(float(marks), True, False, False, 0.0)
            return ScoreResult(0.0, False, True, False, 0.0)

        return ScoreResult(0.0, False, False, True, 0.0)

    @staticmethod
    def _nat_matches(expected: str, given: str, tolerance: float | None) -> bool:
        try:
            exp = float(expected)
            got = float(given)
        except ValueError:
            return expected.strip() == given.strip()
        delta = abs(exp - got)
        if tolerance is not None:
            return delta <= tolerance
        return delta <= max(1e-6, abs(exp) * 1e-6)
