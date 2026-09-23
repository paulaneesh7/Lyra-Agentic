"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  ClipboardPaste,
  Eraser,
  FileText,
  ImagePlus,
  Pencil,
  Sparkles,
  Timer,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EvalWorkspace, type EvalHistoryItem } from "@/components/evaluation/workspace";
import { ScoringStage } from "@/components/evaluation/scoring-stage";
import { Loader } from "@/components/ui/loader";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { GATE_PAPERS } from "@/lib/gate-syllabus";
import { cn } from "@/lib/utils";

const MARKS = [
  { id: "1", label: "1 mark" },
  { id: "2", label: "2 marks" },
  { id: "nat", label: "NAT" },
];

const WORDS = [80, 150, 250];

const TYPES = [
  { id: "DESCRIPTIVE", label: "Written" },
  { id: "MCQ", label: "MCQ" },
  { id: "MSQ", label: "MSQ" },
];

const SAMPLES = [
  {
    subject: "Operating Systems",
    question: "Differentiate deadlock and starvation. Give one OS example of each, and name one necessary deadlock condition.",
  },
  {
    subject: "Computer Networks",
    question: "In TCP, explain how fast retransmit differs from a timeout-based retransmission. When is triple duplicate ACK used?",
  },
  {
    subject: "Algorithms",
    question: "Give the recurrence for merge sort and solve it. Why is the worst-case of quicksort Θ(n²)?",
  },
];

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function EvaluationPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [extracted, setExtracted] = useState("");
  const [evalId, setEvalId] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<EvalHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [drag, setDrag] = useState(false);
  const [paper, setPaper] = useState<"CS" | "DA">("CS");
  const [subject, setSubject] = useState("Operating Systems");
  const [marks, setMarks] = useState("2");
  const [words, setWords] = useState(150);
  const [qType, setQType] = useState("DESCRIPTIVE");

  const subjects = useMemo(
    () => GATE_PAPERS.find((p) => p.id === paper)?.subjects.map((s) => s.name) ?? [],
    [paper],
  );

  useEffect(() => {
    if (!subjects.includes(subject) && subjects[0]) setSubject(subjects[0]);
  }, [subjects, subject]);

  useEffect(() => {
    api<EvalHistoryItem[]>("/api/evaluations")
      .then(setHistory)
      .catch(() => undefined)
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void run().catch((e) => toast.error(e instanceof Error ? e.message : "Evaluation failed"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function resetForm() {
    setQuestion("");
    setSolution("");
    setFiles([]);
    setExtracted("");
    setEvalId(null);
    setStep(null);
    setBusy(false);
  }

  async function removeHistory(id: string) {
    await api(`/api/evaluations/${id}`, { method: "DELETE" });
    setHistory((rows) => rows.filter((row) => row.id !== id));
  }

  async function createDraft() {
    const draft = await api<{ id: string }>("/api/evaluations", {
      method: "POST",
      body: JSON.stringify({
        question_text: question,
        solution_text: solution,
        question_type: qType,
      }),
    });
    setEvalId(draft.id);
    return draft.id;
  }

  async function handleFiles(list: FileList | File[]) {
    const next = Array.from(list).slice(0, 4);
    setFiles(next);
    if (!next.length) return;
    setBusy(true);
    try {
      const id = evalId ?? (await createDraft());
      setStep("Reading handwriting…");
      const body = new FormData();
      next.forEach((f) => body.append("files", f));
      const res = await api<{ extracted_text: string }>(`/api/evaluations/${id}/images`, {
        method: "POST",
        body,
        timeoutMs: 120_000,
      });
      setExtracted(res.extracted_text);
      setStep("Extracted text ready — edit if OCR missed a symbol, then evaluate.");
    } finally {
      setBusy(false);
    }
  }

  async function run() {
    if (!question.trim() && !solution.trim() && !extracted.trim() && !files.length) {
      toast.error("Paste a question, a solution, or upload a sheet first.");
      return;
    }
    setBusy(true);
    setStep("Scoring against GATE-style rubric…");
    try {
      const id = evalId ?? (await createDraft());
      const result = await api<{ id: string }>(`/api/evaluations/${id}/run`, {
        method: "POST",
        body: JSON.stringify({
          extracted_text: extracted,
          question_text: question,
          solution_text: solution,
          paper: paper === "CS" ? "GATE CS" : "GATE DA",
          topic: subject,
          mark_weight: marks,
          word_target: words,
        }),
        timeoutMs: 120_000,
      });
      router.push(`/evaluation/${result.id}`);
    } finally {
      setBusy(false);
    }
  }

  const qWords = wordCount(question);
  const aWords = wordCount(solution);
  const canRun = Boolean(question.trim() || solution.trim() || extracted.trim() || files.length);

  const evaluateBtn = (
    <button
      type="button"
      disabled={busy || !canRun}
      onClick={() => void run().catch((e) => toast.error(e instanceof Error ? e.message : "Evaluation failed"))}
      className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[var(--accent)] text-sm font-medium text-[var(--accent-text)] shadow-[0_10px_24px_var(--ring)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? (
        <>
          <Loader size="sm" /> Evaluating…
        </>
      ) : (
        <>
          <Sparkles size={16} /> Evaluate <ArrowRight size={16} />
        </>
      )}
    </button>
  );

  return (
    <EvalWorkspace
      history={history}
      historyLoading={historyLoading}
      onNew={resetForm}
      onDelete={removeHistory}
      chatEnabled={false}
      chat={[]}
      onSend={() => undefined}
      primaryAction={evaluateBtn}
    >
      <section className="relative flex min-h-0 flex-1 flex-col">
        <ScoringStage active={busy} subject={subject} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Submit your answer</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Type or upload your question and answer. Photos are OCRed before scoring.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={paper}
                onChange={(v) => setPaper(v as "CS" | "DA")}
                ariaLabel="Paper"
                menuTitle="Paper"
                options={[
                  { value: "CS", label: "GATE CS" },
                  { value: "DA", label: "GATE DA" },
                ]}
              />
              <Select
                value={subject}
                onChange={setSubject}
                ariaLabel="Subject"
                menuTitle="Subject"
                className="max-w-[220px]"
                options={subjects.map((name) => ({ value: name, label: name }))}
              />
              <Select
                value={String(words)}
                onChange={(v) => setWords(Number(v))}
                ariaLabel="Word target"
                menuTitle="Word target"
                options={WORDS.map((n) => ({ value: String(n), label: `${n} words` }))}
              />
              <Select
                value={marks}
                onChange={setMarks}
                ariaLabel="Marks"
                menuTitle="Marks"
                options={MARKS.map((m) => ({ value: m.id, label: m.label }))}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setQType(t.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-medium",
                  qType === t.id ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-muted)]",
                )}
              >
                {t.label}
              </button>
            ))}
            {SAMPLES.map((s) => (
              <button
                key={s.subject}
                type="button"
                onClick={() => {
                  setQuestion(s.question);
                  setSubject(s.subject);
                  toast.message("Sample loaded — write your own solution");
                }}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] text-[var(--text-muted)] hover:border-[var(--accent)]"
              >
                <WandSparkles size={11} /> {s.subject} sample
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-3">
              <div className="mb-1 flex items-center justify-between text-sm font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <FileText size={14} className="text-[var(--accent)]" /> Question
                </span>
                <span className="text-[11px] font-normal text-[var(--text-muted)]">{qWords} words</span>
              </div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Paste the question here…"
                className="min-h-44 w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
              <div className="flex justify-end">
                <Pencil size={14} className="text-[var(--text-muted)]" />
              </div>
            </div>
            <div className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-3">
              <div className="mb-1 flex items-center justify-between text-sm font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Pencil size={14} className="text-[var(--accent)]" /> Your answer
                </span>
                <span className="text-[11px] font-normal text-[var(--text-muted)]">
                  {aWords} / {words} words
                </span>
              </div>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Paste your answer here…"
                className="min-h-44 w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
              <div className="flex justify-end gap-2 text-[var(--text-muted)]">
                <button type="button" aria-label="Clear answer" onClick={() => setSolution("")}>
                  <Eraser size={14} />
                </button>
                <Pencil size={14} />
              </div>
            </div>
          </div>

          <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
            <Camera size={14} className="text-[var(--accent)]" /> Photos{" "}
            <span className="font-normal text-[var(--text-muted)]">(optional, max 4)</span>
          </p>
          <label
            className={cn(
              "mt-2 grid min-h-[132px] cursor-pointer place-items-center rounded-md border border-dashed px-4 py-6 text-center transition",
              drag ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--bg-elevated)]",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void handleFiles(e.dataTransfer.files).catch((err) => toast.error(err.message));
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && void handleFiles(e.target.files).catch((err) => toast.error(err.message))}
            />
            <ImagePlus className="text-[var(--text-muted)]" size={22} />
            <p className="mt-2 text-sm">Drop question & answer sheet photos here</p>
            <p className="text-xs text-[var(--text-muted)]">JPG · PNG · WEBP</p>
          </label>
          {previews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <div key={src} className="relative h-16 w-16 overflow-hidden rounded-md border border-[var(--line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-black/60 text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      setFiles((current) => current.filter((_, idx) => idx !== i));
                    }}
                    aria-label="Remove photo"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {extracted && (
            <div className="mt-4 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <ClipboardPaste size={14} /> Extracted handwriting
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-[11px] text-[var(--accent)]"
                    onClick={() => setQuestion((q) => (q ? q : extracted))}
                  >
                    Use as question
                  </button>
                  <button
                    type="button"
                    className="text-[11px] text-[var(--accent)]"
                    onClick={() => setSolution((s) => (s ? `${s}\n${extracted}` : extracted))}
                  >
                    Append to answer
                  </button>
                </div>
              </div>
              <textarea
                value={extracted}
                onChange={(e) => setExtracted(e.target.value)}
                className="min-h-24 w-full resize-y bg-transparent text-sm outline-none"
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-muted)] px-2 py-1">
              <Timer size={12} /> ~{marks === "1" ? "1–2" : "2–3"} min GATE pace
            </span>
            <span className="rounded-md bg-[var(--bg-muted)] px-2 py-1">Rubric: correctness · approach · reasoning · efficiency</span>
            <span className="rounded-md bg-[var(--bg-muted)] px-2 py-1">10 credits per evaluation</span>
          </div>

          {step && !busy && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--accent)]">
              <Loader size="sm" /> {step}
            </p>
          )}
        </div>

        <div className="hidden border-t border-[var(--line)] bg-[var(--bg)] p-3 md:px-6 lg:block">{evaluateBtn}</div>
      </section>
    </EvalWorkspace>
  );
}
