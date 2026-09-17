from app.models.enums import QuestionType
from app.scoring.engine import ScoringEngine


def test_mcq_correct_and_negative():
    engine = ScoringEngine()
    ok = engine.score(
        question_type=QuestionType.MCQ,
        marks=1,
        negative_marks=0.33,
        correct_option_ids=["b"],
        selected_option_ids=["b"],
        nat_answer=None,
        nat_response=None,
    )
    assert ok.correct and ok.marks_obtained == 1
    wrong = engine.score(
        question_type=QuestionType.MCQ,
        marks=1,
        negative_marks=0.33,
        correct_option_ids=["b"],
        selected_option_ids=["a"],
        nat_answer=None,
        nat_response=None,
    )
    assert wrong.incorrect and wrong.marks_obtained == -0.33


def test_msq_no_negative_and_exact_set():
    engine = ScoringEngine()
    result = engine.score(
        question_type=QuestionType.MSQ,
        marks=2,
        negative_marks=0.66,
        correct_option_ids=["a", "c"],
        selected_option_ids=["c", "a"],
        nat_answer=None,
        nat_response=None,
    )
    assert result.correct and result.marks_obtained == 2
    partial = engine.score(
        question_type=QuestionType.MSQ,
        marks=2,
        negative_marks=0.66,
        correct_option_ids=["a", "c"],
        selected_option_ids=["a"],
        nat_answer=None,
        nat_response=None,
    )
    assert partial.incorrect and partial.marks_obtained == 0


def test_nat_tolerance():
    engine = ScoringEngine()
    close = engine.score(
        question_type=QuestionType.NAT,
        marks=1,
        negative_marks=0,
        correct_option_ids=None,
        selected_option_ids=None,
        nat_answer="3.14",
        nat_response="3.141",
        nat_tolerance=0.01,
    )
    assert close.correct
    skipped = engine.score(
        question_type=QuestionType.NAT,
        marks=1,
        negative_marks=0,
        correct_option_ids=None,
        selected_option_ids=None,
        nat_answer="3",
        nat_response="",
        skipped=True,
    )
    assert skipped.unanswered and skipped.marks_obtained == 0
