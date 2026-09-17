"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, MessageCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "@/components/ui/loader";
import { api } from "@/lib/api";

type HistoryItem = { id: string; score: number | null; verdict: string | null; status: string };

export default function EvaluationPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [extracted, setExtracted] = useState("");
  const [evalId, setEvalId] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    api<HistoryItem[]>("/api/evaluations")
      .then(setHistory)
      .catch(() => undefined)
      .finally(() => setHistoryLoading(false));
  }, []);

  async function createDraft() {
    const draft = await api<{ id: string }>("/api/evaluations", {
      method: "POST",
      body: JSON.stringify({ question_text: question, solution_text: solution }),
    });
    setEvalId(draft.id);
    return draft.id;
  }

  async function handleFiles(list: FileList | File[]) {
    const next = Array.from(list).slice(0, 4);
    setFiles(next);
    const id = evalId ?? (await createDraft());
    setStep("Uploading image…");
    const body = new FormData();
    next.forEach((f) => body.append("files", f));
    const res = await api<{ extracted_text: string }>(`/api/evaluations/${id}/images`, {
      method: "POST",
      body,
    });
    setExtracted(res.extracted_text);
    setStep("Extracted handwriting — edit if needed, then evaluate.");
  }

  async function run() {
    if (!question.trim() && !solution.trim() && !extracted.trim() && !files.length) {
      toast.error("Paste a question, a solution, or upload a sheet first.");
      return;
    }
    const id = evalId ?? (await createDraft());
    setStep("Understanding solution…");
    const result = await api<{ id: string }>(`/api/evaluations/${id}/run`, {
      method: "POST",
      body: JSON.stringify({ extracted_text: extracted }),
    });
    router.push(`/evaluation/${result.id}`);
  }

  return (
    <div className="-mx-4 flex min-h-[calc(100vh-3rem)] flex-col md:-mx-8 lg:-mx-10">
      <div className="grid flex-1 lg:grid-cols-[220px_1fr_280px]">
        <aside className="hidden border-r border-[var(--line)] p-4 lg:block">
          <div className="mb-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
            History
            <button type="button" onClick={() => { setQuestion(""); setSolution(""); setFiles([]); setExtracted(""); setEvalId(null); setStep(null); }} className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]">
              <Plus size={14} />
            </button>
          </div>
          {history.length === 0 ? (
            historyLoading ? (
              <div className="grid place-items-center py-16">
                <Loader size="sm" />
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No evaluations yet.</p>
            )
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li key={item.id}>
                  <Link href={`/evaluation/${item.id}`} className="block rounded-md px-3 py-2 text-sm hover:bg-[var(--bg-muted)]">
                    {item.verdict || item.status} {item.score != null ? `· ${item.score}/10` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex flex-col p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Submit your answer</h1>
              <p className="text-sm text-[var(--text-muted)]">Upload sheet photos, type your question/answer, or any combination.</p>
            </div>
            <span className="rounded-md bg-[var(--bg-muted)] px-3 py-1 text-xs">GATE CS</span>
          </div>
          <div className="mt-4 grid flex-1 gap-4 md:grid-cols-2">
            <div className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
              <p className="text-sm font-medium">Question</p>
              <Textarea className="mt-2 min-h-48 border-0 p-0 focus:shadow-none" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Paste the question here…" />
            </div>
            <div className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
              <p className="text-sm font-medium">Your answer</p>
              <Textarea className="mt-2 min-h-48 border-0 p-0 focus:shadow-none" value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Paste your answer here…" />
            </div>
          </div>
          <label
            className={`mt-4 grid min-h-36 cursor-pointer place-items-center rounded-md border border-dashed p-6 text-center transition ${drag ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--bg-elevated)]"}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void handleFiles(e.dataTransfer.files).catch((err) => toast.error(err.message));
            }}
          >
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => e.target.files && void handleFiles(e.target.files).catch((err) => toast.error(err.message))} />
            <ImagePlus className="mx-auto text-[var(--text-muted)]" />
            <p className="mt-2 text-sm">Drop question & answer sheet photos here</p>
            <p className="text-xs text-[var(--text-muted)]">JPG · PNG · WEBP · max 4</p>
            {files.length > 0 && <p className="mt-2 text-xs text-[var(--accent)]">{files.length} file(s) attached</p>}
          </label>
          {extracted && (
            <div className="mt-4">
              <p className="text-sm font-medium">Extracted text</p>
              <Textarea className="mt-2" value={extracted} onChange={(e) => setExtracted(e.target.value)} />
            </div>
          )}
          {step && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--accent)]">
              <Loader size="sm" /> {step}
            </p>
          )}
        </section>

        <aside className="hidden border-l border-[var(--line)] p-4 lg:flex lg:flex-col">
          <p className="text-sm font-medium">Follow-up chat</p>
          <p className="text-xs text-[var(--text-muted)]">0 / 10 free follow-ups</p>
          <div className="mt-10 grid flex-1 place-items-center text-center text-sm text-[var(--text-muted)]">
            <div>
              <MessageCircle className="mx-auto mb-2" />
              Select or submit an evaluation to start chatting
            </div>
          </div>
        </aside>
      </div>
      <div className="border-t border-[var(--line)] bg-[var(--bg)] p-4">
        <Button className="w-full rounded-md py-3" onClick={() => void run().catch((e) => toast.error(e.message))}>
          Evaluate answer →
        </Button>
      </div>
    </div>
  );
}
