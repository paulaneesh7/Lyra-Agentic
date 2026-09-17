"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { api } from "@/lib/api";

type Subject = { id: string; name: string; topics: { id: string; name: string }[] };
type Question = {
  id: string;
  stem: string;
  question_type: string;
  options: { id: string; label: string; text: string }[];
};
type Result = { score: number; accuracy: number; correct: number; incorrect: number; skipped: number };

export default function PracticePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [count, setCount] = useState(5);
  const [session, setSession] = useState<{ session_id: string; questions: Question[] } | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Subject[]>("/api/subjects").then(setSubjects).catch((e) => toast.error(e.message));
  }, []);

  async function start() {
    setBusy(true);
    try {
      const data = await api<{ session_id: string; questions: Question[] }>("/api/practice/start", {
        method: "POST",
        body: JSON.stringify({ subject_id: subjectId || null, count }),
      });
      setSession(data);
      setIdx(0);
      setResult(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start practice");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!session) return;
    const payload = session.questions.map((q) => ({
      question_id: q.id,
      selected_option_ids: answers[q.id] ?? [],
      skipped: !(answers[q.id]?.length),
    }));
    const data = await api<Result>(`/api/practice/${session.session_id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers: payload }),
    });
    setResult(data);
  }

  if (result) {
    return (
      <Card>
        <h1 className="font-serif text-3xl">Practice complete</h1>
        <p className="mt-4">Score {result.score} · Accuracy {(result.accuracy * 100).toFixed(0)}%</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Correct {result.correct} · Incorrect {result.incorrect} · Skipped {result.skipped}
        </p>
        <p className="mt-4 text-sm">Recommended revision: review incorrect items, then generate flashcards.</p>
        <Button className="mt-6" onClick={() => { setSession(null); setResult(null); }}>
          New set
        </Button>
      </Card>
    );
  }

  if (session) {
    const q = session.questions[idx];
    if (!q) return <p>No sample questions available for this filter.</p>;
    return (
      <div>
        <p className="text-sm text-[var(--muted)]">
          Question {idx + 1} of {session.questions.length} · {q.question_type}
        </p>
        <h1 className="mt-2 font-serif text-2xl">{q.stem}</h1>
        <div className="mt-6 space-y-2">
          {q.options.map((opt) => {
            const selected = answers[q.id]?.includes(opt.id);
            return (
              <button
                key={opt.id}
                className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${selected ? "border-[var(--ink)] bg-[var(--paper-2)]" : "border-[var(--line)]"}`}
                onClick={() => {
                  setAnswers((prev) => {
                    const current = new Set(prev[q.id] ?? []);
                    if (q.question_type === "MSQ") {
                      current.has(opt.id) ? current.delete(opt.id) : current.add(opt.id);
                    } else {
                      return { ...prev, [q.id]: [opt.id] };
                    }
                    return { ...prev, [q.id]: [...current] };
                  });
                }}
              >
                {opt.label}. {opt.text}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" onClick={() => setIdx((i) => Math.max(0, i - 1))}>Previous</Button>
          <Button variant="secondary" onClick={() => setIdx((i) => Math.min(session.questions.length - 1, i + 1))}>Next</Button>
          <Button onClick={() => void submit()}>Submit set</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-4xl">Practice</h1>
      <p className="mt-2 text-[var(--muted)]">Choose a subject from the GATE CS syllabus, then start a focused set.</p>
      <Card className="mt-6 max-w-lg space-y-4">
        <select className="w-full rounded-md border border-[var(--line)] p-2 text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Any subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <label className="block text-sm">
          Number of questions
          <input type="number" className="mt-1 w-full rounded-md border border-[var(--line)] p-2" value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </label>
        <Button onClick={() => void start()} disabled={busy}>
          {busy ? (
            <>
              <Loader size="sm" /> Preparing questions…
            </>
          ) : (
            "Start practice"
          )}
        </Button>
      </Card>
    </div>
  );
}
