from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.credits import CreditCost
from app.models.enums import Difficulty, QuestionType, SourceType, UserRole
from app.models.exam import Exam, ExamPaper, ExamSection, Subject, Subtopic, Topic
from app.models.mock import MockTest, MockTestQuestion
from app.models.progress import PurchasePlan
from app.models.question import Question, QuestionOption
from app.models.user import Profile, User
from app.scoring.engine import DEFAULT_GATE_SCORING
from app.services.credits import DEFAULT_COSTS, CreditService

SYLLABUS = [
    {
        "slug": "general-aptitude",
        "name": "General Aptitude",
        "topics": {
            "verbal": ["English grammar", "Verbal analogies", "Critical reasoning"],
            "numerical": ["Data interpretation", "Numerical computation", "Quantitative comparison"],
        },
    },
    {
        "slug": "engineering-mathematics",
        "name": "Engineering Mathematics",
        "topics": {
            "linear-algebra": ["Matrices", "Eigenvalues", "Vector spaces"],
            "calculus": ["Limits", "Integrals", "Multivariable calculus"],
            "probability": ["Random variables", "Distributions", "Bayes theorem"],
            "discrete-math": ["Sets", "Graphs", "Combinatorics"],
        },
    },
    {
        "slug": "programming-ds",
        "name": "Programming and Data Structures",
        "topics": {
            "programming": ["C basics", "Recursion", "Pointers"],
            "linear-structures": ["Arrays", "Stacks", "Queues", "Linked lists"],
            "trees-hashing": ["Binary trees", "Heaps", "Hashing"],
        },
    },
    {
        "slug": "algorithms",
        "name": "Algorithms",
        "topics": {
            "searching": ["Linear search", "Binary search"],
            "sorting": ["Merge sort", "Quick sort", "Heap sort"],
            "graph-algorithms": ["BFS", "DFS", "Shortest paths"],
            "dynamic-programming": ["Memoization", "Knapsack", "LCS"],
            "greedy": ["Activity selection", "Huffman coding"],
            "divide-conquer": ["Recurrence relations", "Master theorem"],
        },
    },
    {
        "slug": "toc",
        "name": "Theory of Computation",
        "topics": {
            "automata": ["DFA", "NFA", "Regular expressions"],
            "cfg": ["Context-free grammars", "Pushdown automata"],
            "decidability": ["Turing machines", "Undecidability"],
        },
    },
    {
        "slug": "compiler-design",
        "name": "Compiler Design",
        "topics": {
            "front-end": ["Lexical analysis", "Parsing"],
            "semantics": ["Syntax-directed translation", "Type checking"],
            "runtime": ["Intermediate code", "Code optimization"],
        },
    },
    {
        "slug": "operating-systems",
        "name": "Operating Systems",
        "topics": {
            "processes": ["Process states", "Threads", "IPC"],
            "scheduling": ["CPU scheduling", "Priority inversion"],
            "memory": ["Paging", "Virtual memory"],
            "concurrency": ["Deadlock", "Semaphores"],
        },
    },
    {
        "slug": "databases",
        "name": "Databases",
        "topics": {
            "relational": ["ER model", "Relational algebra"],
            "normalization": ["Functional dependencies", "Normal forms"],
            "transactions": ["ACID", "Concurrency control"],
            "sql": ["Queries", "Indexes"],
        },
    },
    {
        "slug": "computer-networks",
        "name": "Computer Networks",
        "topics": {
            "layering": ["OSI", "TCP/IP"],
            "routing": ["Distance vector", "Link state"],
            "transport": ["TCP congestion control", "UDP"],
            "application": ["DNS", "HTTP"],
        },
    },
    {
        "slug": "coa",
        "name": "Computer Organization and Architecture",
        "topics": {
            "machine": ["Instruction set", "Addressing modes"],
            "pipeline": ["Hazards", "Forwarding"],
            "memory-hierarchy": ["Cache", "Mapping"],
        },
    },
]


def seed_if_needed() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(Exam).where(Exam.code == "GATE")):
            return
        _seed(db)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _seed(db: Session) -> None:
    exam = Exam(
        code="GATE",
        name="Graduate Aptitude Test in Engineering",
        description="Configurable competitive exam model. GATE is the first paper family.",
        scoring_config=DEFAULT_GATE_SCORING,
        question_types=["MCQ", "MSQ", "NAT"],
    )
    db.add(exam)
    db.flush()

    papers = [
        ("CS", "Computer Science and Information Technology", True, False),
        ("DA", "Data Science and Artificial Intelligence", False, True),
        ("EE", "Electrical Engineering", False, True),
        ("ME", "Mechanical Engineering", False, True),
        ("ECE", "Electronics and Communication", False, True),
    ]
    cs_paper = None
    for code, name, available, soon in papers:
        paper = ExamPaper(
            exam_id=exam.id,
            code=code,
            name=name,
            is_available=available,
            coming_soon=soon,
            scoring_config=DEFAULT_GATE_SCORING,
        )
        db.add(paper)
        db.flush()
        if code == "CS":
            cs_paper = paper

    assert cs_paper is not None
    ga = ExamSection(paper_id=cs_paper.id, name="General Aptitude", sort_order=0)
    tech = ExamSection(paper_id=cs_paper.id, name="Technical", sort_order=1)
    db.add_all([ga, tech])
    db.flush()

    topic_index: dict[str, Topic] = {}
    subject_index: dict[str, Subject] = {}
    for order, item in enumerate(SYLLABUS):
        subject = Subject(
            paper_id=cs_paper.id,
            section_id=ga.id if item["slug"] == "general-aptitude" else tech.id,
            slug=item["slug"],
            name=item["name"],
            sort_order=order,
        )
        db.add(subject)
        db.flush()
        subject_index[item["slug"]] = subject
        for t_order, (topic_slug, subtopics) in enumerate(item["topics"].items()):
            topic = Topic(
                subject_id=subject.id,
                slug=topic_slug,
                name=topic_slug.replace("-", " ").title(),
                sort_order=t_order,
            )
            db.add(topic)
            db.flush()
            topic_index[f"{item['slug']}:{topic_slug}"] = topic
            for s_order, name in enumerate(subtopics):
                db.add(
                    Subtopic(
                        topic_id=topic.id,
                        slug=name.lower().replace(" ", "-"),
                        name=name,
                        sort_order=s_order,
                    )
                )

    questions = _demo_questions(cs_paper, exam, subject_index, topic_index)
    db.add_all(questions)
    db.flush()

    mock = MockTest(
        paper_id=cs_paper.id,
        title="GATE CS sample mini mock",
        description="Demo mock built from sample questions. Not an official GATE paper.",
        kind="full",
        duration_minutes=30,
        total_marks=sum(q.marks for q in questions),
        scoring_config=DEFAULT_GATE_SCORING,
    )
    db.add(mock)
    db.flush()
    for i, question in enumerate(questions):
        db.add(
            MockTestQuestion(
                mock_test_id=mock.id,
                question_id=question.id,
                section_name="Technical" if i else "General Aptitude",
                sort_order=i,
            )
        )

    for key, (cost, desc) in DEFAULT_COSTS.items():
        db.add(CreditCost(action_key=key, credits=cost, description=desc))

    db.add_all(
        [
            PurchasePlan(code="starter", name="Starter", price_inr=99, credits=100, badge=None),
            PurchasePlan(code="popular", name="Popular", price_inr=499, credits=550, badge="Popular"),
            PurchasePlan(code="pro", name="Pro", price_inr=999, credits=1150, badge="Best value"),
        ]
    )

    admin = User(
        email="admin@lyra.ai",
        hashed_password=None,
        full_name="Lyra Admin",
        role=UserRole.ADMIN,
        onboarding_completed=True,
    )
    from app.core.security import hash_password

    admin.hashed_password = hash_password("ChangeMeAdmin!23")
    db.add(admin)
    db.flush()
    db.add(Profile(user_id=admin.id, exam_id=exam.id, paper_id=cs_paper.id))
    CreditService(db).ensure_wallet(admin)


def _demo_questions(paper, exam, subjects: dict, topics: dict) -> list[Question]:
    algo = subjects["algorithms"]
    os_sub = subjects["operating-systems"]
    dbms = subjects["databases"]
    sorting = topics["algorithms:sorting"]
    sched = topics["operating-systems:scheduling"]
    norm = topics["databases:normalization"]

    q1 = Question(
        exam_id=exam.id,
        paper_id=paper.id,
        subject_id=algo.id,
        topic_id=sorting.id,
        question_type=QuestionType.MCQ,
        stem="[Sample Question] Which sorting algorithm is guaranteed O(n log n) in the worst case?",
        explanation="Merge sort (and heap sort) guarantee O(n log n) worst-case time. Quick sort is average O(n log n) but worst-case O(n²) with naive pivots. This is a demo item, not an official GATE question.",
        difficulty=Difficulty.EASY,
        marks=1,
        negative_marks=0.33,
        source_type=SourceType.DEMO,
        source_reference="Demo Question — Algorithms",
        tags=["sorting", "complexity"],
        official_answer_available=True,
    )
    q1.options = [
        QuestionOption(label="A", text="Quick sort with first-element pivot", is_correct=False),
        QuestionOption(label="B", text="Merge sort", is_correct=True),
        QuestionOption(label="C", text="Insertion sort", is_correct=False),
        QuestionOption(label="D", text="Bubble sort", is_correct=False),
    ]

    q2 = Question(
        exam_id=exam.id,
        paper_id=paper.id,
        subject_id=os_sub.id,
        topic_id=sched.id,
        question_type=QuestionType.MSQ,
        stem="[Sample Question] Which of the following can cause priority inversion? (Select all that apply conceptually.)",
        explanation="Priority inversion occurs when a high-priority task waits on a lock held by a lower-priority task. Demo question only.",
        difficulty=Difficulty.MEDIUM,
        marks=2,
        negative_marks=0,
        source_type=SourceType.DEMO,
        source_reference="Demo Question — Operating Systems",
        tags=["scheduling", "concurrency"],
        official_answer_available=True,
    )
    q2.options = [
        QuestionOption(label="A", text="A low-priority thread holds a mutex needed by a high-priority thread", is_correct=True),
        QuestionOption(label="B", text="Round-robin time slicing among equal-priority tasks", is_correct=False),
        QuestionOption(label="C", text="A medium-priority CPU-bound thread preempts the lock holder", is_correct=True),
        QuestionOption(label="D", text="Using only lock-free wait-free structures", is_correct=False),
    ]

    q3 = Question(
        exam_id=exam.id,
        paper_id=paper.id,
        subject_id=dbms.id,
        topic_id=norm.id,
        question_type=QuestionType.NAT,
        stem="[Sample Question] A relation R has 5 attributes and a candidate key of 2 attributes. How many extra attributes are there beyond the key? Enter an integer.",
        explanation="5 − 2 = 3. Demo NAT item; not from an official paper.",
        difficulty=Difficulty.EASY,
        marks=1,
        negative_marks=0,
        nat_answer="3",
        nat_tolerance=0,
        source_type=SourceType.DEMO,
        source_reference="Demo Question — Databases",
        tags=["normalization"],
        official_answer_available=True,
    )

    q4 = Question(
        exam_id=exam.id,
        paper_id=paper.id,
        subject_id=algo.id,
        topic_id=topics["algorithms:dynamic-programming"].id,
        question_type=QuestionType.MCQ,
        stem="[Sample Question] Dynamic programming is most applicable when a problem has which pair of properties?",
        explanation="Optimal substructure and overlapping subproblems. Demo question.",
        difficulty=Difficulty.MEDIUM,
        marks=2,
        negative_marks=0.66,
        source_type=SourceType.DEMO,
        source_reference="Demo Question — Algorithms",
        tags=["dynamic-programming"],
        official_answer_available=True,
    )
    q4.options = [
        QuestionOption(label="A", text="Greedy choice and overlapping subproblems", is_correct=False),
        QuestionOption(label="B", text="Optimal substructure and overlapping subproblems", is_correct=True),
        QuestionOption(label="C", text="Only divide-and-conquer recurrences", is_correct=False),
        QuestionOption(label="D", text="Amortized constant-time updates", is_correct=False),
    ]

    q5 = Question(
        exam_id=exam.id,
        paper_id=paper.id,
        subject_id=subjects["computer-networks"].id,
        topic_id=topics["computer-networks:transport"].id,
        question_type=QuestionType.MCQ,
        stem="[Sample Question] TCP congestion control primarily reacts to which signal in classic Reno-style control?",
        explanation="Loss (timeout or triple duplicate ACK) is the classic congestion signal. Demo question.",
        difficulty=Difficulty.MEDIUM,
        marks=1,
        negative_marks=0.33,
        source_type=SourceType.DEMO,
        source_reference="Demo Question — Networks",
        tags=["tcp"],
        official_answer_available=True,
    )
    q5.options = [
        QuestionOption(label="A", text="DNS TTL expiry", is_correct=False),
        QuestionOption(label="B", text="Packet loss inferred via timeout or duplicate ACKs", is_correct=True),
        QuestionOption(label="C", text="HTTP status 301", is_correct=False),
        QuestionOption(label="D", text="ARP cache miss", is_correct=False),
    ]
    return [q1, q2, q3, q4, q5]
