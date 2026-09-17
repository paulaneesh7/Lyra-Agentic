# GATEPilot AI

AI-first GATE preparation platform (initial paper: **GATE CS/IT**) with an exam-agnostic core so GATE EE/ME, JEE, and others can be added later.

Brand name lives in environment variables (`APP_NAME` / `NEXT_PUBLIC_APP_NAME`) so it can change without a rewrite.

## What this MVP includes

- Landing, auth (email + Google OAuth), onboarding
- Dashboard, question bank, practice, mock tests, scoring engine
- AI evaluation (LangGraph), OCR abstraction, follow-up chat
- Flashcard generation + SM-2 spaced repetition
- AI tutor (LangGraph), study plan, weakness/recommendation engine
- Credit wallet + ledger (no real payments)
- Admin overview
- Stub AI/OCR providers so the product works before API keys exist

## Repository layout

```
frontend/   Next.js App Router (TypeScript)
backend/   FastAPI + SQLAlchemy + LangChain/LangGraph
```

## Providers you need to create

| Capability | Provider | What to put in `backend/.env` |
|---|---|---|
| Postgres | **Neon** | `DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/dbname?sslmode=require` |
| Google login | **Google Cloud OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| LLM (default) | **OpenAI** | `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_MODEL` |
| LLM (alt) | **Azure OpenAI** | `AI_PROVIDER=azure_openai`, `AZURE_OPENAI_*` |
| OCR (alt) | **Azure Document Intelligence** | `OCR_PROVIDER=azure`, `AZURE_DOCUMENT_INTELLIGENCE_*` |
| OCR (default live) | OpenAI vision | `OCR_PROVIDER=vision_llm` (uses the OpenAI key) |
| Files | Local disk or **AWS S3** | `STORAGE_PROVIDER=local` or `s3` + `S3_BUCKET` + AWS keys |
| Cache/jobs (later) | Redis | `REDIS_URL` — architecture is ready, not required for MVP |

Until keys exist, set `AI_PROVIDER=stub` and `OCR_PROVIDER=stub`. The UI still runs with labelled demo feedback.

### Google OAuth redirect

Authorized redirect URI:

`http://localhost:8000/api/auth/google/callback`

### Neon URL format

Use the **SQLAlchemy + psycopg3** prefix:

`postgresql+psycopg://...`

not `postgresql://` alone.

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# paste your Neon URL and keys into .env
uvicorn app.main:app --reload --port 8000
```

Tables and GATE CS seed data are created on startup.

Demo admin: `admin@gatepilot.ai` / `ChangeMeAdmin!23`

### Frontend

```powershell
cd frontend
copy .env.example .env.local
# keep NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:3000`.

### Tests

```powershell
cd backend
pytest
```

## Agent architecture (showcase)

LangGraph graphs in `backend/app/ai/graphs/`:

- `evaluation` — normalize OCR/text → structured JSON evaluation → Pydantic validate/repair
- `flashcards` — syllabus-aware card batch
- `tutor` — mode-conditioned tutoring with conversation history

Prompts are versioned in `backend/app/ai/prompts/` (`evaluation_v1`, …). Providers implement `AIProvider` (`openai`, `azure_openai`, `stub`).

Credits are never hardcoded in UI: `credit_costs` + `CreditService` with `SELECT … FOR UPDATE`.

Scoring is `ScoringEngine` with per-exam JSON config.

## Product loop

Practice → evaluate → understand the mistake → revise (flashcards/tutor) → practice again → analytics.
