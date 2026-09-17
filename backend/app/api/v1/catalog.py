from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.exam import Exam, ExamPaper, Subject, Topic

router = APIRouter(tags=["exams"])


@router.get("/exams")
def list_exams(db: Session = Depends(get_db)):
    exams = db.query(Exam).options(selectinload(Exam.papers)).all()
    return [
        {
            "id": str(exam.id),
            "code": exam.code,
            "name": exam.name,
            "scoring_config": exam.scoring_config,
            "question_types": exam.question_types,
            "papers": [
                {
                    "id": str(paper.id),
                    "code": paper.code,
                    "name": paper.name,
                    "is_available": paper.is_available,
                    "coming_soon": paper.coming_soon,
                    "duration_minutes": paper.duration_minutes,
                    "total_marks": paper.total_marks,
                }
                for paper in exam.papers
            ],
        }
        for exam in exams
    ]


@router.get("/subjects")
def list_subjects(paper_code: str = "CS", db: Session = Depends(get_db)):
    paper = db.query(ExamPaper).filter(ExamPaper.code == paper_code).one()
    subjects = (
        db.query(Subject)
        .options(selectinload(Subject.topics).selectinload(Topic.subtopics))
        .filter(Subject.paper_id == paper.id)
        .order_by(Subject.sort_order)
        .all()
    )
    return [
        {
            "id": str(subject.id),
            "slug": subject.slug,
            "name": subject.name,
            "description": subject.description,
            "topics": [
                {
                    "id": str(topic.id),
                    "slug": topic.slug,
                    "name": topic.name,
                    "subtopics": [
                        {"id": str(st.id), "slug": st.slug, "name": st.name}
                        for st in topic.subtopics
                    ],
                }
                for topic in subject.topics
            ],
        }
        for subject in subjects
    ]
